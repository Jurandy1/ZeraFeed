import type { NormalizedPost, ProtectionReason, ProtectionSettings } from "./types";

export interface FilterState {
  tipo: "todos" | "foto" | "video" | "texto" | "link";
  status: "todos" | "pendente" | "protegido" | "apagado" | "falhou";
  texto: string;
  midia: "todos" | "com" | "sem";
  engajamentoMin: string;
  engajamentoMax: string;
  ordem: "recentes" | "antigas" | "maior" | "menor";
  ocultarProtegidos: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  tipo: "todos",
  status: "todos",
  texto: "",
  midia: "todos",
  engajamentoMin: "",
  engajamentoMax: "",
  ordem: "recentes",
  ocultarProtegidos: false,
};

export type ItemStatus = "pendente" | "apagado" | "falhou";

/** Regra de proteção (equivalente a ehProtegido do fluxo original). */
export function protectionReason(
  post: NormalizedPost,
  index: number,
  settings: ProtectionSettings,
): ProtectionReason {
  if (post.isCoverOrProfile) return "capa";
  if (index < settings.recentCount) return "recente";
  if (settings.engagementLimit > 0 && post.engagement >= settings.engagementLimit)
    return "engajamento";
  return null;
}

export const PROTECTION_LABEL: Record<Exclude<ProtectionReason, null>, string> = {
  capa: "Protegido — capa ou foto de perfil",
  recente: "Protegido — publicação recente",
  engajamento: "Protegido — alto engajamento",
};

export interface DecoratedPost extends NormalizedPost {
  protection: ProtectionReason;
  status: ItemStatus;
  errorMessage?: string;
  canDelete: boolean;
}

/** Ordena por data desc (base para "N mais recentes") e aplica proteção + status. */
export function decoratePosts(
  posts: NormalizedPost[],
  settings: ProtectionSettings,
  statuses: Record<string, { status: ItemStatus; errorMessage?: string }>,
): DecoratedPost[] {
  const byDate = [...posts].sort(
    (a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime(),
  );
  return byDate.map((post, index) => {
    const protection = protectionReason(post, index, settings);
    const entry = statuses[post.id];
    const status: ItemStatus = entry?.status ?? "pendente";
    const result: DecoratedPost = {
      ...post,
      protection,
      status,
      canDelete: protection === null && status !== "apagado",
    };
    if (entry?.errorMessage) result.errorMessage = entry.errorMessage;
    return result;
  });
}

export function applyFilters(posts: DecoratedPost[], f: FilterState): DecoratedPost[] {
  const term = f.texto.trim().toLowerCase();
  const min = f.engajamentoMin === "" ? null : Number(f.engajamentoMin);
  const max = f.engajamentoMax === "" ? null : Number(f.engajamentoMax);

  const filtered = posts.filter((p) => {
    if (f.tipo !== "todos" && p.type !== f.tipo) return false;
    if (f.status === "pendente" && (p.status !== "pendente" || p.protection)) return false;
    if (f.status === "protegido" && !p.protection) return false;
    if (f.status === "apagado" && p.status !== "apagado") return false;
    if (f.status === "falhou" && p.status !== "falhou") return false;
    if (term && !p.message.toLowerCase().includes(term)) return false;
    if (f.midia === "com" && !p.hasMedia) return false;
    if (f.midia === "sem" && p.hasMedia) return false;
    if (min !== null && !Number.isNaN(min) && p.engagement < min) return false;
    if (max !== null && !Number.isNaN(max) && p.engagement > max) return false;
    if (f.ocultarProtegidos && p.protection) return false;
    return true;
  });

  const sorted = [...filtered];
  switch (f.ordem) {
    case "antigas":
      sorted.sort((a, b) => +new Date(a.createdTime) - +new Date(b.createdTime));
      break;
    case "maior":
      sorted.sort((a, b) => b.engagement - a.engagement);
      break;
    case "menor":
      sorted.sort((a, b) => a.engagement - b.engagement);
      break;
    default:
      sorted.sort((a, b) => +new Date(b.createdTime) - +new Date(a.createdTime));
  }
  return sorted;
}

export const TYPE_LABEL: Record<string, string> = {
  foto: "Foto",
  video: "Vídeo",
  texto: "Texto",
  link: "Link",
};
