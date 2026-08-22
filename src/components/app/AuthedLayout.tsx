import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccountOverview, type AccountOverview } from "@/lib/zerafeed/account.functions";
import { LOCAL_MODE, LOCAL_PAGE_NAME } from "@/lib/zerafeed/local-config";

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  trialing: "Período de teste",
  past_due: "Pagamento pendente",
  canceled: "Cancelado",
};

const LOCAL_ACCOUNT: AccountOverview = {
  profile: {
    id: "local-user",
    email: "local@exladrao",
    fullName: LOCAL_PAGE_NAME,
    avatarUrl: null,
    onboardingCompleted: true,
  },
  subscription: {
    plan: "local",
    status: "active",
    price: 0,
    currency: "BRL",
    startedAt: new Date().toISOString(),
    expiresAt: null,
  },
  connectionsCount: 1,
  totals: { deleted: 0, jobs: 0, failed: 0, protected: 0 },
  lastJob: null,
};

export function useAccount() {
  const fetchOverview = useServerFn(getAccountOverview);
  return useQuery<AccountOverview>({
    queryKey: ["account-overview", LOCAL_MODE ? "local" : "cloud"],
    queryFn: async () => {
      if (LOCAL_MODE) return LOCAL_ACCOUNT;
      return fetchOverview();
    },
    staleTime: 30_000,
  });
}

export function planStatusLabel(status?: string | null) {
  if (LOCAL_MODE) return "Modo local · Graph API";
  return STATUS_LABEL[status ?? ""] ?? "Indefinido";
}

export function AuthedLayout({ children }: { children: ReactNode }) {
  const { data, isLoading } = useAccount();

  const user = {
    name: data?.profile.fullName ?? data?.profile.email?.split("@")[0] ?? "Minha conta",
    email: data?.profile.email ?? "",
    planLabel: LOCAL_MODE ? "EX Ladrão" : `Plano ${(data?.subscription?.plan ?? "pro").toUpperCase()}`,
    planStatus: planStatusLabel(data?.subscription?.status),
  };

  return (
    <AppShell user={user}>
      {data || (LOCAL_MODE && !isLoading) ? children : <Skeleton className="h-64 w-full rounded-xl" />}
    </AppShell>
  );
}
