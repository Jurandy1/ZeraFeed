import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PageConnection } from "./types";

const connectSchema = z.object({
  pageId: z
    .string()
    .trim()
    .min(3, "Informe o ID da Página.")
    .max(64)
    .regex(/^[0-9A-Za-z._-]+$/, "ID da Página inválido."),
  accessToken: z.string().trim().min(20, "Token inválido.").max(1000),
});

interface ConnectionRow {
  id: string;
  facebook_page_id: string;
  page_name: string | null;
  page_username: string | null;
  page_picture_url: string | null;
  status: string;
  token_expires_at: string | null;
  created_at: string;
}

function toConnection(row: ConnectionRow): PageConnection {
  return {
    id: row.id,
    facebookPageId: row.facebook_page_id,
    pageName: row.page_name,
    pageUsername: row.page_username,
    picture: row.page_picture_url,
    status: row.status,
    tokenExpiresAt: row.token_expires_at,
    createdAt: row.created_at,
  };
}

export const listConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PageConnection[]> => {
    const { data, error } = await context.supabase
      .from("facebook_connections")
      .select(
        "id, facebook_page_id, page_name, page_username, page_picture_url, status, token_expires_at, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toConnection(row as ConnectionRow));
  });

export const connectPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => connectSchema.parse(input))
  .handler(async ({ data, context }): Promise<PageConnection> => {
    const { fetchPageInfo } = await import("./graph.server");
    const info = await fetchPageInfo(data.pageId, data.accessToken);

    const { data: row, error } = await context.supabase
      .from("facebook_connections")
      .upsert(
        {
          user_id: context.userId,
          facebook_page_id: info.id,
          page_name: info.name,
          page_username: info.username,
          page_picture_url: info.picture,
          status: "active",
        },
        { onConflict: "user_id,facebook_page_id" },
      )
      .select(
        "id, facebook_page_id, page_name, page_username, page_picture_url, status, token_expires_at, created_at",
      )
      .single();
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: secretError } = await supabaseAdmin.from("facebook_page_secrets").upsert(
      {
        connection_id: (row as ConnectionRow).id,
        user_id: context.userId,
        access_token: data.accessToken,
      },
      { onConflict: "connection_id" },
    );
    if (secretError) throw new Error(secretError.message);

    await context.supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", context.userId);

    return toConnection(row as ConnectionRow);
  });

export const disconnectPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("facebook_connections")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
