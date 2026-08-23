import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FREE_DELETE_LIMIT, isUnlimitedPlan } from "./billing";
import type { DeleteResult, NormalizedPost } from "./types";

async function resolveToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  connectionId: string,
): Promise<{
  token: string;
  pageId: string;
  pageName: string | null;
}> {
  const { data, error } = await supabase
    .from("facebook_connections")
    .select("id, facebook_page_id, page_name, facebook_page_secrets(access_token)")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Conexão não encontrada para este usuário.");
  const secrets = (data as { facebook_page_secrets?: { access_token: string }[] | { access_token: string } | null })
    .facebook_page_secrets;
  const token = Array.isArray(secrets) ? secrets[0]?.access_token : secrets?.access_token;
  if (!token) throw new Error("Credencial da Página indisponível. Reconecte a Página.");
  return {
    token,
    pageId: (data as { facebook_page_id: string }).facebook_page_id,
    pageName: (data as { page_name: string | null }).page_name,
  };
}

async function getDeleteQuota(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<{ unlimited: boolean; used: number; remaining: number }> {
  const [{ data: sub }, { count }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("cleanup_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "deleted"),
  ]);
  const unlimited = isUnlimitedPlan(sub?.plan, sub?.status);
  const used = count ?? 0;
  if (unlimited) return { unlimited: true, used, remaining: Number.MAX_SAFE_INTEGER };
  return { unlimited: false, used, remaining: Math.max(0, FREE_DELETE_LIMIT - used) };
}

const searchSchema = z.object({
  connectionId: z.string().uuid(),
  since: z.string().trim().max(20).optional(),
  until: z.string().trim().max(20).optional(),
});

export const searchPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => searchSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ posts: NormalizedPost[] }> => {
    const { token, pageId } = await resolveToken(context.supabase, context.userId, data.connectionId);
    const { fetchPagePosts } = await import("./graph.server");
    const posts = await fetchPagePosts({
      pageId,
      token,
      since: data.since,
      until: data.until,
    });
    return { posts };
  });

const startSchema = z.object({
  connectionId: z.string().uuid(),
  totalFound: z.number().int().min(0),
  totalProtected: z.number().int().min(0),
  items: z
    .array(z.object({ id: z.string().max(120), excerpt: z.string().max(280) }))
    .min(1)
    .max(5000),
  backup: z.string().max(5_000_000),
});

export const startCleanupJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => startSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ jobId: string; backupId: string | null }> => {
    const quota = await getDeleteQuota(context.supabase, context.userId);
    if (!quota.unlimited && quota.remaining <= 0) {
      throw new Error(
        `Limite do teste grátis atingido (${FREE_DELETE_LIMIT} exclusões). Fale no WhatsApp para liberar o plano ilimitado.`,
      );
    }
    if (!quota.unlimited && data.items.length > quota.remaining) {
      throw new Error(
        `Restam só ${quota.remaining} exclusões no teste grátis. Selecione no máximo ${quota.remaining} publicações ou libere o plano ilimitado.`,
      );
    }

    const { pageId, pageName } = await resolveToken(context.supabase, context.userId, data.connectionId);

    const { data: job, error } = await context.supabase
      .from("cleanup_jobs")
      .insert({
        user_id: context.userId,
        facebook_page_id: pageId,
        page_name: pageName,
        total_found: data.totalFound,
        total_selected: data.items.length,
        total_protected: data.totalProtected,
        status: "running",
      })
      .select("id")
      .single();
    if (error || !job) throw new Error(error?.message ?? "Não foi possível iniciar a operação.");

    const jobId = (job as { id: string }).id;

    const { error: itemsError } = await context.supabase.from("cleanup_items").insert(
      data.items.map((item) => ({
        job_id: jobId,
        user_id: context.userId,
        facebook_post_id: item.id,
        message_excerpt: item.excerpt,
        status: "pending",
      })),
    );
    if (itemsError) throw new Error(itemsError.message);

    const { data: backup } = await context.supabase
      .from("backups")
      .insert({
        user_id: context.userId,
        job_id: jobId,
        file_name: `zerafeed-backup-${jobId}.json`,
        payload: JSON.parse(data.backup) as never,
        total_items: data.items.length,
      })
      .select("id")
      .single();

    return { jobId, backupId: (backup as { id: string } | null)?.id ?? null };
  });

const chunkSchema = z.object({
  connectionId: z.string().uuid(),
  jobId: z.string().uuid(),
  postIds: z.array(z.string().max(120)).min(1).max(20),
});

export const deleteChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => chunkSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ results: DeleteResult[] }> => {
    const quota = await getDeleteQuota(context.supabase, context.userId);
    if (!quota.unlimited && quota.remaining <= 0) {
      throw new Error(
        `Limite do teste grátis atingido (${FREE_DELETE_LIMIT} exclusões). Libere o plano ilimitado para continuar.`,
      );
    }

    let postIds = data.postIds;
    if (!quota.unlimited && postIds.length > quota.remaining) {
      postIds = postIds.slice(0, quota.remaining);
    }

    const { token } = await resolveToken(context.supabase, context.userId, data.connectionId);
    const { deletePosts } = await import("./graph.server");
    const results = await deletePosts(postIds, token);

    // Itens cortados pelo limite ficam como falha explícita
    for (const id of data.postIds) {
      if (!postIds.includes(id)) {
        results.push({
          id,
          ok: false,
          error: `Limite do teste grátis (${FREE_DELETE_LIMIT}).`,
        });
      }
    }

    for (const result of results) {
      await context.supabase
        .from("cleanup_items")
        .update({
          status: result.ok ? "deleted" : "failed",
          error_message: result.error ?? null,
          deleted_at: result.ok ? new Date().toISOString() : null,
        })
        .eq("job_id", data.jobId)
        .eq("user_id", context.userId)
        .eq("facebook_post_id", result.id);
    }

    return { results };
  });

export const finishCleanupJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: items, error } = await context.supabase
      .from("cleanup_items")
      .select("status")
      .eq("job_id", data.jobId);
    if (error) throw new Error(error.message);

    const rows = (items ?? []) as { status: string }[];
    const deleted = rows.filter((r) => r.status === "deleted").length;
    const failed = rows.filter((r) => r.status === "failed").length;
    const status = failed === 0 ? "completed" : deleted > 0 ? "partial" : "failed";

    const { data: job } = await context.supabase
      .from("cleanup_jobs")
      .update({
        total_deleted: deleted,
        total_failed: failed,
        status,
        finished_at: new Date().toISOString(),
      })
      .eq("id", data.jobId)
      .select("id, total_selected, total_protected, started_at, finished_at, status")
      .single();

    return {
      deleted,
      failed,
      status,
      job: job as {
        id: string;
        total_selected: number;
        total_protected: number;
        started_at: string;
        finished_at: string;
        status: string;
      } | null,
    };
  });
