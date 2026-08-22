import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label="ZeraFeed">
      <img
        src="/logo-zerafeed.png"
        alt="ZeraFeed — Apague suas postagens do Facebook"
        className={cn(
          "shrink-0 rounded-full object-cover shadow-sm ring-1 ring-border/60",
          compact ? "h-8 w-8" : "h-10 w-10 sm:h-11 sm:w-11",
        )}
      />
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold tracking-tight text-foreground">ZeraFeed</span>
          <span className="hidden text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:block">
            Limpeza de Páginas
          </span>
        </span>
      )}
    </span>
  );
}
