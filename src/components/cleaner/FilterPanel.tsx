import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DEFAULT_FILTERS, type FilterState } from "@/lib/zerafeed/rules";

const TIPOS: Array<{ value: FilterState["tipo"]; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "foto", label: "Fotos" },
  { value: "video", label: "Vídeos" },
  { value: "texto", label: "Texto" },
  { value: "link", label: "Links" },
];

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function FilterPanel({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const set = <K extends keyof FilterState>(key: K, v: FilterState[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tipo
        </Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TIPOS.map((t) => (
            <FilterChip key={t.value} active={value.tipo === t.value} onClick={() => set("tipo", t.value)}>
              {t.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filtro-texto" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Texto
        </Label>
        <Input
          id="filtro-texto"
          value={value.texto}
          maxLength={120}
          placeholder="Buscar no conteúdo"
          onChange={(e) => set("texto", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </Label>
          <Select value={value.status} onValueChange={(v) => set("status", v as FilterState["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Não apagados</SelectItem>
              <SelectItem value="protegido">Protegidos</SelectItem>
              <SelectItem value="apagado">Apagados</SelectItem>
              <SelectItem value="falhou">Falharam</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mídia
          </Label>
          <Select value={value.midia} onValueChange={(v) => set("midia", v as FilterState["midia"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="com">Com mídia</SelectItem>
              <SelectItem value="sem">Sem mídia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="eng-min" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Engajamento mín.
          </Label>
          <Input
            id="eng-min"
            inputMode="numeric"
            value={value.engajamentoMin}
            placeholder="0"
            onChange={(e) => set("engajamentoMin", e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eng-max" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Engajamento máx.
          </Label>
          <Input
            id="eng-max"
            inputMode="numeric"
            value={value.engajamentoMax}
            placeholder="—"
            onChange={(e) => set("engajamentoMax", e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ordenação
        </Label>
        <Select value={value.ordem} onValueChange={(v) => set("ordem", v as FilterState["ordem"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recentes">Mais recentes</SelectItem>
            <SelectItem value="antigas">Mais antigas</SelectItem>
            <SelectItem value="maior">Maior engajamento</SelectItem>
            <SelectItem value="menor">Menor engajamento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2.5">
        <Label htmlFor="ocultar" className="text-sm font-normal text-foreground">
          Ocultar protegidos
        </Label>
        <Switch
          id="ocultar"
          checked={value.ocultarProtegidos}
          onCheckedChange={(v) => set("ocultarProtegidos", v)}
        />
      </div>

      <Button variant="outline" className="w-full" onClick={() => onChange({ ...DEFAULT_FILTERS })}>
        Limpar filtros
      </Button>
    </div>
  );
}
