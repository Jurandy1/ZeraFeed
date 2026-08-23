import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [src, onClose]);

  if (!src || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Imagem ampliada"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-[101] flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 sm:right-5 sm:top-5"
        aria-label="Fechar"
      >
        <X className="h-6 w-6" />
      </button>
      <img
        src={src}
        alt={alt ?? ""}
        className="max-h-[min(92dvh,100%)] max-w-full rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}

export function ZoomableImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <figure className="overflow-hidden rounded-xl border border-border bg-card">
        {caption ? (
          <figcaption className="border-b border-border bg-muted/40 px-3 py-2 text-[11px] font-medium text-muted-foreground sm:text-xs">
            {caption}
          </figcaption>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`Ampliar: ${alt}`}
        >
          <img src={src} alt={alt} className="block h-auto w-full" loading="lazy" decoding="async" />
        </button>
        <p className="px-3 py-2 text-center text-[11px] text-muted-foreground">Toque para ampliar</p>
      </figure>
      <ImageLightbox src={open ? src : null} alt={alt} onClose={() => setOpen(false)} />
    </>
  );
}
