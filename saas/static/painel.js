const $ = id => document.getElementById(id);
const LIMITE_TESTE = window.LIMITE_TESTE || 500;
let posts = [];
let selecionadosIds = new Set();
let paginaAtual = 1;
let executando = false;
let pageIdEscolhido = "";

function ehProtegido(post){
  if(post?.motivo_protecao) return post.motivo_protecao;
  if(post && post.protegido) return post.motivo_protecao || "protegido";
  const anexos = post.attachments?.data || [];
  for(const a of anexos){
    const t = (a.type || "").toLowerCase();
    if(t.includes("cover_photo") || t.includes("profile_media") || t.includes("profile_photo")) return "capa/perfil";
  }
  const story = (post.story || "").toLowerCase();
  if(story.includes("foto do perfil") || story.includes("foto de perfil") ||
     story.includes("foto da capa") || story.includes("foto de capa") ||
     story.includes("profile picture") || story.includes("cover photo")) return "capa/perfil";
  return null;
}

function engajamento(post){
  const e = post.engajamento;
  if(e) return e;
  const r = post.reactions?.summary?.total_count || 0;
  const c = post.comments?.summary?.total_count || 0;
  const s = post.shares?.count || 0;
  return {reacoes:r, comentarios:c, shares:s, total:r+c+s};
}

function tipoCategoria(post){
  const a = post.attachments?.data?.[0];
  if(!a) return "texto";
  const t = (a.type||a.media_type||"").toLowerCase();
  if(t.includes("video")) return "video";
  if(t.includes("photo")||t.includes("album")||t.includes("image")) return "foto";
  if(t.includes("share")||t.includes("link")) return "link";
  return "texto";
}

function podeApagar(post){
  if(!post) return false;
  if(ehProtegido(post)) return false;
  if(post.status === "apagado") return false;
  return post.status === "pendente" || post.status === "falhou";
}

function escolherModo(modo){
  const radio = document.querySelector(`input[name=modo][value="${modo}"]`);
  if(radio) radio.checked = true;
  trocarModo();
}

function modoAtual(){
  const el = document.querySelector("input[name=modo]:checked");
  return el ? el.value : "tudo";
}

function trocarModo(){
  const periodo = modoAtual() === "periodo";
  $("painelPeriodo").classList.toggle("hidden", !periodo);
  $("optTudo").classList.toggle("ativo", !periodo);
  $("optPeriodo").classList.toggle("ativo", periodo);
}

document.addEventListener("DOMContentLoaded", () => {
  if($("painelPeriodo")) trocarModo();
});

function tipoLegivel(post){
  const map = {texto:"texto", foto:"foto", video:"vídeo", link:"link"};
  return map[tipoCategoria(post)] || "publicação";
}

