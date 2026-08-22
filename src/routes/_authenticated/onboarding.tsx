import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Link2, ListChecks, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { useConnections } from "@/lib/zerafeed/hooks";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Primeiros passos — ZeraFeed" },
      { name: "description", content: "Configure sua conta ZeraFeed em três etapas e prepare sua primeira limpeza." },
      { property: "og:title", content: "Primeiros passos — ZeraFeed" },
      { property: "og:description", content: "Guia rápido para conectar sua Página e iniciar a organização do feed." },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = [
  {
    icon: Link2,
    title: "Conecte sua Página",
    description:
      "Informe o ID e o token da Página com as permissões oficiais da Meta. As credenciais ficam armazenadas de forma isolada no servidor.",
  },
  {
    icon: ShieldCheck,
    title: "Defina suas proteções",
    description:
      "Escolha quantas publicações recentes manter e a partir de qual engajamento uma publicação nunca poderá ser excluída.",
  },
  {
    icon: ListChecks,
    title: "Revise e execute",
    description:
      "Filtre, selecione, baixe o backup em JSON e confirme a exclusão. Cada operação fica registrada no histórico.",
  },
];

function OnboardingPage() {
  const connections = useConnections();
  const connected = (connections.data?.length ?? 0) > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Primeiros passos"
        description="Três etapas rápidas para deixar sua conta pronta para uso."
      />

      <ol className="space-y-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="panel flex gap-4 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <step.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {index + 1}. {step.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </div>
            {index === 0 && connected && (
              <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-success" />
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to={connected ? "/cleaner" : "/connections"}>
            {connected ? "Iniciar primeira limpeza" : "Conectar minha Página"}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard">Ir para o painel</Link>
        </Button>
      </div>
    </div>
  );
}
