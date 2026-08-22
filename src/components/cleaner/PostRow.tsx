import { ExternalLink, Heart, Image as ImageIcon, Lock, MessageCircle, Share2 } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatDateTime, formatNumber } from "@/lib/zerafeed/format";
import { PROTECTION_LABEL, TYPE_LABEL, type DecoratedPost } from "@/lib/zerafeed/rules";

const STATUS_STYLE: Record<string, string> = {
  apagado: "bg-success-soft text-success",
  falhou: "bg-destructive-soft text-destructive",
  pendente: "bg-muted text-muted-foreground",
};

export function PostRow({
  post,
  selected,
  onToggle,
  selectable = true,
}: {
  post: DecoratedPost;
  selected: boolean;
  onToggle?: (id: string) => void;
  selectable?: boolean;
}) {
  const disabled = !selectable || !post.canDelete;

  return (
    <article
      className={cn(
        "panel flex gap-4 p-4 transition-all duration-200",
        selected && "border-primary/45 shadow-raised ring-1 ring-primary/20",
        post.protection && "bg-muted/40",
        !post.protection && "hover:shadow-raised",
      )}
    >
      {selectable && (
        <div className="pt-1">
          <Checkbox
            checked={selected}
            disabled={disabled}
            onCheckedChange={() => onToggle?.(post.id)}
            aria-label="Selecionar publicação"
          />
        </div>
      )}

      <div className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:block">
        {post.picture ? (
          <img
            src={post.picture}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <time>{formatDateTime(post.createdTime)}</time>
          <span aria-hidden>·</span>
          <span className="rounded-md border border-border px-1.5 py-0.5 font-medium text-foreground">
            {TYPE_LABEL[post.type]}
          </span>
          {post.status !== "pendente" && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 font-medium capitalize",
                STATUS_STYLE[post.status],
              )}
            >
              {post.status === "apagado" ? "Excluída" : "Falhou"}
            </span>
          )}
        </div>

        <p className="mt-1.5 line-clamp-2 text-sm text-foreground">
          {post.message || <span className="text-muted-foreground">Publicação sem texto</span>}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" /> {formatNumber(post.reactions)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> {formatNumber(post.comments)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" /> {formatNumber(post.shares)}
          </span>
          <span className="font-medium text-foreground">
            {formatNumber(post.engagement)} interações
          </span>
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-primary transition-opacity hover:opacity-80"
            >
              Ver no Facebook <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {post.protection && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-warning-soft px-2 py-1 text-[11px] font-medium text-warning">
            <Lock className="h-3 w-3" />
            {PROTECTION_LABEL[post.protection]}
          </p>
        )}
        {post.errorMessage && (
          <p className="mt-2 text-[11px] text-destructive">{post.errorMessage}</p>
        )}
      </div>
    </article>
  );
}
