import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { listJobs } from "./account.functions";
import { listConnections } from "./connections.functions";
import { LOCAL_CONNECTION, LOCAL_MODE } from "./local-config";
import type { PageConnection } from "./types";
import type { JobSummary } from "./account.functions";

export function useConnections() {
  const fetchConnections = useServerFn(listConnections);
  return useQuery<PageConnection[]>({
    queryKey: ["connections", LOCAL_MODE ? "local" : "cloud"],
    queryFn: async () => {
      if (LOCAL_MODE) return [LOCAL_CONNECTION];
      return fetchConnections();
    },
    staleTime: 30_000,
  });
}

export function useJobs() {
  const fetchJobs = useServerFn(listJobs);
  return useQuery<JobSummary[]>({
    queryKey: ["jobs", LOCAL_MODE ? "local" : "cloud"],
    queryFn: async () => {
      if (LOCAL_MODE) return [];
      return fetchJobs();
    },
    staleTime: 15_000,
  });
}

export function downloadJson(fileName: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const BACKUP_DB = "zerafeed-backups";
const BACKUP_STORE = "files";

function openBackupDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BACKUP_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BACKUP_STORE)) {
        db.createObjectStore(BACKUP_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB indisponível."));
  });
}

/** Backup silencioso no navegador — sem pedir permissão de download. */
export async function saveBackupAutomatic(fileName: string, content: string): Promise<string> {
  const id = `${Date.now()}-${fileName}`;
  const db = await openBackupDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE, "readwrite");
    tx.objectStore(BACKUP_STORE).put({
      id,
      fileName,
      content,
      createdAt: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Falha ao gravar backup."));
  });
  db.close();
  return id;
}
