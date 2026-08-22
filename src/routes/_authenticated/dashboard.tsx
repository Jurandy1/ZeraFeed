import { Link, createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eraser,
  Link2,
  ListChecks,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState } from "@/components/app/States";
import { useAccount } from "@/components/app/AuthedLayout";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/zerafeed/format";
import { useConnections } from "@/lib/zerafeed/hooks";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Visão geral — ZeraFeed" },
      { name: "description", content: "Acompanhe publicações encontradas, protegidas, selecionadas e excluídas da sua Página." },
      { property: "og:title", content: "Visão geral — ZeraFeed" },
      { property: "og:description", content: "Painel de controle das operações de limpeza da sua Página." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data } = useAccount();
  const connections = useConnections();
  const page = connections.data?.[0];
  const last = data?.lastJob;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Olá, ${data?.profile.fullName?.split(" ")[0] ?? "bem-vindo"}`}
        description="Gerencie suas publicações com mais controle."
        actions={
          <Button asChild>
            <Link to="/cleaner">
              <Eraser className="h-4 w-4" /> Nova limpeza
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Publicações encontradas"
          value={last?.totalFound ?? 0}
          hint="Última busca registrada"
          icon={ListChecks}
          tone="primary"
        />
        <StatCard
          label="Protegidas"
          value={data?.totals.protected ?? 0}
          hint="Fora da seleção por regra"
          icon={ShieldCheck}
          tone="warning"
        />
        <StatCard
          label="Selecionadas"
          value={last?.totalSelected ?? 0}
          hint="Na última operação"
          icon={CheckCircle2}
        />
        <StatCard
          label="Já excluídas"
          value={data?.totals.deleted ?? 0}
          hint="Total acumulado"
          icon={Trash2}
          tone="success"
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Última operação</h2>
            {last && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/history">Ver histórico</Link>
              </Button>
            )}
          </div>
          {last ? (
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatDateTime(last.startedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Selecionadas</p>
                <p className="stat-number mt-1 text-lg text-foreground">
                  {formatNumber(last.totalSelected)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sucesso / Falhas</p>
                <p className="mt-1 text-sm font-medium">
                  <span className="text-success">{formatNumber(last.totalDeleted)}</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-destructive">{formatNumber(last.totalFailed)}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duração</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatDuration(last.startedAt, last.finishedAt)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              Nenhuma operação registrada até agora. Faça sua primeira limpeza para ver o resumo
              aqui.
            </p>
          )}
        </div>

        <div className="panel p-6">
          <h2 className="text-sm font-semibold text-foreground">Página conectada</h2>
          {page ? (
            <div className="mt-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-lg border border-border bg-muted">
                  {page.picture && <img src={page.picture} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {page.pageName ?? "Página"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {page.pageUsername ? `@${page.pageUsername}` : page.facebookPageId}
                  </p>
                </div>
              </div>
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Conexão ativa
              </p>
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link to="/connections">Gerenciar</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Link2}
                title="Nenhuma Página conectada"
                description="Conecte uma Página para começar."
                action={
                  <Button asChild size="sm">
                    <Link to="/connections">Conectar Página</Link>
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </section>

      <section className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {data?.usage?.unlimited
              ? "Plano PRO · ilimitado"
              : `Teste grátis · ${data?.usage?.deletesRemaining ?? 300} exclusões restantes`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data?.usage?.unlimited
              ? "R$ 20,00/mês · gerencie sua assinatura a qualquer momento."
              : `Usadas ${data?.totals.deleted ?? 0} de 300. Crie conta grátis — pague só se precisar de mais.`}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/billing">Ver assinatura</Link>
        </Button>
      </section>
    </div>
  );
}
