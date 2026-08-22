import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Database,
  Filter,
  ListChecks,
  ShieldCheck,
} from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { DashboardMockup } from "@/components/marketing/DashboardMockup";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { LOCAL_MODE } from "@/lib/zerafeed/local-config";
import { SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY, SUPPORT_WHATSAPP_URL } from "@/lib/zerafeed/contact";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (LOCAL_MODE) throw redirect({ to: "/cleaner" });
  },
  head: () => ({
    meta: [
      { title: "ZeraFeed — Organize e limpe as publicações da sua Página" },
      {
        name: "description",
        content:
          "Crie conta grátis, conecte sua Página e exclua até 300 publicações no teste. Depois, PRO ilimitado por R$ 20/mês.",
      },
      { property: "og:title", content: "ZeraFeed — Controle suas publicações. Sem complicação." },
      {
        property: "og:description",
        content:
          "Ferramenta profissional para localizar, proteger, arquivar e remover publicações de Páginas do Facebook.",
      },
    ],
  }),
  component: LandingPage,
});

const BENEFITS = [
  {
    icon: Filter,
    title: "Encontre rápido",
    text: "Filtros por período, texto, tipo de publicação e engajamento em uma única tela.",
  },
  {
    icon: ShieldCheck,
    title: "Proteção inteligente",
    text: "Conteúdos definidos como protegidos não entram na exclusão em nenhuma etapa.",
  },
  {
    icon: Database,
    title: "Backup antes de excluir",
    text: "Uma cópia em JSON das publicações selecionadas é gerada antes da operação.",
  },
  {
    icon: ListChecks,
    title: "Exclusão em lote",
    text: "Processamento organizado com progresso, sucessos e falhas visíveis em tempo real.",
  },
];

const STEPS = [
  { n: "01", title: "Crie sua conta", text: "Cadastro em menos de um minuto." },
  { n: "02", title: "Conecte sua Página", text: "Use as permissões oficiais de gerenciamento." },
  { n: "03", title: "Escolha o que remover", text: "Busque, filtre e selecione com segurança." },
  { n: "04", title: "Revise e confirme", text: "Backup, confirmação e acompanhamento." },
];

const DIFF = [
  { title: "Filtro por período", text: "Escolha exatamente o intervalo que deseja analisar." },
  { title: "Proteção automática", text: "Reduza o risco de selecionar conteúdos importantes." },
  { title: "Backup", text: "Tenha uma cópia dos dados selecionados antes da operação." },
  { title: "Controle", text: "Revise tudo antes da exclusão definitiva." },
];

const PLAN_ITEMS = [
  "Gerenciamento de publicações",
  "Filtros avançados",
  "Proteção de conteúdos",
  "Backup antes da exclusão",
  "Exclusão em lote",
  "Histórico das operações",
  "Dashboard completo",
];

