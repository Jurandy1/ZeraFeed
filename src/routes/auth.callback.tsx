import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Confirmando acesso — ZeraFeed" }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirmando seu acesso…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/tutorial";
      const code = params.get("code");
      const errorDescription = params.get("error_description") || params.get("error");

      if (errorDescription) {
        if (!cancelled) {
          setMessage(errorDescription);
        }
        return;
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Hash tokens (#access_token=…) — o client processa ao obter a sessão
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!data.session) {
            // Aguarda um tick para o detectSessionInUrl
            await new Promise((r) => setTimeout(r, 400));
            const again = await supabase.auth.getSession();
            if (!again.data.session) {
              throw new Error("Sessão não encontrada. Faça login com e-mail e senha.");
            }
          }
        }

        if (!cancelled) {
          const safeNext =
            next.startsWith("/") && !next.startsWith("//") ? next : "/tutorial";
          setMessage("Acesso confirmado. Redirecionando…");
          if (safeNext === "/reset-password") {
            navigate({ to: "/reset-password", replace: true });
          } else if (safeNext === "/onboarding") {
            navigate({ to: "/tutorial", replace: true });
          } else if (safeNext === "/connections") {
            navigate({ to: "/connections", replace: true });
          } else {
            navigate({ to: "/tutorial", replace: true });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(
            err instanceof Error
              ? err.message
              : "Não foi possível confirmar o acesso. Tente entrar com e-mail e senha.",
          );
        }
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <AuthLayout title="Quase lá" subtitle={message} footer={null}>
      <div className="panel p-5 text-sm text-muted-foreground">
        Se esta tela não avançar,{" "}
        <a href="/login" className="font-medium text-primary hover:underline">
          entre com seu e-mail e senha
        </a>
        .
      </div>
    </AuthLayout>
  );
}
