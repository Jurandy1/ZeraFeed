import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { useAccount } from "@/components/app/AuthedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { updateProfile } from "@/lib/zerafeed/account.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — ZeraFeed" },
      { name: "description", content: "Atualize seus dados de perfil e gerencie a segurança da conta ZeraFeed." },
      { property: "og:title", content: "Configurações — ZeraFeed" },
      { property: "og:description", content: "Preferências e segurança da sua conta ZeraFeed." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data } = useAccount();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const saveProfile = useServerFn(updateProfile);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (data?.profile.fullName) setFullName(data.profile.fullName);
  }, [data?.profile.fullName]);

  const save = useMutation({
    mutationFn: () => saveProfile({ data: { fullName: fullName.trim() } }),
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      void queryClient.invalidateQueries({ queryKey: ["account-overview"] });
    },
    onError: () => toast.error("Não foi possível salvar", { description: "Verifique o nome informado." }),
  });

  async function onSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  async function onResetPassword() {
    if (!data?.profile.email) return;
    await supabase.auth.resetPasswordForEmail(data.profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    toast.success("Enviamos um link de redefinição para seu e-mail.");
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Dados da conta, segurança e sessão." />

      <section className="panel max-w-xl p-6">
        <h2 className="text-sm font-semibold text-foreground">Perfil</h2>
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome</Label>
            <Input
              id="fullName"
              value={fullName}
              maxLength={120}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={data?.profile.email ?? ""} readOnly disabled />
          </div>
          <Button disabled={save.isPending || fullName.trim().length < 2} onClick={() => save.mutate()}>
            {save.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </section>

      <section className="panel max-w-xl p-6">
        <h2 className="text-sm font-semibold text-foreground">Segurança</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Envie um link seguro para redefinir sua senha ou encerre a sessão neste dispositivo.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void onResetPassword()}>
            Redefinir senha
          </Button>
          <Button variant="outline" onClick={() => void onSignOut()}>
            Sair da conta
          </Button>
        </div>
      </section>
    </div>
  );
}
