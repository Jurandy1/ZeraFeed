import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, Link2, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/States";
import { ConfirmDeleteModal } from "@/components/cleaner/ConfirmDeleteModal";
import { FilterPanel } from "@/components/cleaner/FilterPanel";
import { PostRow } from "@/components/cleaner/PostRow";
import { ProgressPanel, type RunState } from "@/components/cleaner/ProgressPanel";
import { ProtectionPanel } from "@/components/cleaner/ProtectionPanel";
import { SelectionBar } from "@/components/cleaner/SelectionBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteChunk,
  finishCleanupJob,
  searchPosts,
  startCleanupJob,
} from "@/lib/zerafeed/cleanup.functions";
import { formatNumber } from "@/lib/zerafeed/format";
import { deletePosts, fetchPagePosts } from "@/lib/zerafeed/graph";
import { downloadJson, useConnections } from "@/lib/zerafeed/hooks";
import {
  LOCAL_CONNECTION_ID,
  LOCAL_MODE,
  LOCAL_PAGE_ID,
  LOCAL_PAGE_NAME,
  LOCAL_PAGE_TOKEN,
} from "@/lib/zerafeed/local-config";
import {
  DEFAULT_FILTERS,
  applyFilters,
  decoratePosts,
  type FilterState,
  type ItemStatus,
} from "@/lib/zerafeed/rules";
import { DEFAULT_PROTECTION, type NormalizedPost, type ProtectionSettings } from "@/lib/zerafeed/types";

export const Route = createFileRoute("/_authenticated/cleaner")({
  head: () => ({
    meta: [
      { title: LOCAL_MODE ? `Limpeza — ${LOCAL_PAGE_NAME}` : "Limpeza — ZeraFeed" },
      {
        name: "description",
        content:
          "Busque, filtre, proteja e exclua publicações da sua Página em lote com backup automático.",
      },
    ],
  }),
  component: CleanerPage,
});

const CHUNK_SIZE = LOCAL_MODE ? 20 : 10;
const PAGE_SIZE = 25;

