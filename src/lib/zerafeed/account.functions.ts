import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AccountOverview {
  profile: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    onboardingCompleted: boolean;
  };
  subscription: {
    plan: string;
    status: string;
    price: number;
    currency: string;
    startedAt: string;
    expiresAt: string | null;
  } | null;
  connectionsCount: number;
  totals: { deleted: number; jobs: number; failed: number; protected: number };
  lastJob: JobSummary | null;
}

export interface JobSummary {
  id: string;
  pageName: string | null;
  facebookPageId: string | null;
  totalFound: number;
  totalSelected: number;
  totalDeleted: number;
  totalFailed: number;
  totalProtected: number;
  status: string;
  startedAt: string;
  finishedAt: string | null;
}

interface JobRow {
  id: string;
  page_name: string | null;
  facebook_page_id: string | null;
  total_found: number;
  total_selected: number;
  total_deleted: number;
  total_failed: number;
  total_protected: number;
  status: string;
  started_at: string;
  finished_at: string | null;
}

const JOB_COLUMNS =
  "id, page_name, facebook_page_id, total_found, total_selected, total_deleted, total_failed, total_protected, status, started_at, finished_at";

function toJob(row: JobRow): JobSummary {
  return {
    id: row.id,
    pageName: row.page_name,
    facebookPageId: row.facebook_page_id,
    totalFound: row.total_found,
    totalSelected: row.total_selected,
    totalDeleted: row.total_deleted,
    totalFailed: row.total_failed,
    totalProtected: row.total_protected,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export const getAccountOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountOverview> => {
    const [profileRes, subRes, connRes, jobsRes] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, onboarding_completed")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("subscriptions")
        .select("plan, status, price, currency, started_at, expires_at")
        .eq("user_id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("facebook_connections")
        .select("id", { count: "exact", head: true }),
      context.supabase
        .from("cleanup_jobs")
        .select(JOB_COLUMNS)
        .order("started_at", { ascending: false })
        .limit(50),
    ]);

    const profileRow = profileRes.data as {
      id: string;
      email: string | null;
      full_name: string | null;
      avatar_url: string | null;
      onboarding_completed: boolean;
    } | null;
    const subRow = subRes.data as {
      plan: string;
      status: string;
      price: number;
      currency: string;
      started_at: string;
      expires_at: string | null;
    } | null;
    const jobs = ((jobsRes.data ?? []) as JobRow[]).map(toJob);

    return {
      profile: {
        id: context.userId,
        email: profileRow?.email ?? null,
        fullName: profileRow?.full_name ?? null,
        avatarUrl: profileRow?.avatar_url ?? null,
        onboardingCompleted: profileRow?.onboarding_completed ?? false,
      },
      subscription: subRow
        ? {
            plan: subRow.plan,
            status: subRow.status,
            price: Number(subRow.price),
            currency: subRow.currency,
            startedAt: subRow.started_at,
            expiresAt: subRow.expires_at,
          }
        : null,
      connectionsCount: connRes.count ?? 0,
      totals: {
        jobs: jobs.length,
        deleted: jobs.reduce((sum, j) => sum + j.totalDeleted, 0),
        failed: jobs.reduce((sum, j) => sum + j.totalFailed, 0),
        protected: jobs.reduce((sum, j) => sum + j.totalProtected, 0),
      },
      lastJob: jobs[0] ?? null,
    };
  });

export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<JobSummary[]> => {
    const { data, error } = await context.supabase
      .from("cleanup_jobs")
      .select(JOB_COLUMNS)
      .order("started_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return ((data ?? []) as JobRow[]).map(toJob);
  });

export interface JobDetail {
  job: JobSummary;
  items: Array<{
    id: string;
    postId: string;
    excerpt: string | null;
    status: string;
    errorMessage: string | null;
    deletedAt: string | null;
  }>;
  backup: { id: string; fileName: string; totalItems: number } | null;
}

export const getJobDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<JobDetail> => {
    const { data: job, error } = await context.supabase
      .from("cleanup_jobs")
      .select(JOB_COLUMNS)
      .eq("id", data.jobId)
      .single();
    if (error || !job) throw new Error("Operação não encontrada.");

    const { data: items } = await context.supabase
      .from("cleanup_items")
      .select("id, facebook_post_id, message_excerpt, status, error_message, deleted_at")
      .eq("job_id", data.jobId)
      .order("created_at", { ascending: true })
      .limit(1000);

    const { data: backup } = await context.supabase
      .from("backups")
      .select("id, file_name, total_items")
      .eq("job_id", data.jobId)
      .maybeSingle();

    return {
      job: toJob(job as JobRow),
      items: (
        (items ?? []) as Array<{
          id: string;
          facebook_post_id: string;
          message_excerpt: string | null;
          status: string;
          error_message: string | null;
          deleted_at: string | null;
        }>
      ).map((row) => ({
        id: row.id,
        postId: row.facebook_post_id,
        excerpt: row.message_excerpt,
        status: row.status,
        errorMessage: row.error_message,
        deletedAt: row.deleted_at,
      })),
      backup: backup
        ? {
            id: (backup as { id: string }).id,
            fileName: (backup as { file_name: string }).file_name,
            totalItems: (backup as { total_items: number }).total_items,
          }
        : null,
    };
  });

export const downloadBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: backup, error } = await context.supabase
      .from("backups")
      .select("file_name, payload")
      .eq("job_id", data.jobId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!backup) throw new Error("Backup não encontrado para esta operação.");
    const row = backup as { file_name: string; payload: unknown };
    return { fileName: row.file_name, json: JSON.stringify(row.payload ?? {}, null, 2) };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ fullName: z.string().trim().min(2).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.fullName })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
