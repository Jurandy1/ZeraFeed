/**
 * Modo local = nossa realidade atual (EX Ladrão + token no front).
 * Liga o design ZeraFeed à Graph API sem Supabase.
 * Desligue (VITE_LOCAL_MODE=false) quando for usar o SaaS completo.
 */
import type { PageConnection } from "./types";

export const LOCAL_MODE =
  (import.meta.env.VITE_LOCAL_MODE ?? "true").toString().toLowerCase() !== "false";

export const LOCAL_PAGE_ID =
  (import.meta.env.VITE_LOCAL_PAGE_ID as string | undefined)?.trim() ||
  "1628634290760049";

export const LOCAL_PAGE_NAME =
  (import.meta.env.VITE_LOCAL_PAGE_NAME as string | undefined)?.trim() || "EX Ladrão";

/** Token de Página — mesmo do limpador HTML. Troque quando expirar. */
export const LOCAL_PAGE_TOKEN =
  (import.meta.env.VITE_LOCAL_PAGE_TOKEN as string | undefined)?.trim() ||
  "EAAenSqxhjI8BSDmxUZBUvmFdgs2ijNyKEb2SvsY8t2IVIZBlxGWUxVsfrznZCcMQbJoIRZCvO3epZAbpdFNWIpVDqAp8ugF9au1k0ZBUYhm19vXnIgt2mfbZCgT4ghHqPMG9mjIPufS4HC6WS2mapUb1q5Yev51TGU9EqejBeHShfyYEPU8G9LaXErlTSFtRV4o56ZC0ofXyRxmKUzQwMDyaTzj9";

export const LOCAL_CONNECTION_ID = "local-ex-ladrao";

export const LOCAL_CONNECTION: PageConnection = {
  id: LOCAL_CONNECTION_ID,
  facebookPageId: LOCAL_PAGE_ID,
  pageName: LOCAL_PAGE_NAME,
  pageUsername: "ExLadrao",
  picture: null,
  status: "active",
  tokenExpiresAt: null,
  createdAt: new Date().toISOString(),
};
