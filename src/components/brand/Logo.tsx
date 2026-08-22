import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
          <path
            d="M3.5 4.5h13l-6.2 6.6v5.4l-3.4-1.9v-3.5L3.5 4.5Z"
            fill="currentColor"
            opacity="0.95"
          />
        </svg>
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">ZeraFeed</span>
      )}
    </span>
  );
}