const FAQ = [
  {
    q: "O sistema apaga minhas publicações automaticamente?",
    a: "Não. Você escolhe o que deseja processar e confirma a exclusão digitando uma palavra de confirmação.",
  },
  {
    q: "Existe backup antes da exclusão?",
    a: "Sim. Um backup em JSON das publicações selecionadas é gerado e armazenado antes da execução.",
  },
  {
    q: "Posso apagar somente publicações de determinado período?",
    a: "Sim. Você pode buscar todas as publicações ou definir uma data inicial e final.",
  },
  {
    q: "Posso filtrar publicações por engajamento?",
    a: "Sim. Existem filtros de engajamento mínimo, máximo e ordenação por maior ou menor engajamento.",
  },
  {
    q: "Conteúdos protegidos podem ser apagados por engano?",
    a: "A interface impede a seleção de publicações que estejam dentro das regras de proteção configuradas.",
  },
  {
    q: "O sistema garante que minha Página nunca será bloqueada?",
    a: "Não. O ZeraFeed usa apenas mecanismos autorizados de gerenciamento, mas nenhuma ferramenta de terceiros pode garantir risco zero de restrições ou bloqueios.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#recursos" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Produto
            </a>
            <a href="#precos" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Preços
            </a>
            <a href="#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="border-b border-border bg-surface">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:py-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                Gestão de conteúdo para Páginas do Facebook
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
                Organize e limpe suas publicações do Facebook com mais controle.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                Encontre, filtre, faça backup e exclua publicações elegíveis da sua Página em poucos
                passos. Sem ferramentas complicadas e sem processos manuais intermináveis.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link to="/register">
                    Criar conta grátis <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#como-funciona">Ver como funciona</a>
                </Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Uso autorizado por integrações e permissões oficiais de gerenciamento de Páginas.
              </p>
            </div>
            <DashboardMockup />
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section id="recursos" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground">
            Pensado para quem precisa limpar, não complicar.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="panel p-5 transition-shadow duration-200 hover:shadow-raised">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <b.icon className="h-4.5 w-4.5" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-foreground">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="border-y border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Como funciona</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Quatro etapas objetivas, do cadastro à confirmação da limpeza.
            </p>
            <div className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="absolute left-0 right-0 top-4 hidden h-px bg-border lg:block" />
              {STEPS.map((s) => (
                <div key={s.n} className="relative">
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-primary">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONFIANÇA */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Você mantém o controle em cada etapa.
              </h2>
              <ul className="mt-6 space-y-3">
                {[
                  "Conexão por integração oficial de gerenciamento de Páginas",
                  "Permissões visíveis e revogáveis a qualquer momento",
                  "Confirmação explícita antes de qualquer exclusão",
                  "Backup automático das publicações selecionadas",
                  "Histórico completo das operações realizadas",
                  "Proteção de conteúdos importantes por regra configurável",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel space-y-4 p-6">
              <h3 className="text-sm font-semibold text-foreground">Uso responsável</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                O ZeraFeed foi projetado para trabalhar por integrações e permissões oficiais
                disponíveis para o gerenciamento de Páginas. O uso deve respeitar os termos,
                políticas e limites aplicáveis da Meta.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Nenhuma ferramenta de terceiros pode garantir risco zero de restrições ou bloqueios.
                O sistema não contorna mecanismos de segurança da Meta.
              </p>
              <p className="text-xs text-muted-foreground">
                ZeraFeed é um produto independente e não possui vínculo oficial com a Meta
                Platforms.
              </p>
            </div>
          </div>
        </section>

        {/* DIFERENCIAL */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:py-20">
            {DIFF.map((d) => (
              <div key={d.title} className="rounded-xl border border-border bg-card p-5">
                <CalendarRange className="h-4 w-4 text-primary" />
                <h3 className="mt-3 text-[15px] font-semibold text-foreground">{d.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{d.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PREÇO */}
        <section id="precos" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-md text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Comece grátis
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Qualquer pessoa cria conta sem pagar. 300 exclusões no teste.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
            <div className="panel p-7 shadow-raised">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Teste grátis</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="stat-number text-5xl text-foreground">R$ 0</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm text-foreground">
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  Criar conta sem cartão
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  300 exclusões por conta
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  Backup e filtros inclusos
                </li>
              </ul>
              <Button size="lg" className="mt-7 w-full" asChild>
                <Link to="/register">Criar conta grátis</Link>
              </Button>
            </div>
            <div className="panel p-7">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PRO</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="stat-number text-5xl text-foreground">R$ 20</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {PLAN_ITEMS.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
                <li className="flex gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  Exclusões ilimitadas
                </li>
              </ul>
              <Button size="lg" variant="outline" className="mt-7 w-full" asChild>
                <Link to="/register">Começar no grátis</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Liberação PRO via WhatsApp após o teste.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border bg-surface">
          <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Perguntas frequentes
            </h2>
            <Accordion type="single" collapsible className="mt-8">
              {FAQ.map((item, index) => (
                <AccordionItem key={item.q} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left text-[15px]">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Produto independente para gerenciamento autorizado de Páginas. Sem vínculo oficial com
              a Meta Platforms.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href="#recursos" className="transition-colors hover:text-foreground">Produto</a>
            <a href="#precos" className="transition-colors hover:text-foreground">Preços</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
            <a href="/tutorial.html" className="transition-colors hover:text-foreground">Tutorial</a>
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              WhatsApp {SUPPORT_PHONE_DISPLAY}
            </a>
            <Link to="/terms" className="transition-colors hover:text-foreground">Termos de Uso</Link>
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacidade</Link>
          </nav>
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ZeraFeed · Contato {SUPPORT_PHONE} · Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
