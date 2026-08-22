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