function CleanerPage() {
  const queryClient = useQueryClient();
  const connections = useConnections();
  const runSearch = useServerFn(searchPosts);
  const runStart = useServerFn(startCleanupJob);
  const runChunk = useServerFn(deleteChunk);
  const runFinish = useServerFn(finishCleanupJob);

  const [connectionId, setConnectionId] = useState(LOCAL_MODE ? LOCAL_CONNECTION_ID : "");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [posts, setPosts] = useState<NormalizedPost[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, { status: ItemStatus; errorMessage?: string }>>({});
  const [protection, setProtection] = useState<ProtectionSettings>({ ...DEFAULT_PROTECTION });
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
  const [selected, setSelected] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<unknown>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [run, setRun] = useState<RunState | null>(null);
  const [page, setPage] = useState(1);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const runStarted = run !== null;

  useEffect(() => {
    if (runStarted) progressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [runStarted]);

  const activeConnection =
    connections.data?.find((c) => c.id === connectionId) ?? connections.data?.[0];
  const effectiveId = connectionId || activeConnection?.id || "";

  const decorated = useMemo(
    () => (posts ? decoratePosts(posts, protection, statuses) : []),
    [posts, protection, statuses],
  );
  const visible = useMemo(() => applyFilters(decorated, filters), [decorated, filters]);
  const protectedCount = decorated.filter((p) => p.protection).length;
  const selectableVisible = visible.filter((p) => p.canDelete);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [visible, safePage],
  );

  async function onSearch() {
    if (!effectiveId && !LOCAL_MODE) return;
    setSearching(true);
    setSearchError(null);
    try {
      let resultPosts: NormalizedPost[];
      if (LOCAL_MODE) {
        resultPosts = await fetchPagePosts({
          pageId: LOCAL_PAGE_ID,
          token: LOCAL_PAGE_TOKEN,
          ...(since ? { since } : {}),
          ...(until ? { until } : {}),
        });
      } else {
        const result = await runSearch({
          data: {
            connectionId: effectiveId,
            ...(since ? { since } : {}),
            ...(until ? { until } : {}),
          },
        });
        resultPosts = result.posts;
      }
      setPosts(resultPosts);
      setStatuses({});
      setSelected([]);
      setRun(null);
      setPage(1);
      toast.success(`${formatNumber(resultPosts.length)} publicações encontradas.`);
    } catch (error) {
      setSearchError(error);
    } finally {
      setSearching(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function buildBackup(ids: string[]) {
    const map = new Map(decorated.map((p) => [p.id, p]));
    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        page: activeConnection?.pageName ?? LOCAL_PAGE_NAME,
        pageId: activeConnection?.facebookPageId ?? LOCAL_PAGE_ID,
        total: ids.length,
        posts: ids.map((id) => {
          const post = map.get(id);
          return {
            id,
            message: post?.message ?? "",
            createdTime: post?.createdTime ?? null,
            type: post?.type ?? null,
            permalink: post?.permalink ?? null,
            engagement: post?.engagement ?? 0,
            reactions: post?.reactions ?? 0,
            comments: post?.comments ?? 0,
            shares: post?.shares ?? 0,
            picture: post?.picture ?? null,
          };
        }),
      },
      null,
      2,
    );
  }

  function onBackup() {
    downloadJson(
      `backup-${LOCAL_MODE ? "ex-ladrao" : "zerafeed"}-${Date.now()}.json`,
      buildBackup(selected),
    );
    toast.success("Backup baixado.");
  }

  async function onConfirmDelete() {
    if (selected.length === 0) return;
    if (!LOCAL_MODE && !effectiveId) return;
    setConfirmOpen(false);
    const ids = [...selected];
    const state: RunState = {
      total: ids.length,
      processed: 0,
      deleted: 0,
      failed: 0,
      protectedCount,
      log: [`Backup automático · iniciando exclusão de ${ids.length} publicações.`],
      running: true,
    };
    setRun(state);
    downloadJson(`backup-antes-apagar-${Date.now()}.json`, buildBackup(ids));

    try {
      if (LOCAL_MODE) {
        for (let index = 0; index < ids.length; index += CHUNK_SIZE) {
          const chunk = ids.slice(index, index + CHUNK_SIZE);
          let results = await deletePosts(chunk, LOCAL_PAGE_TOKEN);
          const rateLimited = results.some(
            (r) => r.error && /(#4|#17|#32|#613)/.test(r.error),
          );
          if (rateLimited) {
            state.log = [...state.log, "Limite da API — aguardando 60s…"];
            setRun({ ...state });
            await new Promise((r) => setTimeout(r, 60_000));
            results = await deletePosts(chunk, LOCAL_PAGE_TOKEN);
          }
          setStatuses((prev) => {
            const next = { ...prev };
            for (const result of results) {
              next[result.id] = result.ok
                ? { status: "apagado" }
                : { status: "falhou", errorMessage: result.error ?? "Falha ao excluir." };
            }
            return next;
          });
          state.processed += results.length;
          state.deleted += results.filter((r) => r.ok).length;
          state.failed += results.filter((r) => !r.ok).length;
          state.log = [
            ...state.log,
            `Lote ${Math.floor(index / CHUNK_SIZE) + 1}: ${results.filter((r) => r.ok).length} excluídas, ${results.filter((r) => !r.ok).length} falhas.`,
          ];
          setRun({ ...state });
          if (index + CHUNK_SIZE < ids.length) {
            await new Promise((r) => setTimeout(r, 700));
          }
        }
      } else {
        const { jobId } = await runStart({
          data: {
            connectionId: effectiveId,
            totalFound: decorated.length,
            totalProtected: protectedCount,
            items: ids.map((id) => ({
              id,
              excerpt: (decorated.find((p) => p.id === id)?.message ?? "").slice(0, 280),
            })),
            backup: buildBackup(ids),
          },
        });

        for (let index = 0; index < ids.length; index += CHUNK_SIZE) {
          const chunk = ids.slice(index, index + CHUNK_SIZE);
          const { results } = await runChunk({
            data: { connectionId: effectiveId, jobId, postIds: chunk },
          });
          setStatuses((prev) => {
            const next = { ...prev };
            for (const result of results) {
              next[result.id] = result.ok
                ? { status: "apagado" }
                : { status: "falhou", errorMessage: result.error ?? "Falha ao excluir." };
            }
            return next;
          });
          state.processed += results.length;
          state.deleted += results.filter((r) => r.ok).length;
          state.failed += results.filter((r) => !r.ok).length;
          state.log = [
            ...state.log,
            `Lote ${Math.floor(index / CHUNK_SIZE) + 1}: ${results.filter((r) => r.ok).length} excluídas, ${results.filter((r) => !r.ok).length} falhas.`,
          ];
          setRun({ ...state });
        }

        await runFinish({ data: { jobId } });
      }

      state.running = false;
      state.log = [...state.log, "Operação concluída."];
      setRun({ ...state });
      setSelected([]);
      void queryClient.invalidateQueries();
      toast.success(`${formatNumber(state.deleted)} publicações excluídas.`);
    } catch (error) {
      state.running = false;
      state.log = [
        ...state.log,
        `Erro: ${error instanceof Error ? error.message : "falha inesperada"}`,
      ];
      setRun({ ...state });
      toast.error("A operação foi interrompida", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    }
  }

  if (connections.isLoading) return <LoadingState rows={3} />;

  if (!connections.data?.length) {
    return (
      <div className="space-y-8">
        <PageHeader title="Limpeza" description="Conecte uma Página para iniciar." />
        <EmptyState
          icon={Link2}
          title="Nenhuma Página conectada"
          description="Você precisa conectar uma Página do Facebook antes de executar uma limpeza."
          action={
            <Button asChild size="sm">
              <Link to="/connections">Conectar Página</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <PageHeader
        title="Limpeza de publicações"
        description={
          LOCAL_MODE
            ? `Página ${LOCAL_PAGE_NAME} · Graph API direta (sem Supabase).`
            : "Busque o histórico da Página, revise cada item e execute a exclusão em lote com backup."
        }
      />

      <section className="panel p-6">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <Label>Página</Label>
            <Select value={effectiveId} onValueChange={setConnectionId} disabled={LOCAL_MODE}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a Página" />
              </SelectTrigger>
              <SelectContent>
                {connections.data.map((connection) => (
                  <SelectItem key={connection.id} value={connection.id}>
                    {connection.pageName ?? connection.facebookPageId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="since">De</Label>
            <Input id="since" type="date" value={since} onChange={(e) => setSince(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="until">Até</Label>
            <Input id="until" type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
          </div>
        </div>
        <Button
          className="mt-5"
          disabled={searching || (!LOCAL_MODE && !effectiveId)}
          onClick={() => void onSearch()}
        >
          <Search className="h-4 w-4" />
          {searching ? "Buscando publicações..." : "Buscar publicações"}
        </Button>
      </section>

      <ProtectionPanel value={protection} onChange={setProtection} />

      {searchError != null && <ErrorState error={searchError} onRetry={() => void onSearch()} />}
      <div ref={progressRef}>{run && <ProgressPanel run={run} />}</div>

      {posts && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="panel h-fit p-5 lg:sticky lg:top-6">
            <div className="flex items-center gap-2 pb-4">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Filtros</h2>
            </div>
            <FilterPanel
              value={filters}
              onChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
            />
          </aside>

          <div className="min-w-0 space-y-3">
            <div className="panel sticky top-4 z-10 flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {formatNumber(selected.length)} selecionadas
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatNumber(visible.length)} de {formatNumber(decorated.length)} publicações ·{" "}
                  {formatNumber(protectedCount)} protegidas
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelected(
                      selected.length === selectableVisible.length
                        ? []
                        : selectableVisible.map((p) => p.id),
                    )
                  }
                  disabled={selectableVisible.length === 0}
                >
                  {selected.length === selectableVisible.length && selected.length > 0
                    ? "Limpar seleção"
                    : `Selecionar todas (${formatNumber(selectableVisible.length)})`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackup}
                  disabled={selected.length === 0}
                >
                  <Download className="h-4 w-4" /> Backup
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  disabled={selected.length === 0 || (run?.running ?? false)}
                >
                  <Trash2 className="h-4 w-4" /> Excluir selecionadas
                </Button>
              </div>
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Nenhuma publicação nos filtros atuais"
                description="Ajuste os filtros ou amplie o período pesquisado."
              />
            ) : (
              <>
                {paged.map((post) => (
                  <PostRow
                    key={post.id}
                    post={post}
                    selected={selected.includes(post.id)}
                    onToggle={toggle}
                  />
                ))}

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-muted-foreground">
                      Página {safePage} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={safePage <= 1}
                        onClick={() => setPage(safePage - 1)}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={safePage >= totalPages}
                        onClick={() => setPage(safePage + 1)}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {!posts && !searching && (
        <EmptyState
          icon={Search}
          title="Nenhuma busca realizada"
          description="Escolha a Página e o período desejado para carregar o histórico de publicações."
        />
      )}

      <SelectionBar
        count={selected.length}
        onBackup={onBackup}
        onDelete={() => setConfirmOpen(true)}
        onClear={() => setSelected([])}
        busy={run?.running ?? false}
      />

      <ConfirmDeleteModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        selected={selected.length}
        protectedCount={protectedCount}
        failedCount={decorated.filter((p) => p.status === "falhou").length}
        onConfirm={() => void onConfirmDelete()}
      />
    </div>
  );
}