function coletarMidia(post){
  const anexos = post.attachments?.data || [];
  let folhas = [];
  for(const a of anexos){
    const sub = a.subattachments?.data || [];
    if(sub.length) folhas = folhas.concat(sub);
    else folhas.push(a);
  }

  function ehVideo(a){
    const t = ((a.type || "") + " " + (a.media_type || "")).toLowerCase();
    return !!(a.media?.source) || t.includes("video");
  }

  for(const a of folhas){
    if(!ehVideo(a)) continue;
    return [{
      kind: "video",
      src: a.media?.source || "",
      poster: a.media?.image?.src || post.full_picture || ""
    }];
  }

  function idMidia(u){
    if(!u) return "";
    const s = String(u);
    const m = s.match(/\/(\d{8,})(?:_|\/|\.)/) || s.match(/(\d{10,})/);
    if(m) return m[1];
    try{
      const x = new URL(s);
      return x.pathname.replace(/\/[sp]\d+x\d+\//gi, "/").split("?")[0];
    }catch(_){
      return s.split("?")[0];
    }
  }

  const fotos = [];
  const visto = new Set();
  for(const a of folhas){
    const img = a.media?.image?.src;
    if(!img) continue;
    const k = idMidia(img);
    if(visto.has(k)) continue;
    visto.add(k);
    fotos.push({kind: "image", src: img, poster: ""});
  }

  const temAlbum = anexos.some(a => (a.subattachments?.data || []).length >= 2);
  if(temAlbum && fotos.length >= 2) return fotos.slice(0, 6);
  if(post.full_picture) return [{kind: "image", src: post.full_picture, poster: ""}];
  if(fotos.length) return [fotos[0]];
  return [];
}

function htmlMidia(post){
  const itens = coletarMidia(post);
  if(!itens.length) return "";
  return `<div class="media-row">${itens.map(m => {
    if(m.kind === "video" && m.src){
      return `<video controls preload="metadata" poster="${escapar(m.poster)}" referrerpolicy="no-referrer">
        <source src="${escapar(m.src)}">
      </video>`;
    }
    if(m.kind === "video"){
      return `<div class="vid-fallback"><img src="${escapar(m.poster || post.full_picture || "")}" alt="" referrerpolicy="no-referrer"><span>vídeo</span></div>`;
    }
    return `<img src="${escapar(m.src)}" alt="" referrerpolicy="no-referrer">`;
  }).join("")}</div>`;
}

function statusBadge(p){
  const motivo = ehProtegido(p);
  if(motivo === "capa/perfil") return `<span class="badge lock">Protegido — capa/perfil</span>`;
  if(motivo === "recente") return `<span class="badge lock">Protegido — recente</span>`;
  if(motivo === "engajamento") return `<span class="badge lock">Protegido — engajamento</span>`;
  if(motivo) return `<span class="badge lock">Protegido — ${escapar(motivo)}</span>`;
  if(p.status === "apagado") return `<span class="badge st-ok">Apagado</span>`;
  if(p.status === "falhou") return `<span class="badge st-fail">Não apagado — falhou</span>`;
  return `<span class="badge st-pend">Não apagado</span>`;
}

function ordenarPosts(){
  const desc = $("ordem").value === "desc";
  posts.sort((a,b)=>{
    const ta = new Date(a.created_time).getTime();
    const tb = new Date(b.created_time).getTime();
    return desc ? (tb - ta) : (ta - tb);
  });
}

function postsFiltrados(){
  const f = $("filtroStatus").value;
  const tipo = $("filtroTipo")?.value || "todos";
  const q = ($("filtroTexto")?.value || "").trim().toLowerCase();
  return posts.filter(p=>{
    if(f === "pendente" && !(p.status === "pendente" && !ehProtegido(p))) return false;
    if(f === "apagado" && p.status !== "apagado") return false;
    if(f === "falhou" && p.status !== "falhou") return false;
    if(f === "protegido" && !ehProtegido(p)) return false;
    if(tipo !== "todos" && tipoCategoria(p) !== tipo) return false;
    if(q){
      const texto = ((p.message||"")+" "+(p.story||"")).toLowerCase();
      if(!texto.includes(q)) return false;
    }
    return true;
  });
}

function porPagina(){
  return Math.max(1, parseInt($("porPagina").value, 10) || 20);
}

function totalPaginas(){
  return Math.max(1, Math.ceil(postsFiltrados().length / porPagina()) || 1);
}

function aplicarOrdem(){ ordenarPosts(); paginaAtual = 1; renderizar({scroll:false}); }
function mudarPorPagina(){ paginaAtual = 1; renderizar({scroll:false}); }
function refazerFiltros(){ paginaAtual = 1; renderizar({scroll:false}); }
function mudarFiltroStatus(){ refazerFiltros(); }
function irParaPagina(n){
  paginaAtual = Math.min(Math.max(1, n), totalPaginas());
  renderizar({scroll:false});
  $("lista").scrollIntoView({behavior:"smooth", block:"start"});
}

async function api(url, opts={}){
  const resp = await fetch(url, {
    credentials: "same-origin",
    headers: {"Content-Type": "application/json", ...(opts.headers||{})},
    ...opts
  });
  const dados = await resp.json().catch(() => ({}));
  if(!resp.ok){
    const err = new Error(dados.erro || "Erro no servidor");
    err.status = resp.status;
    err.body = dados;
    throw err;
  }
  return dados;
}

function mostrarPaginas(paginas){
  const box = $("listaPaginas");
  box.classList.remove("hidden");
  box.innerHTML = "<p class='hint'>Este token acessa várias Páginas. Escolha uma:</p>" +
    paginas.map(p =>
      `<label class="pagina-opt"><input type="radio" name="paginaPick" value="${escapar(p.id)}"> <b>${escapar(p.name||p.id)}</b> <span class="hint">${escapar(p.id)}</span></label>`
    ).join("");
}

async function conectar(ev){
  ev.preventDefault();
  $("statusConexao").className = "status";
  $("statusConexao").textContent = "Testando na Meta…";
  $("btnConectar").disabled = true;
  const pick = document.querySelector("input[name=paginaPick]:checked");
  const page_id = (pick ? pick.value : $("pageId").value.trim()) || pageIdEscolhido;
  try{
    const r = await api("/api/conexao", {
      method: "POST",
      body: JSON.stringify({ token: $("token").value.trim(), page_id })
    });
    if(r.precisa_escolher){
      mostrarPaginas(r.paginas);
      $("statusConexao").textContent = "Escolha a Página e clique em conectar de novo.";
      $("btnConectar").disabled = false;
      return false;
    }
    $("token").value = "";
    $("listaPaginas").classList.add("hidden");
    $("chipNome").textContent = r.page_name;
    $("chipId").textContent = "ID " + r.page_id;
    document.querySelector("#chipPagina .dot").classList.add("on");
    $("blocoLimpador").classList.remove("hidden");
    $("statusConexao").textContent = "Conectado: " + r.page_name;
  }catch(e){
    if(e.body && e.body.paginas){
      mostrarPaginas(e.body.paginas);
    }
    $("statusConexao").textContent = e.message;
    $("statusConexao").className = "status error";
  }
  $("btnConectar").disabled = false;
  return false;
}

async function desconectar(){
  if(!confirm("Desconectar esta Página? O token some do servidor.")) return;
  await api("/api/conexao", {method:"DELETE"});
  location.reload();
}

async function buscarPosts(){
  $("btnBuscar").disabled = true;
  $("statusBusca").className = "status";
  $("statusBusca").textContent = "Buscando no servidor…";
  posts = [];
  selecionadosIds = new Set();
  paginaAtual = 1;
  $("cardLista").classList.add("hidden");
  $("cardExec").classList.add("hidden");

  const params = new URLSearchParams({
    modo: modoAtual(),
    protege_recentes: $("protegeRecentes")?.value || "5",
    protege_engaja: $("protegeEngaja")?.value || "30"
  });
  if(modoAtual() === "periodo"){
    const ini = $("dtInicio").value;
    const fim = $("dtFim").value;
    if(!ini || !fim){
      $("statusBusca").textContent = "Preencha as duas datas.";
      $("statusBusca").className = "status error";
      $("btnBuscar").disabled = false;
      $("painelPeriodo").classList.remove("hidden");
      return;
    }
    params.set("inicio", ini);
    params.set("fim", fim);
  }

  try{
    const dados = await api("/api/posts?" + params.toString());
    posts = (dados.posts || []).map(p => ({...p, status:"pendente", erro:null}));
  }catch(e){
    $("statusBusca").textContent = "Erro: " + e.message;
    $("statusBusca").className = "status error";
    $("btnBuscar").disabled = false;
    return;
  }

  ordenarPosts();
  $("btnBuscar").disabled = false;
  $("statusBusca").textContent = "";
  renderizar();
}

function renderizar({scroll=true}={}){
  const lista = $("lista");
  lista.innerHTML = "";
  const filtrados = postsFiltrados();
  const pages = totalPaginas();
  if(paginaAtual > pages) paginaAtual = pages;

  const inicio = (paginaAtual - 1) * porPagina();
  const pagina = filtrados.slice(inicio, inicio + porPagina());

  if(filtrados.length === 0){
    lista.innerHTML = '<div class="status">Nenhuma publicação neste filtro.</div>';
  }

  pagina.forEach((p)=>{
    const motivo = ehProtegido(p);
    const texto = p.message || p.story || "";
    const jaApagado = p.status === "apagado";
    const falhou = p.status === "falhou";
    const elegivel = podeApagar(p) && !executando;
    const marcado = selecionadosIds.has(p.id);
    const eng = engajamento(p);
    const div = document.createElement("div");
    div.className = "post"
      + (motivo ? " protected" : "")
      + (jaApagado ? " deleted" : "")
      + (falhou ? " failed" : "");
    div.innerHTML = `
      <input type="checkbox" data-id="${escapar(p.id)}"
        ${elegivel ? "" : "disabled"}
        ${marcado && elegivel ? "checked" : ""}
        onchange="toggleSelecao(this)">
      <div class="body">
        <div class="date">${p.created_time.slice(0,10).split("-").reverse().join("/")} · ${p.created_time.slice(11,16)}</div>
        <div class="msg ${texto ? "" : "empty"}">${texto ? escapar(texto.slice(0,180)) + (texto.length>180?"…":"") : "(sem texto — mídia ou link)"}</div>
        ${htmlMidia(p)}
        <div class="hint">👍 ${eng.reacoes} · 💬 ${eng.comentarios} · ↗ ${eng.shares} · total ${eng.total}</div>
        <div class="meta-row">
          ${statusBadge(p)}
          ${motivo ? "" : `<span class="badge type">${tipoLegivel(p)}</span>`}
        </div>
        ${falhou && p.erro ? `<div class="hint" style="color:var(--danger);margin-top:4px">${escapar(p.erro)}</div>` : ""}
        ${p.permalink_url && !jaApagado ? `<br><a class="plink" href="${escapar(p.permalink_url)}" target="_blank" rel="noopener">ver no Facebook ↗</a>` : ""}
      </div>`;
    lista.appendChild(div);
  });

  const pager = $("pager");
  const de = filtrados.length ? inicio + 1 : 0;
  const ate = Math.min(inicio + porPagina(), filtrados.length);
  let botoes = "";
  const janela = 5;
  let iniP = Math.max(1, paginaAtual - Math.floor(janela/2));
  let fimP = Math.min(pages, iniP + janela - 1);
  iniP = Math.max(1, fimP - janela + 1);
  for(let n = iniP; n <= fimP; n++){
    botoes += `<button class="btn-page ${n===paginaAtual?"active":""}" onclick="irParaPagina(${n})" ${n===paginaAtual?"disabled":""}>${n}</button>`;
  }
  pager.innerHTML = `
    <div class="info">Mostrando <b>${de}–${ate}</b> de <b>${filtrados.length}</b> · página <b>${paginaAtual}</b>/${pages}</div>
    <div class="pages">
      <button class="btn-page" onclick="irParaPagina(1)" ${paginaAtual<=1?"disabled":""}>«</button>
      <button class="btn-page" onclick="irParaPagina(${paginaAtual-1})" ${paginaAtual<=1?"disabled":""}>‹</button>
      ${botoes}
      <button class="btn-page" onclick="irParaPagina(${paginaAtual+1})" ${paginaAtual>=pages?"disabled":""}>›</button>
      <button class="btn-page" onclick="irParaPagina(${pages})" ${paginaAtual>=pages?"disabled":""}>»</button>
    </div>`;

  $("cardLista").classList.remove("hidden");
  atualizarSelecao();
  if(scroll) $("cardLista").scrollIntoView({behavior:"smooth"});
}

function escapar(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function postsApagaveis(){
  return posts.filter(p => podeApagar(p) && !ehProtegido(p));
}

function toggleSelecao(cb){
  const id = cb.dataset.id;
  const post = posts.find(p => p.id === id);
  if(!post || !podeApagar(post) || ehProtegido(post)){
    cb.checked = false;
    selecionadosIds.delete(id);
    atualizarSelecao();
    return;
  }
  if(cb.checked) selecionadosIds.add(id);
  else selecionadosIds.delete(id);
  atualizarSelecao();
}

function marcarTodos(v){
  if(v){
    selecionadosIds.clear();
    for(const p of postsApagaveis()) selecionadosIds.add(p.id);
  }else{
    selecionadosIds.clear();
  }
  renderizar({scroll:false});
}

function selecionados(){
  return posts.filter(p => selecionadosIds.has(p.id) && podeApagar(p) && !ehProtegido(p));
}

function atualizarSelecao(){
  for(const id of [...selecionadosIds]){
    const p = posts.find(x => x.id === id);
    if(!p || !podeApagar(p) || ehProtegido(p)) selecionadosIds.delete(id);
  }
  const n = selecionadosIds.size;
  const apagaveis = postsApagaveis().length;
  const pages = totalPaginas();

  $("btnApagar").disabled = n === 0 || executando;
  const top = $("btnApagarTop");
  if(top) top.disabled = n === 0 || executando;

  const banner = $("selBanner");
  if(banner){
    banner.classList.toggle("on", n > 0);
    $("selNum").textContent = String(n);
    $("selTotal").textContent = String(apagaveis);
  }

  $("contagem").innerHTML =
    `<b>${posts.length}</b> no total · ` +
    `<b style="color:var(--accent-dark)">${n}</b> selecionadas · ` +
    `<b>${posts.filter(p => p.status==="pendente" && !ehProtegido(p)).length}</b> não apagadas · ` +
    `<b>${posts.filter(p => p.status==="apagado").length}</b> apagadas · ` +
    `<b>${posts.filter(p => p.status==="falhou").length}</b> falhas · ` +
    `<b>${posts.filter(p => ehProtegido(p)).length}</b> protegidas`;

  if(n === 0) $("statusSel").textContent = "";
  else if(n === apagaveis)
    $("statusSel").textContent = `TODAS as ${n} apagáveis estão selecionadas (${pages} páginas).`;
  else
    $("statusSel").textContent = `${n} de ${apagaveis} selecionadas em todas as páginas.`;
}

function atualizarQuota(q){
  if(!q) return;
  window.QUOTA = q;
  const rest = $("quotaRestantes");
  const fill = $("quotaFill");
  if(q.liberado){
    const card = $("cardQuota");
    if(card) card.innerHTML = "<h2>Plano liberado</h2><p>Exclusões ilimitadas.</p>";
    return;
  }
  if(rest) rest.textContent = String(q.restantes);
  if(fill && q.limite) fill.style.width = Math.min(100, (q.usados / q.limite) * 100) + "%";
}

function abrirConfirmacao(){
  const n = selecionados().length;
  if(!n) return;
  const q = window.QUOTA || {};
  let extra = "";
  if(!q.liberado && typeof q.restantes === "number"){
    if(q.restantes <= 0){
      location.href = "/pagar";
      return;
    }
    if(n > q.restantes){
      extra = ` No teste restam só ${q.restantes}. As demais param até o PIX + comprovante no WhatsApp.`;
    }
  }
  $("modalTexto").textContent =
    `${n} publicaç${n>1?"ões serão apagadas":"ão será apagada"} permanentemente.` + extra +
    " Foto de perfil e capa não entram. Não dá para desfazer.";
  $("confirmInput").value = "";
  $("modal").classList.remove("hidden");
  $("confirmInput").focus();
}
function fecharModal(){ $("modal").classList.add("hidden"); }

const pausa = ms => new Promise(r => setTimeout(r, ms));

function logar(msg, cls){
  const log = $("log");
  const linha = document.createElement("div");
  if(cls) linha.className = cls;
  linha.textContent = msg;
  log.appendChild(linha);
  log.scrollTop = log.scrollHeight;
}

async function deletarUm(id){
  const eng = $("protegeEngaja")?.value || "0";
  const resp = await fetch(`/api/posts/${encodeURIComponent(id)}?protege_engaja=${encodeURIComponent(eng)}`, {
    method: "DELETE",
    credentials: "same-origin"
  });
  return resp.json();
}

function snapshotBackup(lista){
  return lista.map(p => ({
    id: p.id,
    created_time: p.created_time,
    message: p.message || null,
    story: p.story || null,
    permalink_url: p.permalink_url || null,
    full_picture: p.full_picture || null,
    tipo: tipoCategoria(p),
    engajamento: engajamento(p)
  }));
}

function baixarBackupSelecionados(){
  const alvo = selecionados();
  if(!alvo.length){
    alert("Selecione publicações para gerar o backup.");
    return;
  }
  const agora = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
  const blob = new Blob([JSON.stringify({gerado_em:new Date().toISOString(), total:alvo.length, posts:snapshotBackup(alvo)}, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `backup-limpador-${agora}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function executarExclusao(){
  if($("confirmInput").value.trim() !== "APAGAR"){
    $("confirmInput").style.outline = "2px solid var(--danger)";
    return;
  }
  fecharModal();
  const alvo = selecionados().filter(p => !ehProtegido(p) && podeApagar(p));
  if(!alvo.length){
    $("statusSel").textContent = "Nada para apagar.";
    return;
  }

  baixarBackupSelecionados();

  executando = true;
  $("btnApagar").disabled = true;
  $("btnBuscar").disabled = true;
  $("cardExec").classList.remove("hidden");
  $("log").innerHTML = "";
  logar(`Backup baixado (${alvo.length}). Apagando…`, "ok");
  $("cardExec").scrollIntoView({behavior:"smooth"});
  renderizar({scroll:false});

  let ok = 0, falha = 0, ignorados = 0;

  for(let i = 0; i < alvo.length; i++){
    const p = alvo[i];
    if(ehProtegido(p)){
      ignorados++;
      selecionadosIds.delete(p.id);
      logar(`[${i+1}/${alvo.length}] BLOQUEADO — ${ehProtegido(p)}`, "warn");
      continue;
    }

    $("statusExec").textContent = `Apagando ${i+1} de ${alvo.length}…`;
    $("barra").style.width = ((i+1)/alvo.length*100) + "%";

    try{
      let r = await deletarUm(p.id);

      if(r.code && [4,17,32,613].includes(r.code)){
        logar(`[${i+1}/${alvo.length}] limite da API — aguardando 60s…`, "warn");
        $("statusExec").textContent = "Pausa 60s (limite da API)…";
        await pausa(60*1000);
        r = await deletarUm(p.id);
      }

      if(r.ok){
        ok++;
        p.status = "apagado";
        p.erro = null;
        selecionadosIds.delete(p.id);
        logar(`[${i+1}/${alvo.length}] apagada — ${p.created_time.slice(0,10)}`, "ok");
        if(r.quota) atualizarQuota(r.quota);
      }else if(r.limite){
        falha++;
        p.status = "falhou";
        p.erro = r.erro;
        logar(`[${i+1}/${alvo.length}] LIMITE DO TESTE — ${r.erro}`, "warn");
        if(r.quota) atualizarQuota(r.quota);
        $("statusExec").textContent = "Limite de 500 do teste. Faça o PIX e mande o comprovante no WhatsApp.";
        break;
      }else{
        falha++;
        p.status = "falhou";
        p.erro = r.erro || "erro desconhecido";
        logar(`[${i+1}/${alvo.length}] falhou: ${p.erro}`, "err");
      }
    }catch(e){
      falha++;
      p.status = "falhou";
      p.erro = e.message;
      logar(`[${i+1}/${alvo.length}] erro de rede: ${e.message}`, "err");
    }

    renderizar({scroll:false});
    if(i < alvo.length - 1) await pausa(450);
  }

  $("statusExec").textContent =
    `Concluído — ${ok} apagadas, ${falha} falhas` + (ignorados ? `, ${ignorados} bloqueadas` : "") + ".";
  logar(`\nFim: ${ok} apagadas, ${falha} falhas` + (ignorados ? `, ${ignorados} protegidas` : "") + ".");
  executando = false;
  $("btnBuscar").disabled = false;
  renderizar({scroll:false});
}
