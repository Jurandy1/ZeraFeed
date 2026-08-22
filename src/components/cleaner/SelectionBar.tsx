import { Download, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/zerafeed/format";

export function SelectionBar({
  count,
  onBackup,
  onDelete,
  onClear,
  busy,
}: {
  count: number;
  onBackup: () => void;
  onDelete: () => void;
  onClear: () => void;
  busy?: boolean;
}) {
  if (count === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6">
      <div className="pointer-events-auto mx-auto flex w-full max-w-3xl animate-in flex-col gap-3 rounded-xl border border-border bg-card p-3.5 shadow-overlay duration-200 slide-in-from-bottom-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpar seleção"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-sm font-medium text-foreground">
            {formatNumber(count)} {count === 1 ? "publicação selecionada" : "publicações selecionadas"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={onBackup}>
            <Download className="h-4 w-4" /> Baixar backup
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={onDelete}
            disabled={busy}
          >
            <Trash2 className="h-4 w-4" /> Excluir selecionadas
          </Button>
        </div>
      </div>
    </div>
  );
}
