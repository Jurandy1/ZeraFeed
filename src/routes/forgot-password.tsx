import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getAuthEmailRedirectTo } from "@/lib/zerafeed/site-url";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — ZeraFeed" },
      { name: "description", content: "Receba um link para redefinir a senha da sua conta ZeraFeed." },
      { property: "og:title", content: "Recuperar senha — ZeraFeed" },
      { property: "og:description", content: "Redefina a senha da sua conta ZeraFeed com segurança." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = z.string().trim().email().max(255).safeParse(email);
    if (!parsed.success) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: getAuthEmailRedirectTo("/reset-password"),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <AuthLayout
      title="Recuperar acesso"
      subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      {sent ? (
        <div className="panel p-5 text-sm text-muted-foreground">
          Se existir uma conta com esse e-mail, o link de redefinição foi enviado. Verifique também
          a caixa de spam.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
