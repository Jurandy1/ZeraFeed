"""
Limpador de Página — SaaS com pagamento e token colado pelo cliente.
O token da Graph API nunca vai para o HTML: fica criptografado no SQLite.
"""
from __future__ import annotations

import json
import hmac
import os
import re
import sqlite3
import secrets
import time
from datetime import datetime, timedelta, timezone
from functools import wraps
from pathlib import Path
from urllib.parse import quote

import requests
from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv
from flask import (
    Flask,
    g,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

GRAPH = "https://graph.facebook.com/v25.0"
DB_PATH = ROOT / "dados.db"

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY") or secrets.token_hex(32)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=14)

PRECO_REAIS = int(os.environ.get("PRECO_REAIS", "47"))
DIAS_ACESSO = int(os.environ.get("DIAS_ACESSO", "30"))
BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:5000").rstrip("/")
app.config["SESSION_COOKIE_SECURE"] = BASE_URL.startswith("https://")
PIX_CHAVE = os.environ.get("PIX_CHAVE", "988984016496").strip() or "988984016496"
PIX_NOME = os.environ.get("PIX_NOME", "").strip()
PIX_CIDADE = os.environ.get("PIX_CIDADE", "").strip()
WHATSAPP_NUMERO = os.environ.get("WHATSAPP_NUMERO", "988984016496").strip() or "988984016496"
LIMITE_TESTE = int(os.environ.get("LIMITE_TESTE", "500"))
ADMIN_EMAIL = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD") or ""
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "").strip()
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "").strip()
STRIPE_PRICE_ID = os.environ.get("STRIPE_PRICE_ID", "").strip()

_fernet_raw = (os.environ.get("FERNET_KEY") or "").strip().encode()
if not _fernet_raw:
    raise RuntimeError("Defina FERNET_KEY no arquivo .env")
FERNET = Fernet(_fernet_raw)

_last_delete: dict[int, float] = {}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime | None) -> str | None:
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


def db() -> sqlite3.Connection:
    if "db" not in g:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        g.db = conn
    return g.db


