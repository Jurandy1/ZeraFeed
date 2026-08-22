import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Link2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { connectPage, disconnectPage } from "@/lib/zerafeed/connections.functions";
import { formatDate } from "@/lib/zerafeed/format";
import { useConnections } from "@/lib/zerafeed/hooks";
import { LOCAL_MODE, LOCAL_PAGE_ID, LOCAL_PAGE_NAME } from "@/lib/zerafeed/local-config";

export const Route = createFileRoute("/_authenticated/connections")({
  head: () => ({
    meta: [
      { title: "Conexões — ZeraFeed" },
      { name: "description", content: "Conecte e gerencie as Páginas do Facebook vinculadas à sua conta ZeraFeed." },
      { property: "og:title", content: "Conexões — ZeraFeed" },
      { property: "og:description", content: "Gerencie as Páginas conectadas ao ZeraFeed." },
    ],
  }),
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const queryClient = useQueryClient();
  const connections = useConnections();
  const connectFn = useServerFn(connectPage);
  const disconnectFn = useServerFn(disconnectPage);
  const [pageId, setPageId] = useState("");
  const [token, setToken] = useState("");

  const connect = useMutation({
    mutationFn: () => connectFn({ data: { pageId: pageId.trim(), accessToken: token.trim() } }),
    onSuccess: () => {
      setPageId("");
      setToken("");
      toast.success("Página conectada com sucesso.");
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) =>
      toast.error("Não foi possível conectar", { description: error.message }),
  });

  const disconnect = useMutation({
    mutationFn: (id: string) => disconnectFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Página desconectada.");
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error("Falha ao desconectar", { description: error.message }),
  });

  if (LOCAL_MODE) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Conexão"
          description="Modo local: EX Ladrão ligada à Graph API via token em local-config / .env."
        />
        <section className="panel flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted text-xs font-semibold">
            EX
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{LOCAL_PAGE_NAME}</p>
            <p className="truncate text-xs text-muted-foreground">
              ID {LOCAL_PAGE_ID} · Graph API v25.0 · sem Supabase
            </p>
          </div>
          <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success">
            Ativa
          </span>
        </section>
        <p className="text-sm text-muted-foreground">
          Para trocar o token quando expirar, edite <code className="text-foreground">VITE_LOCAL_PAGE_TOKEN</code> no{" "}
          <code className="text-foreground">.env</code> ou o padrão em{" "}
          <code className="text-foreground">src/lib/zerafeed/local-config.ts</code> e reinicie o app.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Conexões"
        description="Vincule a Página do Facebook que será gerenciada. As credenciais ficam armazenadas de forma isolada e nunca são expostas ao navegador."
      />

      <section className="panel p-6">
        <h2 className="text-sm font-semibold text-foreground">Conectar nova Página</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="page-id">ID da Página</Label>
            <Input
              id="page-id"
              value={pageId}
              maxLength={64}
              placeholder="Ex.: 102938475610293"
              onChange={(e) => setPageId(e.target.value.replace(/\s/g, ""))}
            />
            <p className="text-xs text-muted-foreground">
              Disponível em Configurações da Página → Sobre.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-token">Token de acesso da Página</Label>
            <Textarea
              id="page-token"
              value={token}
              rows={3}
              maxLength={2000}
              placeholder="Token gerado com as permissões pages_manage_posts e pages_read_engagement"
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              O token é validado na Graph API antes de ser salvo.
            </p>
          </div>
        </div>
        <Button
          className="mt-5"
          disabled={connect.isPending || pageId.trim().length < 3 || token.trim().length < 20}
          onClick={() => connect.mutate()}
        >
          {connect.isPending ? "Validando..." : "Conectar Página"}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Páginas conectadas</h2>
        {connections.isLoading && <LoadingState rows={2} />}
        {connections.isError && (
          <ErrorState error={connections.error} onRetry={() => void connections.refetch()} />
        )}
        {connections.data?.length === 0 && (
          <EmptyState
            icon={Link2}
            title="Nenhuma Página conectada"
            description="Adicione o ID e o token da Página no formulário acima para começar."
          />
        )}
        {connections.data?.map((connection) => (
          <div key={connection.id} className="panel flex items-center gap-4 p-4">
            <div className="h-12 w-12 overflow-hidden rounded-lg border border-border bg-muted">
              {connection.picture && (
                <img src={connection.picture} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {connection.pageName ?? "Página"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {connection.pageUsername ? `@${connection.pageUsername} · ` : ""}
                ID {connection.facebookPageId} · conectada em {formatDate(connection.createdAt)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={disconnect.isPending}
              onClick={() => disconnect.mutate(connection.id)}
            >
              <Trash2 className="h-4 w-4" /> Desconectar
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}
