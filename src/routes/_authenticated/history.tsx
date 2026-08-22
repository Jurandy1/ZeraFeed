import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, History } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/States";
import { Button } from "@/components/ui/button";
import { downloadBackup } from "@/lib/zerafeed/account.functions";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/zerafeed/format";
import { downloadJson, useJobs } from "@/lib/zerafeed/hooks";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Histórico — ZeraFeed" },
      { name: "description", content: "Consulte todas as operações de limpeza executadas e baixe os backups gerados." },
      { property: "og:title", content: "Histórico — ZeraFeed" },
      { property: "og:description", content: "Registro completo das operações e backups do ZeraFeed." },
    ],
  }),
  component: HistoryPage,
});

const STATUS: Record<string, { label: string; className: string }> = {
  completed: { label: "Concluída", className: "bg-success-soft text-success" },
  partial: { label: "Parcial", className: "bg-warning-soft text-warning" },
  failed: { label: "Falhou", className: "bg-destructive-soft text-destructive" },
  running: { label: "Em andamento", className: "bg-primary-soft text-primary" },
};

function HistoryPage() {
  const jobs = useJobs();
  const fetchBackup = useServerFn(downloadBackup);

  async function onDownload(jobId: string) {
    try {
      const result = await fetchBackup({ data: { jobId } });
      downloadJson(result.fileName, result.json);
    } catch (error) {
      toast.error("Backup indisponível", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Histórico"
        description="Todas as operações executadas na sua conta, com resultados e backups."
      />

      {jobs.isLoading && <LoadingState rows={3} />}
      {jobs.isError && <ErrorState error={jobs.error} onRetry={() => void jobs.refetch()} />}
      {jobs.data?.length === 0 && (
        <EmptyState
          icon={History}
          title="Nenhuma operação registrada"
          description="Assim que você executar uma limpeza, o resumo aparecerá aqui."
        />
      )}

      {!!jobs.data?.length && (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Página</th>
                <th className="px-5 py-3 font-medium">Selecionadas</th>
                <th className="px-5 py-3 font-medium">Excluídas</th>
                <th className="px-5 py-3 font-medium">Falhas</th>
                <th className="px-5 py-3 font-medium">Duração</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Backup</th>
              </tr>
            </thead>
            <tbody>
              {jobs.data.map((job) => {
                const status = STATUS[job.status] ?? {
                  label: job.status,
                  className: "bg-muted text-muted-foreground",
                };
                return (
                  <tr key={job.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 text-foreground">{formatDateTime(job.startedAt)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{job.pageName ?? "—"}</td>
                    <td className="px-5 py-3.5 stat-number">{formatNumber(job.totalSelected)}</td>
                    <td className="px-5 py-3.5 stat-number text-success">
                      {formatNumber(job.totalDeleted)}
                    </td>
                    <td className="px-5 py-3.5 stat-number text-destructive">
                      {formatNumber(job.totalFailed)}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {formatDuration(job.startedAt, job.finishedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => void onDownload(job.id)}>
                        <Download className="h-4 w-4" /> JSON
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
