import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, Link2, ListChecks, MessageCircle, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_WHATSAPP_URL } from "@/lib/zerafeed/contact";
import { useConnections } from "@/lib/zerafeed/hooks";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Primeiros passos — ZeraFeed" },
      {
        name: "description",
        content: "Configure sua conta ZeraFeed e prepare sua primeira limpeza.",
      },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = [
  {
    icon: BookOpen,
    title: "Siga o tutorial da Meta",
    description:
      "Obtenha o ID da Página e o Token permanente no Meta for Developers. O guia está no menu Tutorial.",
  },
  {
    icon: Link2,
    title: "Conecte sua Página",
    description:
      "Informe o ID e o token da Página em Conexões. As credenciais ficam armazenadas de forma isolada no servidor.",
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
        description="Configure sua conta e conecte a Página com o tutorial oficial."
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
            {index === 1 && connected && (
              <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-success" />
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/tutorial">
            <BookOpen className="h-4 w-4" /> Abrir tutorial
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={connected ? "/cleaner" : "/connections"}>
            {connected ? "Iniciar primeira limpeza" : "Conectar minha Página"}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> WhatsApp {SUPPORT_PHONE_DISPLAY}
          </a>
        </Button>
      </div>
    </div>
  );
}
