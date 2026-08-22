/** Teste grátis: qualquer conta pode criar e apagar até este limite sem pagar. */
export const FREE_DELETE_LIMIT = 300;

/** WhatsApp / PIX para liberar ilimitado */
export const UPGRADE_PHONE = "98984016496";
export const UPGRADE_WHATSAPP_URL = `https://wa.me/55${UPGRADE_PHONE}`;
export const PRO_PRICE_BRL = 20;

export function isUnlimitedPlan(plan?: string | null, status?: string | null): boolean {
  const p = (plan ?? "").toLowerCase();
  const s = (status ?? "").toLowerCase();
  if (p === "pro" && (s === "active" || s === "past_due")) return true;
  if (p === "unlimited" || p === "local") return true;
  return false;
}

export function deletesRemaining(used: number, unlimited: boolean): number | null {
  if (unlimited) return null;
  return Math.max(0, FREE_DELETE_LIMIT - used);
}
