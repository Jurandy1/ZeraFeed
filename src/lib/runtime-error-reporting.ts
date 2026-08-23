/** Relata erros de boundary no console (sem telemetria de terceiros). */
export function reportRuntimeError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[ZeraFeed]", error, context);
}
