import { ExternalLink, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { ZoomableImage } from "@/components/tutorial/ImageLightbox";
import { Button } from "@/components/ui/button";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_WHATSAPP_URL } from "@/lib/zerafeed/contact";

const PRINTS = {
  detalhes: { src: "/prints/01_detalhes.png", alt: "Tela Detalhes do app", caption: "Tela · Detalhes do app" },
  casos: { src: "/prints/02_casos_uso.png", alt: "Casos de uso", caption: "Tela · Casos de uso" },
  empresa: { src: "/prints/03_empresa.png", alt: "Portfólio empresarial", caption: "Tela · Empresa" },
  requisitos: { src: "/prints/04_requisitos.png", alt: "Requisitos", caption: "Tela · Requisitos" },
  visao: { src: "/prints/05_visao_geral.png", alt: "Visão geral", caption: "Tela · Visão geral" },
  credenciais: {
    src: "/prints/06_painel_credenciais.png",
    alt: "Credenciais do app",
    caption: "Configurações do App › Básico",
  },
  idPagina: { src: "/prints/07_id_pagina.png", alt: "ID da Página", caption: "Sobre · Transparência da Página" },
  app: { src: "/prints/08_selecionar_app.png", alt: "Selecionar app", caption: "Graph API Explorer · App" },
  perms: { src: "/prints/09_permissoes.png", alt: "Permissões", caption: "Graph API Explorer · Permissões" },
} as const;

