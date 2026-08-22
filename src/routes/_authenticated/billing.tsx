import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { planStatusLabel, useAccount } from "@/components/app/AuthedLayout";
import { Button } from "@/components/ui/button";
import { BRL, formatDate } from "@/lib/zerafeed/format";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Assinatura — ZeraFeed" },
      { name: "description", content: "Detalhes do plano PRO do ZeraFeed por R$ 20,00 por mês." },
      { property: "og:title", content: "Assinatura — ZeraFeed" },
      { property: "og:description", content: "Gerencie o plano e o faturamento da sua conta ZeraFeed." },
    ],
  }),
  component: BillingPage,
});

const INCLUDED = [
  "Conexão oficial com Páginas do Facebook",
  "Busca paginada de todo o histórico de publicações",
  "Filtros por tipo, período, engajamento e texto",
  "Regras de proteção configuráveis",
  "Backup em JSON antes de cada exclusão",
  "Histórico completo de operações",
];

function BillingPage() {
  const { data } = useAccount();
  const subscription = data?.subscription;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Assinatura"
        description="Plano único, sem surpresas. Cancele quando quiser."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <section className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Plano atual
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            ZeraFeed {(subscription?.plan ?? "pro").toUpperCase()}
          </p>
          <p className="stat-number mt-3 text-3xl text-foreground">
            {BRL.format(subscription?.price ?? 20)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">/mês</span>
          </p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium text-foreground">
                {planStatusLabel(subscription?.status)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Início</dt>
              <dd className="font-medium text-foreground">{formatDate(subscription?.startedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Próxima renovação</dt>
              <dd className="font-medium text-foreground">
                {subscription?.expiresAt ? formatDate(subscription.expiresAt) : "—"}
              </dd>
            </div>
          </dl>
          <Button variant="outline" className="mt-6 w-full" disabled>
            Gerenciar pagamento (em breve)
          </Button>
        </section>

        <section className="panel p-6">
          <h2 className="text-sm font-semibold text-foreground">O que está incluído</h2>
          <ul className="mt-4 space-y-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground">
            Cobrança mensal recorrente. O acesso permanece ativo até o fim do período pago em caso
            de cancelamento.
          </p>
        </section>
      </div>
    </div>
  );
}
