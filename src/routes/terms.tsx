import { Link, createFileRoute } from "@tanstack/react-router";

import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — ZeraFeed" },
      { name: "description", content: "Condições de uso do ZeraFeed, serviço de gestão e exclusão organizada de publicações de Páginas do Facebook." },
      { property: "og:title", content: "Termos de Uso — ZeraFeed" },
      { property: "og:description", content: "Leia as condições de uso do serviço ZeraFeed." },
    ],
  }),
  component: TermsPage,
});

const SECTIONS = [
  {
    title: "1. Objeto",
    body: "O ZeraFeed é um serviço de software que permite ao titular de uma Página do Facebook localizar, revisar e excluir publicações por meio das integrações oficiais da Meta. O serviço não é afiliado à Meta Platforms, Inc.",
  },
  {
    title: "2. Elegibilidade e responsabilidade",
    body: "O uso é permitido apenas a administradores legítimos das Páginas conectadas. O usuário é integralmente responsável pelas publicações que decidir excluir e declara possuir autorização para fazê-lo.",
  },
  {
    title: "3. Caráter irreversível das exclusões",
    body: "Exclusões realizadas por meio da Graph API são definitivas e não podem ser desfeitas pelo ZeraFeed. O backup em JSON gerado antes de cada operação preserva apenas o conteúdo textual e os metadados disponíveis, não restaurando publicações no Facebook.",
  },
  {
    title: "4. Assinatura e pagamento",
    body: "O plano PRO custa R$ 20,00 por mês, com renovação automática. O cancelamento pode ser solicitado a qualquer momento e o acesso permanece ativo até o término do período já pago.",
  },
  {
    title: "5. Uso aceitável",
    body: "É vedado utilizar o serviço para burlar limites da Meta, automatizar acessos não autorizados ou processar Páginas de terceiros sem consentimento. O descumprimento pode resultar em suspensão imediata.",
  },
  {
    title: "6. Disponibilidade",
    body: "O funcionamento depende da disponibilidade e das políticas da Graph API da Meta. Interrupções, alterações de permissões ou limites impostos pela plataforma podem afetar temporariamente o serviço.",
  },
  {
    title: "7. Alterações",
    body: "Estes termos podem ser atualizados. Mudanças relevantes serão comunicadas por e-mail ou dentro do aplicativo antes de entrarem em vigor.",
  },
];

function TermsPage() {
  return (
    <LegalShell title="Termos de Uso" updatedAt="Atualizado em janeiro de 2026">
      {SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
        </section>
      ))}
    </LegalShell>
  );
}

export function LegalShell({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link to="/">
            <Logo />
          </Link>
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Entrar
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{updatedAt}</p>
        <div className="mt-10 space-y-8">{children}</div>
      </main>
    </div>
  );
}
