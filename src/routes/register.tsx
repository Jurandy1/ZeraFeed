import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { LOCAL_MODE } from "@/lib/zerafeed/local-config";

export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    if (LOCAL_MODE) throw redirect({ to: "/cleaner" });
  },
  head: () => ({
    meta: [
      { title: "Criar conta — ZeraFeed" },
      { name: "description", content: "Crie sua conta ZeraFeed e comece a organizar as publicações da sua Página por R$ 20/mês." },
      { property: "og:title", content: "Criar conta — ZeraFeed" },
      { property: "og:description", content: "Cadastro rápido para começar a gerenciar publicações da sua Página." },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120),
    email: z.string().trim().email("Informe um e-mail válido.").max(255),
    password: z.string().min(8, "Use ao menos 8 caracteres.").max(72),
    confirm: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: "É necessário aceitar os termos." }) }),
  })
  .refine((v) => v.password === v.confirm, {
    message: "As senhas não coincidem.",
    path: ["confirm"],
  });

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse({ ...form, terms });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os dados informados.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { full_name: parsed.data.name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível criar a conta", {
        description: error.message.toLowerCase().includes("already")
          ? "Este e-mail já possui cadastro. Tente entrar."
          : "Revise os dados e tente novamente.",
      });
      return;
    }
    if (data.session) {
      navigate({ to: "/onboarding" });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout
        title="Confirme seu e-mail"
        subtitle="Enviamos um link de confirmação para o endereço informado. Após confirmar, você entrará direto no onboarding."
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        }
      >
        <div className="panel p-5 text-sm text-muted-foreground">
          Não recebeu? Verifique a caixa de spam ou tente cadastrar novamente em alguns minutos.
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Crie sua conta ZeraFeed."
      subtitle="Plano PRO por R$ 20/mês. Comece conectando sua Página em poucos minutos."
      footer={
        <>
          Já possui uma conta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={form.name}
            maxLength={120}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Seu nome completo"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            maxLength={255}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="voce@empresa.com"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              maxLength={72}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              maxLength={72}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="terms"
            checked={terms}
            onCheckedChange={(v) => setTerms(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-xs font-normal leading-relaxed text-muted-foreground">
            Li e concordo com os{" "}
            <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link> e a{" "}
            <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
          </Label>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando conta..." : "Criar minha conta"}
        </Button>
      </form>
    </AuthLayout>
  );
}
