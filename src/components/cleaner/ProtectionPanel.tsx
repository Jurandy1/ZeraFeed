import { ShieldCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProtectionSettings } from "@/lib/zerafeed/types";

export function ProtectionPanel({
  value,
  onChange,
}: {
  value: ProtectionSettings;
  onChange: (next: ProtectionSettings) => void;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-soft text-warning">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">Proteções</h2>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prot-recentes" className="text-sm font-medium">
            Proteger publicações mais recentes
          </Label>
          <Input
            id="prot-recentes"
            inputMode="numeric"
            value={String(value.recentCount)}
            onChange={(e) =>
              onChange({ ...value, recentCount: Number(e.target.value.replace(/\D/g, "") || 0) })
            }
          />
          <p className="text-xs text-muted-foreground">
            As N publicações mais novas ficam fora da seleção.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prot-engaja" className="text-sm font-medium">
            Proteger alto engajamento
          </Label>
          <Input
            id="prot-engaja"
            inputMode="numeric"
            value={String(value.engagementLimit)}
            onChange={(e) =>
              onChange({
                ...value,
                engagementLimit: Number(e.target.value.replace(/\D/g, "") || 0),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Use <strong className="font-medium text-foreground">0</strong> para desativar. Com valor
            baixo (ex.: 30), quase tudo fica protegido em Páginas ativas.
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
        Publicações protegidas não podem ser selecionadas para exclusão. Fotos de capa e de perfil
        são sempre protegidas.
      </p>
    </div>
  );
}
