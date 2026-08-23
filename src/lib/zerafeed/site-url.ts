/** URL pública do app (confirmação de e-mail / reset de senha). */
export const PRODUCTION_APP_URL = "https://zera-feed.vercel.app";

export function getAppOrigin(): string {
  const fromEnv = (import.meta.env.VITE_APP_URL as string | undefined)?.trim().replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    // Em produção/preview, usa o origin atual; em local, prefere env ou produção
    // para links de e-mail não apontarem para localhost.
    if (!isLocal) return origin;
  }
  return fromEnv || PRODUCTION_APP_URL;
}

/** Destino dos links de e-mail do Supabase Auth. */
export function getAuthEmailRedirectTo(nextPath = "/tutorial"): string {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${getAppOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
}
