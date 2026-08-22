import { Lock } from "lucide-react";

const ROWS = [
  { date: "14/08/2026 · 09:12", text: "Promoção de inverno encerrada", type: "Foto", eng: 4, locked: false },
  { date: "09/08/2026 · 18:40", text: "Aviso de funcionamento no feriado", type: "Texto", eng: 2, locked: false },
  { date: "02/08/2026 · 11:05", text: "Campanha institucional 2025", type: "Vídeo", eng: 148, locked: true },
];

export function DashboardMockup() {
  return (
    <div className="panel overflow-hidden shadow-raised">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        </div>
        <p className="text-[11px] font-medium text-muted-foreground">Limpeza · Página comercial</p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {[
          { label: "Encontradas", value: "612" },
          { label: "Protegidas", value: "37" },
          { label: "Selecionadas", value: "128" },
          { label: "Excluídas", value: "84" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            <p className="stat-number mt-0.5 text-xl text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 px-4 pb-4">
        {ROWS.map((row) => (
          <div
            key={row.text}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
              row.locked ? "border-border bg-muted/50" : "border-primary/30 bg-primary-soft/50"
            }`}
          >
            <span
              className={`h-4 w-4 shrink-0 rounded border ${
                row.locked
                  ? "border-border-strong bg-card"
                  : "border-primary bg-primary text-primary-foreground"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{row.text}</p>
              <p className="text-[11px] text-muted-foreground">
                {row.date} · {row.type} · {row.eng} interações
              </p>
            </div>
            {row.locked && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning">
                <Lock className="h-3 w-3" /> Protegido
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Backup gerado · 128 itens</span>
          <span>72%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full w-[72%] rounded-full bg-primary" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">36 de 50 processadas</p>
          <span className="rounded-md bg-destructive px-2.5 py-1 text-[11px] font-medium text-destructive-foreground">
            Excluir selecionadas
          </span>
        </div>
      </div>
    </div>
  );
}
