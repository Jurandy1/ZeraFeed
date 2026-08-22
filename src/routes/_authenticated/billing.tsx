import { createFileRoute } from "@tanstack/react-router";
import { Check, MessageCircle } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { planStatusLabel, useAccount } from "@/components/app/AuthedLayout";
import { Button } from "@/components/ui/button";
import {
  FREE_DELETE_LIMIT,
  PRO_PRICE_BRL,
  UPGRADE_PHONE,
  UPGRADE_WHATSAPP_URL,
} from "@/lib/zerafeed/billing";
import { BRL, formatDate, formatNumber } from "@/lib/zerafeed/format";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Assinatura — ZeraFeed" },
      {
        name: "description",
        content: `Teste grátis com ${FREE_DELETE_LIMIT} exclusões. Plano PRO ilimitado por R$ ${PRO_PRICE_BRL}/mês.`,
      },
    ],
  }),
  component: BillingPage,
});

const INCLUDED = [
  "Criar conta grátis, sem cartão",
  `${FREE_DELETE_LIMIT} exclusões no teste grátis`,
  "Conexão com Páginas do Facebook",
  "Filtros, proteções e backup automático",
  "Histórico de operações",
  "Plano PRO ilimitado quando quiser",
];

function BillingPage() {
  const { data } = useAccount();
  const subscription = data?.subscription;
  const usage = data?.usage;
  const unlimited = usage?.unlimited ?? false;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Assinatura"
        description="Comece grátis. Pague só se precisar de exclusões ilimitadas."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <section className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Plano atual
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {unlimited ? "ZeraFeed PRO" : "Teste grátis"}
          </p>
          <p className="stat-number mt-3 text-3xl text-foreground">
            {unlimited ? BRL.format(PRO_PRICE_BRL) : BRL.format(0)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {unlimited ? "/mês" : " · sem cobrança"}
            </span>
          </p>

          {!unlimited && (
            <div className="mt-5 rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exclusões usadas</span>
                <span className="font-semibold text-foreground">
                  {formatNumber(usage?.deletesUsed ?? 0)} / {formatNumber(FREE_DELETE_LIMIT)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, ((usage?.deletesUsed ?? 0) / FREE_DELETE_LIMIT) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Restam {formatNumber(usage?.deletesRemaining ?? FREE_DELETE_LIMIT)} exclusões no
                teste grátis.
              </p>
            </div>
          )}

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
          </dl>

          {!unlimited && (
            <Button asChild className="mt-6 w-full">
              <a href={UPGRADE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Liberar ilimitado · WhatsApp {UPGRADE_PHONE}
              </a>
            </Button>
          )}
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
          <p className="mt-6 text-sm text-muted-foreground">
            Após o teste, o plano PRO custa {BRL.format(PRO_PRICE_BRL)}/mês com exclusões
            ilimitadas. PIX/WhatsApp: {UPGRADE_PHONE}.
          </p>
        </section>
      </div>
    </div>
  );
}
