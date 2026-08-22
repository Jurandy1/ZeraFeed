export type PostType = "foto" | "video" | "texto" | "link";

export interface NormalizedPost {
  id: string;
  message: string;
  createdTime: string;
  permalink: string | null;
  picture: string | null;
  type: PostType;
  hasMedia: boolean;
  reactions: number;
  comments: number;
  shares: number;
  engagement: number;
  isCoverOrProfile: boolean;
}

export interface PageConnection {
  id: string;
  facebookPageId: string;
  pageName: string | null;
  pageUsername: string | null;
  picture: string | null;
  status: string;
  tokenExpiresAt: string | null;
  createdAt: string;
}

export interface ProtectionSettings {
  recentCount: number;
  engagementLimit: number;
}

export const DEFAULT_PROTECTION: ProtectionSettings = {
  recentCount: 5,
  /** 0 = desativado. Valor baixo (ex.: 30) protege quase tudo em Páginas ativas. */
  engagementLimit: 0,
};

export type ProtectionReason = "capa" | "recente" | "engajamento" | null;

export interface DeleteResult {
  id: string;
  ok: boolean;
  error?: string;
}
