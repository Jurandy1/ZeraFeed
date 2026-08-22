import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatNumber } from "@/lib/zerafeed/format";

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  selected,
  protectedCount,
  failedCount,
  onConfirm,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: number;
  protectedCount: number;
  failedCount: number;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Confirmar exclusão</DialogTitle>
          <DialogDescription>
            Excluir permanentemente {formatNumber(selected)}{" "}
            {selected === 1 ? "publicação" : "publicações"}? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/50 p-3 text-center">
          <div>
            <p className="stat-number text-lg text-foreground">{formatNumber(selected)}</p>
            <p className="text-[11px] text-muted-foreground">selecionadas</p>
          </div>
          <div>
            <p className="stat-number text-lg text-foreground">{formatNumber(protectedCount)}</p>
            <p className="text-[11px] text-muted-foreground">protegidas</p>
          </div>
          <div>
            <p className="stat-number text-lg text-foreground">{formatNumber(failedCount)}</p>
            <p className="text-[11px] text-muted-foreground">falhas</p>
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-lg bg-primary-soft px-3 py-2.5 text-xs text-primary">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          O backup JSON é salvo automaticamente no navegador (e no histórico da conta) antes de
          apagar — sem precisar autorizar download.
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={busy || selected === 0} onClick={onConfirm}>
            {busy ? "Excluindo..." : "Excluir agora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
