import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/zerafeed/format";
import { LOCAL_MODE } from "@/lib/zerafeed/local-config";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (LOCAL_MODE) throw redirect({ to: "/cleaner" });
  },
  head: () => ({
    meta: [
      { title: "Entrar — ZeraFeed" },
      { name: "description", content: "Acesse sua conta ZeraFeed para gerenciar as publicações da sua Página." },
      { property: "og:title", content: "Entrar — ZeraFeed" },
      { property: "og:description", content: "Acesse o painel de gestão de publicações do ZeraFeed." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(255),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres.").max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error("Não foi possível entrar", {
        description:
          error.message.toLowerCase().includes("invalid")
            ? "E-mail ou senha incorretos."
            : friendlyError(error.message).description,
      });
      return;
    }
    toast.success("Bem-vindo de volta.");
    navigate({ to: "/tutorial" });
  }

  return (
    <AuthLayout
      title="Entre para gerenciar suas publicações."
      subtitle="Use o e-mail e a senha cadastrados na sua conta ZeraFeed."
      footer={
        <>
          Não possui uma conta?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            maxLength={255}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            maxLength={72}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthLayout>
  );
}