function Callout({
  tone,
  children,
}: {
  tone: "info" | "warn" | "ok";
  children: React.ReactNode;
}) {
  const styles =
    tone === "warn"
      ? "border-warning/40 bg-warning-soft text-warning"
      : tone === "ok"
        ? "border-success/40 bg-success-soft text-success"
        : "border-primary/30 bg-primary-soft text-primary";
  return (
    <div className={`rounded-xl border px-3 py-3 text-sm leading-relaxed sm:px-4 ${styles}`}>
      <div className="text-foreground/90">{children}</div>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 sm:gap-4">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <h3 className="text-[15px] font-semibold text-foreground sm:text-base">{title}</h3>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}

function Section({
  part,
  title,
  lead,
  children,
}: {
  part: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 border-b border-border pb-8 last:border-0 last:pb-0">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{part}</p>
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        <p className="text-sm text-muted-foreground sm:text-[15px]">{lead}</p>
      </header>
      <ol className="space-y-6">{children}</ol>
    </section>
  );
}

export function TutorialGuide() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 sm:space-y-10">
      <div className="space-y-3">
        <p className="inline-flex rounded-md border border-primary/30 bg-primary-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
          Guia de conexão
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Conectar sua Página do Facebook
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Siga este passo a passo (~15 min) para obter o ID da Página e o Token permanente. Toque nas
          imagens para ampliar.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/connections">Ir para Conexões</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> WhatsApp {SUPPORT_PHONE_DISPLAY}
            </a>
          </Button>
          <Button asChild variant="ghost" className="w-full sm:w-auto">
            <a href="/tutorial.html" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Versão em tela cheia
            </a>
          </Button>
        </div>
      </div>

      <Section
        part="Parte 01"
        title="Criar o aplicativo na Meta"
        lead="Faça uma vez. O mesmo app serve para todas as suas Páginas."
      >
        <Step n="1" title="Abra o Meta for Developers">
          <p>
            Entre em{" "}
            <a
              className="font-medium text-primary underline-offset-2 hover:underline"
              href="https://developers.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              developers.facebook.com
            </a>{" "}
            com a conta que administra a Página.
          </p>
        </Step>
        <Step n="2" title="Criar App → Detalhes">
          <p>
            Em <b className="text-foreground">Meus Apps</b>, clique em <b className="text-foreground">Criar App</b>.
            Nomeie (ex.: ZeraFeed Integração) e confirme o e-mail.
          </p>
          <ZoomableImage {...PRINTS.detalhes} />
        </Step>
        <Step n="3" title="Casos de uso">
          <p>
            Em <b className="text-foreground">Gerenciamento de conteúdo</b>, marque só{" "}
            <b className="text-foreground">Gerenciar tudo na sua Página</b>.
          </p>
          <ZoomableImage {...PRINTS.casos} />
        </Step>
        <Step n="4" title="Empresa e requisitos">
          <p>Escolha não conectar a um portfólio empresarial e avance nos requisitos.</p>
          <ZoomableImage {...PRINTS.empresa} />
          <ZoomableImage {...PRINTS.requisitos} />
        </Step>
        <Step n="5" title="Criar e copiar credenciais">
          <p>
            Confira a visão geral e crie o app. Em <b className="text-foreground">Configurações → Básico</b>,
            copie o <b className="text-foreground">ID do Aplicativo</b> e a{" "}
            <b className="text-foreground">Chave Secreta</b> (Mostrar). Guarde em local seguro — não cole no
            ZeraFeed.
          </p>
          <ZoomableImage {...PRINTS.visao} />
          <ZoomableImage {...PRINTS.credenciais} />
          <Callout tone="warn">
            A Chave Secreta é como uma senha. Não compartilhe em prints ou WhatsApp.
          </Callout>
        </Step>
      </Section>

      <Section
        part="Parte 02"
        title="Achar o ID da Página"
        lead="É o número público da Página — vai no primeiro campo do ZeraFeed."
      >
        <Step n="1" title="Sobre → Transparência da Página">
          <p>
            Na Página, abra <b className="text-foreground">Sobre</b> →{" "}
            <b className="text-foreground">Transparência da Página</b>. Copie o número em Identificação da
            Página.
          </p>
          <ZoomableImage {...PRINTS.idPagina} />
        </Step>
      </Section>

      <Section
        part="Parte 03"
        title="Gerar o Token de Acesso"
        lead="Use o Graph API Explorer com o app que você criou."
      >
        <Step n="1" title="Abrir o Explorer">
          <p>
            <a
              className="font-medium text-primary underline-offset-2 hover:underline"
              href="https://developers.facebook.com/tools/explorer"
              target="_blank"
              rel="noopener noreferrer"
            >
              developers.facebook.com/tools/explorer
            </a>
          </p>
        </Step>
        <Step n="2" title="Selecionar o app">
          <p>No campo App da Meta, escolha o aplicativo criado na Parte 01.</p>
          <ZoomableImage {...PRINTS.app} />
        </Step>
        <Step n="3" title="Marcar as 3 permissões">
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <code className="text-foreground">pages_manage_posts</code>
            </li>
            <li>
              <code className="text-foreground">pages_read_engagement</code>
            </li>
            <li>
              <code className="text-foreground">pages_manage_engagement</code>
            </li>
          </ul>
          <ZoomableImage {...PRINTS.perms} />
        </Step>
        <Step n="4" title="Generate Access Token">
          <p>
            Autorize e <b className="text-foreground">marque a Página</b> na lista. Copie o token que começa
            com <code className="text-foreground">EAA</code> (vale ~1 hora).
          </p>
          <Callout tone="warn">
            Se a Página não for marcada na autorização, o token não funciona no ZeraFeed.
          </Callout>
        </Step>
      </Section>

      <Section
        part="Parte 04"
        title="Converter em Token permanente"
        lead="Duas URLs no navegador transformam o token curto em token da Página que não expira."
      >
        <Step n="1" title="Trocar por token longo">
          <p className="break-all rounded-lg bg-muted p-3 font-mono text-[11px] text-foreground sm:text-xs">
            https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=
            <span className="text-primary">ID_DO_APP</span>
            &client_secret=
            <span className="text-primary">CHAVE_SECRETA</span>
            &fb_exchange_token=
            <span className="text-primary">TOKEN_CURTO</span>
          </p>
          <p>Copie o novo <code className="text-foreground">access_token</code> da resposta.</p>
        </Step>
        <Step n="2" title="Token permanente da Página">
          <p className="break-all rounded-lg bg-muted p-3 font-mono text-[11px] text-foreground sm:text-xs">
            https://graph.facebook.com/v25.0/me/accounts?access_token=
            <span className="text-primary">TOKEN_LONGO</span>
          </p>
          <p>
            Na lista, pegue o <code className="text-foreground">access_token</code> da Página desejada. No{" "}
            <a
              className="font-medium text-primary underline-offset-2 hover:underline"
              href="https://developers.facebook.com/tools/debug/accesstoken"
              target="_blank"
              rel="noopener noreferrer"
            >
              Token Debugger
            </a>
            , o campo Expira deve mostrar <b className="text-foreground">Nunca</b>.
          </p>
          <Callout tone="ok">Esse é o token que você cola no ZeraFeed.</Callout>
        </Step>
      </Section>

      <Section
        part="Parte 05"
        title="Colar no ZeraFeed"
        lead="Só ID da Página + Token permanente da Página."
      >
        <Step n="1" title="Menu Conexões">
          <p>
            Abra <b className="text-foreground">Conexões</b>, cole o ID e o token e clique em conectar. Não
            use ID do app, chave secreta ou token de perfil pessoal.
          </p>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/connections">Abrir Conexões agora</Link>
          </Button>
        </Step>
      </Section>
    </div>
  );
}