@app.teardown_appcontext
def close_db(_exc=None):
    conn = g.pop("db", None)
    if conn is not None:
        conn.close()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            paid_until TEXT,
            deletes_usados INTEGER NOT NULL DEFAULT 0,
            liberado INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS connections (
            user_id INTEGER PRIMARY KEY,
            page_id TEXT NOT NULL,
            page_name TEXT NOT NULL,
            token_enc TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS access_codes (
            code TEXT PRIMARY KEY,
            days INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            used_by INTEGER,
            used_at TEXT,
            FOREIGN KEY (used_by) REFERENCES users(id)
        );
        """
    )
    cols = [r[1] for r in conn.execute("PRAGMA table_info(users)")]
    if "deletes_usados" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN deletes_usados INTEGER NOT NULL DEFAULT 0")
    if "liberado" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN liberado INTEGER NOT NULL DEFAULT 0")
    conn.commit()
    conn.close()


def get_user(user_id: int) -> sqlite3.Row | None:
    return db().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def current_user() -> sqlite3.Row | None:
    uid = session.get("uid")
    if not uid:
        return None
    return get_user(uid)


def is_liberado(user: sqlite3.Row | None) -> bool:
    if not user:
        return False
    if int(user["liberado"] or 0):
        return True
    return has_access(user)


def quota_dict(user: sqlite3.Row | None) -> dict:
    if not user:
        return {"liberado": False, "usados": 0, "limite": LIMITE_TESTE, "restantes": LIMITE_TESTE}
    usados = int(user["deletes_usados"] or 0)
    if is_liberado(user):
        return {"liberado": True, "usados": usados, "limite": None, "restantes": None}
    restantes = max(0, LIMITE_TESTE - usados)
    return {
        "liberado": False,
        "usados": usados,
        "limite": LIMITE_TESTE,
        "restantes": restantes,
    }


def whatsapp_link(email: str = "") -> str:
    num = re.sub(r"\D", "", WHATSAPP_NUMERO)
    if not num.startswith("55"):
        num = "55" + num
    texto = (
        "Olá! Fiz o PIX do Limpador de Página. Segue o comprovante."
        + (f" Meu e-mail: {email}." if email else "")
    )
    return f"https://wa.me/{num}?text={quote(texto)}"


def has_access(user: sqlite3.Row | None) -> bool:
    if not user or not user["paid_until"]:
        return False
    until = parse_dt(user["paid_until"])
    return until is not None and until > utcnow()


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user():
            if request.path.startswith("/api/"):
                return jsonify({"erro": "Faça login."}), 401
            return redirect(url_for("login", next=request.path))
        return fn(*args, **kwargs)

    return wrapper


def paid_required(fn):
    """Mantido só por compatibilidade — o teste usa a conta logo após o cadastro."""
    return login_required(fn)


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("admin"):
            return redirect(url_for("admin_login"))
        return fn(*args, **kwargs)

    return wrapper


def encrypt_token(token: str) -> str:
    return FERNET.encrypt(token.encode()).decode()


def decrypt_token(blob: str) -> str:
    return FERNET.decrypt(blob.encode()).decode()


def get_connection(user_id: int) -> sqlite3.Row | None:
    return db().execute(
        "SELECT page_id, page_name, token_enc, updated_at FROM connections WHERE user_id = ?",
        (user_id,),
    ).fetchone()


def page_token(user_id: int) -> tuple[str, str, str] | None:
    row = get_connection(user_id)
    if not row:
        return None
    try:
        token = decrypt_token(row["token_enc"])
    except InvalidToken:
        return None
    return row["page_id"], row["page_name"], token


def graph_get(path: str, token: str, **params):
    q = {"access_token": token, **{k: v for k, v in params.items() if v is not None}}
    r = requests.get(f"{GRAPH}/{path.lstrip('/')}", params=q, timeout=60)
    return r.json()


def graph_delete(path: str, token: str):
    r = requests.delete(
        f"{GRAPH}/{path.lstrip('/')}",
        params={"access_token": token},
        timeout=60,
    )
    return r.json()


def graph_error(data: dict) -> str | None:
    err = data.get("error") if isinstance(data, dict) else None
    if not err:
        return None
    return err.get("message") or "Erro na Graph API"


def post_protegido(post: dict) -> str | None:
    anexos = ((post.get("attachments") or {}).get("data")) or []
    for a in anexos:
        t = (a.get("type") or "").lower()
        if any(x in t for x in ("cover_photo", "profile_media", "profile_photo")):
            return "capa/perfil"
    story = (post.get("story") or "").lower()
    chaves = (
        "foto do perfil",
        "foto de perfil",
        "foto da capa",
        "foto de capa",
        "profile picture",
        "cover photo",
    )
    if any(k in story for k in chaves):
        return "capa/perfil"
    return None


def engajamento_post(post: dict) -> dict:
    r = ((post.get("reactions") or {}).get("summary") or {}).get("total_count") or 0
    c = ((post.get("comments") or {}).get("summary") or {}).get("total_count") or 0
    s = ((post.get("shares") or {}).get("count")) or 0
    return {"reacoes": int(r), "comentarios": int(c), "shares": int(s), "total": int(r) + int(c) + int(s)}


def enriquecer_post(post: dict) -> dict:
    post = dict(post)
    motivo = post_protegido(post)
    post["protegido"] = bool(motivo)
    post["motivo_protecao"] = motivo
    post["engajamento"] = engajamento_post(post)
    return post


CAMPOS_POST = (
    "id,message,story,created_time,permalink_url,full_picture,status_type,is_published,"
    "attachments{type,media_type,url,media,subattachments{type,media_type,url,media}},"
    "reactions.summary(true).limit(0),comments.summary(true).limit(0),shares"
)


def estender_acesso(user_id: int, dias: int):
    user = get_user(user_id)
    agora = utcnow()
    atual = parse_dt(user["paid_until"]) if user else None
    base = atual if atual and atual > agora else agora
    novo = base + timedelta(days=dias)
    db().execute(
        "UPDATE users SET paid_until = ?, liberado = 1 WHERE id = ?",
        (iso(novo), user_id),
    )
    db().commit()


def liberar_ilimitado(user_id: int):
    db().execute("UPDATE users SET liberado = 1 WHERE id = ?", (user_id,))
    db().commit()


def ctx_user():
    user = current_user()
    q = quota_dict(user)
    return {
        "user": user,
        "acesso": is_liberado(user),
        "quota": q,
        "limite_teste": LIMITE_TESTE,
        "preco": PRECO_REAIS,
        "dias": DIAS_ACESSO,
        "stripe_ok": bool(STRIPE_SECRET_KEY),
        "pix_chave": PIX_CHAVE,
        "pix_nome": PIX_NOME,
        "pix_cidade": PIX_CIDADE,
        "whatsapp_numero": WHATSAPP_NUMERO,
        "whatsapp_url": whatsapp_link(user["email"] if user else ""),
    }


@app.context_processor
def inject_globals():
    return ctx_user()


# ── páginas ──────────────────────────────────────────────

@app.get("/")
def landing():
    return render_template("landing.html")


@app.route("/cadastro", methods=["GET", "POST"])
def cadastro():
    if current_user():
        return redirect(url_for("painel"))
    erro = ""
    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        senha = request.form.get("senha") or ""
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            erro = "E-mail inválido."
        elif len(senha) < 8:
            erro = "A senha precisa ter pelo menos 8 caracteres."
        else:
            try:
                db().execute(
                    "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
                    (email, generate_password_hash(senha), iso(utcnow())),
                )
                db().commit()
            except sqlite3.IntegrityError:
                erro = "Já existe uma conta com este e-mail."
            else:
                uid = db().execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()["id"]
                session["uid"] = uid
                session.permanent = True
                return redirect(url_for("painel"))
    return render_template("auth.html", modo="cadastro", erro=erro)


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user():
        return redirect(url_for("painel"))
    erro = ""
    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        senha = request.form.get("senha") or ""
        row = db().execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if not row or not check_password_hash(row["password_hash"], senha):
            erro = "E-mail ou senha incorretos."
        else:
            session["uid"] = row["id"]
            session.permanent = True
            dest = request.args.get("next") or url_for("painel")
            if not dest.startswith("/"):
                dest = url_for("painel")
            return redirect(dest)
    return render_template("auth.html", modo="login", erro=erro)


@app.get("/sair")
def sair():
    session.clear()
    return redirect(url_for("landing"))


@app.route("/pagar", methods=["GET", "POST"])
@login_required
def pagar():
    user = current_user()
    if is_liberado(user) and request.method == "GET" and not request.args.get("renovar"):
        return redirect(url_for("painel"))

    erro = ""
    if request.method == "POST" and request.form.get("acao") == "codigo":
        code = (request.form.get("codigo") or "").strip().upper()
        row = db().execute("SELECT * FROM access_codes WHERE code = ?", (code,)).fetchone()
        if not row:
            erro = "Código inválido."
        elif row["used_by"]:
            erro = "Este código já foi usado."
        else:
            estender_acesso(user["id"], int(row["days"]))
            db().execute(
                "UPDATE access_codes SET used_by = ?, used_at = ? WHERE code = ?",
                (user["id"], iso(utcnow()), code),
            )
            db().commit()
            return redirect(url_for("painel", ok="acesso"))
    return render_template("pagar.html", erro=erro)


@app.post("/pagar/stripe")
@login_required
def pagar_stripe():
    if not STRIPE_SECRET_KEY:
        return redirect(url_for("pagar"))
    import stripe

    stripe.api_key = STRIPE_SECRET_KEY
    user = current_user()
    kwargs = {
        "mode": "payment",
        "success_url": BASE_URL + url_for("painel") + "?ok=pago",
        "cancel_url": BASE_URL + url_for("pagar"),
        "client_reference_id": str(user["id"]),
        "customer_email": user["email"],
        "metadata": {"user_id": str(user["id"]), "dias": str(DIAS_ACESSO)},
    }
    if STRIPE_PRICE_ID:
        kwargs["line_items"] = [{"price": STRIPE_PRICE_ID, "quantity": 1}]
    else:
        kwargs["line_items"] = [
            {
                "price_data": {
                    "currency": "brl",
                    "unit_amount": PRECO_REAIS * 100,
                    "product_data": {
                        "name": f"Limpador de Página — {DIAS_ACESSO} dias",
                    },
                },
                "quantity": 1,
            }
        ]
    sess = stripe.checkout.Session.create(**kwargs)
    return redirect(sess.url, code=303)


@app.post("/webhook/stripe")
def webhook_stripe():
    if not STRIPE_SECRET_KEY or not STRIPE_WEBHOOK_SECRET:
        return "desativado", 404
    import stripe

    payload = request.get_data()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        return "assinatura inválida", 400
    if event["type"] == "checkout.session.completed":
        obj = event["data"]["object"]
        uid = int(obj.get("metadata", {}).get("user_id") or obj.get("client_reference_id") or 0)
        dias = int(obj.get("metadata", {}).get("dias") or DIAS_ACESSO)
        if uid:
            estender_acesso(uid, dias)
    return "", 200


@app.get("/painel")
@login_required
def painel():
    user = current_user()
    conn = get_connection(user["id"])
    conexao = None
    if conn:
        conexao = {"page_id": conn["page_id"], "page_name": conn["page_name"]}
    return render_template("painel.html", conexao=conexao)


# ── API (token só no servidor) ───────────────────────────

@app.get("/api/me")
@login_required
def api_me():
    user = current_user()
    conn = get_connection(user["id"])
    return jsonify(
        {
            "email": user["email"],
            "acesso": is_liberado(user),
            "paid_until": user["paid_until"],
            "quota": quota_dict(user),
            "conexao": (
                {"page_id": conn["page_id"], "page_name": conn["page_name"]}
                if conn
                else None
            ),
        }
    )


@app.post("/api/conexao")
@paid_required
def api_conexao():
    user = current_user()
    body = request.get_json(silent=True) or {}
    token = (body.get("token") or "").strip()
    page_id = (body.get("page_id") or "").strip()
    if not token or len(token) < 20:
        return jsonify({"erro": "Cole o token completo da Página."}), 400

    me = graph_get("me", token, fields="id,name")
    err = graph_error(me)
    if err:
        return jsonify({"erro": "Token recusado pela Meta: " + err}), 400

    page_token_final = token
    page_name = me.get("name") or ""
    resolved_id = str(me.get("id") or "")

    contas = graph_get("me/accounts", token, fields="id,name,access_token")
    paginas = contas.get("data") or []

    if paginas:
        if page_id:
            escolhida = next((p for p in paginas if str(p.get("id")) == page_id), None)
            if not escolhida:
                return jsonify(
                    {
                        "erro": "Essa Página não está neste token.",
                        "paginas": [{"id": p["id"], "name": p.get("name")} for p in paginas],
                    }
                ), 400
            resolved_id = str(escolhida["id"])
            page_name = escolhida.get("name") or page_name
            page_token_final = escolhida.get("access_token") or token
        elif len(paginas) == 1:
            resolved_id = str(paginas[0]["id"])
            page_name = paginas[0].get("name") or page_name
            page_token_final = paginas[0].get("access_token") or token
        else:
            return jsonify(
                {
                    "precisa_escolher": True,
                    "paginas": [{"id": p["id"], "name": p.get("name")} for p in paginas],
                }
            )
    elif page_id and page_id != resolved_id:
        pagina = graph_get(page_id, token, fields="id,name")
        err = graph_error(pagina)
        if err:
            return jsonify({"erro": "Não consegui acessar esse Page ID: " + err}), 400
        resolved_id = str(pagina["id"])
        page_name = pagina.get("name") or page_name

    if not resolved_id:
        return jsonify({"erro": "Não foi possível identificar a Página neste token."}), 400

    db().execute(
        """
        INSERT INTO connections (user_id, page_id, page_name, token_enc, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            page_id = excluded.page_id,
            page_name = excluded.page_name,
            token_enc = excluded.token_enc,
            updated_at = excluded.updated_at
        """,
        (user["id"], resolved_id, page_name, encrypt_token(page_token_final), iso(utcnow())),
    )
    db().commit()
    return jsonify({"page_id": resolved_id, "page_name": page_name})


@app.delete("/api/conexao")
@paid_required
def api_conexao_apagar():
    user = current_user()
    db().execute("DELETE FROM connections WHERE user_id = ?", (user["id"],))
    db().commit()
    return jsonify({"ok": True})


@app.get("/api/posts")
@paid_required
def api_posts():
    user = current_user()
    dados = page_token(user["id"])
    if not dados:
        return jsonify({"erro": "Conecte a Página primeiro."}), 400
    page_id, _nome, token = dados

    modo = (request.args.get("modo") or "tudo").strip()
    params = {
        "fields": CAMPOS_POST,
        "limit": "100",
    }
    if modo == "periodo":
        ini = request.args.get("inicio") or ""
        fim = request.args.get("fim") or ""
        if not ini or not fim:
            return jsonify({"erro": "Preencha as duas datas."}), 400
        if ini > fim:
            return jsonify({"erro": "A data inicial não pode ser depois da final."}), 400
        params["since"] = ini + "T00:00:00"
        params["until"] = fim + "T23:59:59"

    posts = []
    url = f"{GRAPH}/{page_id}/posts"
    q = {"access_token": token, **params}
    try:
        while url:
            r = requests.get(url, params=q if q else None, timeout=60)
            q = None
            body = r.json()
            err = graph_error(body)
            if err:
                return jsonify({"erro": err}), 400
            for p in body.get("data") or []:
                posts.append(enriquecer_post(p))
            nxt = (body.get("paging") or {}).get("next")
            url = nxt
    except requests.RequestException as e:
        return jsonify({"erro": "Falha de rede com a Meta: " + str(e)}), 502

    # marcar N mais recentes como protegidos (cliente manda o N)
    recentes = max(0, min(50, int(request.args.get("protege_recentes") or 0)))
    min_eng = max(0, int(request.args.get("protege_engaja") or 0))
    if recentes or min_eng:
        ordenados = sorted(
            posts,
            key=lambda p: p.get("created_time") or "",
            reverse=True,
        )
        recent_ids = {p["id"] for p in ordenados[:recentes]}
        for p in posts:
            if p["id"] in recent_ids and not p.get("motivo_protecao"):
                p["protegido"] = True
                p["motivo_protecao"] = "recente"
            elif min_eng and (p.get("engajamento") or {}).get("total", 0) >= min_eng and not p.get("motivo_protecao"):
                p["protegido"] = True
                p["motivo_protecao"] = "engajamento"

    return jsonify({"page_id": page_id, "posts": posts, "total": len(posts)})


@app.delete("/api/posts/<post_id>")
@paid_required
def api_apagar_post(post_id: str):
    user = current_user()
    dados = page_token(user["id"])
    if not dados:
        return jsonify({"erro": "Conecte a Página primeiro."}), 400
    page_id, _nome, token = dados

    if not post_id or "/" in post_id or " " in post_id:
        return jsonify({"erro": "ID inválido."}), 400
    if not (post_id.startswith(page_id) or post_id.isdigit() or "_" in post_id):
        return jsonify({"erro": "ID inválido."}), 400

    agora = time.time()
    ultimo = _last_delete.get(user["id"], 0)
    if agora - ultimo < 0.4:
        time.sleep(0.4 - (agora - ultimo))
    _last_delete[user["id"]] = time.time()

    atual = graph_get(
        post_id,
        token,
        fields="id,story,attachments{type,media_type},reactions.summary(true).limit(0),comments.summary(true).limit(0),shares",
    )
    err = graph_error(atual)
    if err:
        return jsonify({"ok": False, "erro": err}), 400
    motivo = post_protegido(atual)
    if motivo:
        return jsonify({"ok": False, "erro": f"Protegido ({motivo}) — não apaga."}), 403
    min_eng = max(0, int(request.args.get("protege_engaja") or request.headers.get("X-Protege-Engaja") or 0))
    if min_eng and engajamento_post(atual)["total"] >= min_eng:
        return jsonify({"ok": False, "erro": "Protegido (engajamento) — não apaga."}), 403

    # backup leve no servidor (só metadados)
    backup = {
        "id": atual.get("id") or post_id,
        "story": atual.get("story"),
        "engajamento": engajamento_post(atual),
        "apagado_em": iso(utcnow()),
        "user_id": user["id"],
    }
    bak = ROOT / "backups"
    bak.mkdir(exist_ok=True)
    (bak / f"{post_id.replace('/', '_')}-{int(time.time())}.json").write_text(
        json.dumps(backup, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    user = get_user(user["id"])
    q = quota_dict(user)
    if not q["liberado"] and q["restantes"] <= 0:
        return jsonify(
            {
                "ok": False,
                "limite": True,
                "erro": (
                    f"Conta teste: você já apagou {LIMITE_TESTE} publicações. "
                    f"Faça um PIX para {PIX_CHAVE} (o mesmo do WhatsApp) e envie o comprovante no WhatsApp para liberarmos."
                ),
                "quota": q,
                "pix": PIX_CHAVE,
                "whatsapp": WHATSAPP_NUMERO,
                "whatsapp_url": whatsapp_link(user["email"]),
            }
        ), 402

    result = graph_delete(post_id, token)
    err = graph_error(result)
    if err:
        code = (result.get("error") or {}).get("code")
        return jsonify({"ok": False, "erro": err, "code": code}), 400
    if result.get("success"):
        db().execute(
            "UPDATE users SET deletes_usados = deletes_usados + 1 WHERE id = ?",
            (user["id"],),
        )
        db().commit()
        return jsonify({"ok": True, "quota": quota_dict(get_user(user["id"]))})
    return jsonify({"ok": False, "erro": "A Meta não confirmou a exclusão."}), 400


# ── admin ────────────────────────────────────────────────

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        return "Admin não configurado no .env", 503
    erro = ""
    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        senha = request.form.get("senha") or ""
        senha_ok = (
            len(senha) == len(ADMIN_PASSWORD)
            and hmac.compare_digest(senha.encode("utf-8"), ADMIN_PASSWORD.encode("utf-8"))
        )
        if email == ADMIN_EMAIL and senha_ok:
            session["admin"] = True
            return redirect(url_for("admin"))
        erro = "Dados incorretos."
    return render_template("admin_login.html", erro=erro)


@app.get("/admin")
@admin_required
def admin():
    novos = session.pop("codigos_novos", [])
    users = db().execute(
        """
        SELECT u.id, u.email, u.paid_until, u.created_at,
               u.deletes_usados, u.liberado,
               c.page_id, c.page_name
        FROM users u
        LEFT JOIN connections c ON c.user_id = u.id
        ORDER BY u.id DESC
        """
    ).fetchall()
    codes = db().execute(
        """
        SELECT a.code, a.days, a.created_at, a.used_at, u.email AS used_email
        FROM access_codes a
        LEFT JOIN users u ON u.id = a.used_by
        ORDER BY a.created_at DESC
        LIMIT 50
        """
    ).fetchall()
    agora = utcnow()
    lista = []
    for u in users:
        until = parse_dt(u["paid_until"])
        lista.append(
            {
                **dict(u),
                "liberado": bool(u["liberado"]),
                "usados": int(u["deletes_usados"] or 0),
                "ativo": bool(u["liberado"]) or (until is not None and until > agora),
            }
        )
    return render_template("admin.html", users=lista, codes=codes, novos=novos)


@app.post("/admin/codigo")
@admin_required
def admin_codigo():
    qtd = max(1, min(20, int(request.form.get("qtd") or 1)))
    dias = max(1, min(365, int(request.form.get("dias") or DIAS_ACESSO)))
    gerados = []
    for _ in range(qtd):
        code = "LIMP-" + secrets.token_hex(3).upper()
        db().execute(
            "INSERT INTO access_codes (code, days, created_at) VALUES (?, ?, ?)",
            (code, dias, iso(utcnow())),
        )
        gerados.append(code)
    db().commit()
    session["codigos_novos"] = gerados
    return redirect(url_for("admin"))


@app.post("/admin/liberar")
@admin_required
def admin_liberar():
    uid = int(request.form.get("user_id") or 0)
    if uid:
        liberar_ilimitado(uid)
    return redirect(url_for("admin"))


init_db()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
