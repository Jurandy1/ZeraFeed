import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [word, setWord] = useState("");
  useEffect(() => {
    if (!open) setWord("");
  }, [open]);

  const ready = word.trim().toUpperCase() === "APAGAR";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Confirmar exclusão</DialogTitle>
          <DialogDescription>
            Você está prestes a excluir permanentemente {formatNumber(selected)}{" "}
            {selected === 1 ? "publicação" : "publicações"}. Esta ação não pode ser desfeita.
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
          Um backup em JSON será gerado e salvo automaticamente antes da execução.
        </p>

        <div className="space-y-2">
          <Label htmlFor="confirm-word" className="text-sm">
            Digite <span className="font-semibold text-foreground">APAGAR</span> para confirmar
          </Label>
          <Input
            id="confirm-word"
            value={word}
            autoComplete="off"
            maxLength={12}
            onChange={(e) => setWord(e.target.value)}
            placeholder="APAGAR"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={!ready || busy} onClick={onConfirm}>
            {busy ? "Excluindo..." : "Excluir permanentemente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
