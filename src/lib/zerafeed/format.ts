export const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDuration(startIso?: string | null, endIso?: string | null): string {
  if (!startIso || !endIso) return "—";
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}min ${s % 60}s`;
}

/** Converte erros técnicos da Graph API em mensagens compreensíveis. */
export function friendlyError(raw: string): { title: string; description: string } {
  const text = (raw || "").toLowerCase();
  if (text.includes("oauthexception") || text.includes("#200") || text.includes("permission")) {
    return {
      title: "Não foi possível acessar esta Página",
      description:
        "Verifique se sua conexão continua ativa e se as permissões necessárias estão disponíveis.",
    };
  }
  if (text.includes("expired") || text.includes("session has expired") || text.includes("#190")) {
    return {
      title: "A conexão com a Página expirou",
      description: "Reconecte a Página para continuar gerenciando as publicações.",
    };
  }
  if (text.includes("rate") || text.includes("#4") || text.includes("limit")) {
    return {
      title: "Limite temporário atingido",
      description:
        "A Meta aplicou um limite momentâneo de requisições. Aguarde alguns minutos e tente novamente.",
    };
  }
  if (text.includes("fetch") || text.includes("network")) {
    return {
      title: "Falha de comunicação",
      description: "Não conseguimos falar com os servidores da Meta agora. Tente novamente.",
    };
  }
  return {
    title: "Algo não saiu como esperado",
    description: "Revise os dados e tente novamente. Se persistir, consulte os detalhes técnicos.",
  };
}
