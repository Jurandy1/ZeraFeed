import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/zerafeed/format";

export interface RunState {
  total: number;
  processed: number;
  deleted: number;
  failed: number;
  protectedCount: number;
  log: string[];
  running: boolean;
}

export function ProgressPanel({ run }: { run: RunState }) {
  const [openLog, setOpenLog] = useState(false);
  const percent = run.total === 0 ? 0 : Math.round((run.processed / run.total) * 100);

  return (
    <div className="panel p-6">
      <h2 className="text-base font-semibold text-foreground">
        {run.running ? "Limpando publicações..." : "Processamento finalizado"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatNumber(run.processed)} de {formatNumber(run.total)} processadas
      </p>

      <div className="mt-4 flex items-center gap-3">
        <Progress value={percent} className="h-2 flex-1" />
        <span className="stat-number w-12 text-right text-sm text-foreground">{percent}%</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-success-soft px-3 py-2.5">
          <p className="stat-number text-lg text-success">{formatNumber(run.deleted)}</p>
          <p className="text-[11px] text-muted-foreground">excluídas</p>
        </div>
        <div className="rounded-lg bg-destructive-soft px-3 py-2.5">
          <p className="stat-number text-lg text-destructive">{formatNumber(run.failed)}</p>
          <p className="text-[11px] text-muted-foreground">falharam</p>
        </div>
        <div className="rounded-lg bg-warning-soft px-3 py-2.5">
          <p className="stat-number text-lg text-warning">{formatNumber(run.protectedCount)}</p>
          <p className="text-[11px] text-muted-foreground">protegidas</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpenLog((v) => !v)}
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Log técnico
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${openLog ? "rotate-180" : ""}`}
        />
      </button>
      {openLog && (
        <pre className="mt-2 max-h-52 overflow-auto rounded-lg border border-border bg-muted/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
          {run.log.length ? run.log.join("\n") : "Sem eventos registrados."}
        </pre>
      )}
    </div>
  );
}
