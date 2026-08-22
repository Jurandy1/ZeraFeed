import type { NormalizedPost, PostType } from "./types";

const GRAPH = "https://graph.facebook.com/v25.0";

const POST_FIELDS = [
  "id",
  "message",
  "story",
  "created_time",
  "permalink_url",
  "full_picture",
  "status_type",
  "is_published",
  "attachments{type,media_type,url,media,subattachments{type,media_type}}",
  "reactions.summary(true).limit(0)",
  "comments.summary(true).limit(0)",
  "shares",
].join(",");

interface GraphError {
  error?: { message?: string; type?: string; code?: number; error_subcode?: number };
}

export class GraphApiError extends Error {
  code: number | undefined;
  constructor(message: string, code?: number) {
    super(message);
    this.name = "GraphApiError";
    this.code = code;
  }
}

async function graphRequest(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  const json = (await response.json().catch(() => ({}))) as GraphError & Record<string, unknown>;
  if (!response.ok || json.error) {
    const err = json.error;
    throw new GraphApiError(
      `${err?.type ?? "GraphError"} (#${err?.code ?? response.status}): ${err?.message ?? "Requisição rejeitada pela Meta."}`,
      err?.code,
    );
  }
  return json;
}

export interface PageInfo {
  id: string;
  name: string | null;
  username: string | null;
  picture: string | null;
}

export async function fetchPageInfo(pageId: string, token: string): Promise<PageInfo> {
  const url = `${GRAPH}/${encodeURIComponent(pageId)}?fields=id,name,username,picture.width(200).height(200)&access_token=${encodeURIComponent(token)}`;
  const data = (await graphRequest(url)) as {
    id: string;
    name?: string;
    username?: string;
    picture?: { data?: { url?: string } };
  };
  return {
    id: data.id,
    name: data.name ?? null,
    username: data.username ?? null,
    picture: data.picture?.data?.url ?? null,
  };
}

interface RawPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
  status_type?: string;
  attachments?: {
    data?: Array<{
      type?: string;
      media_type?: string;
      url?: string;
      media?: { image?: { src?: string } };
      subattachments?: { data?: Array<{ type?: string; media_type?: string }> };
    }>;
  };
  reactions?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
  shares?: { count?: number };
}

function categorize(post: RawPost): PostType {
  const att = post.attachments?.data?.[0];
  const type = (att?.type ?? att?.media_type ?? post.status_type ?? "").toLowerCase();
  if (type.includes("video")) return "video";
  if (type.includes("photo") || type.includes("image") || type.includes("album")) return "foto";
  if (type.includes("share") || type.includes("link")) return "link";
  if (post.full_picture) return "foto";
  return "texto";
}

function isCoverOrProfile(post: RawPost): boolean {
  const att = post.attachments?.data?.[0];
  const type = (att?.type ?? "").toLowerCase();
  if (type.includes("cover_photo") || type.includes("profile_media")) return true;
  const status = (post.status_type ?? "").toLowerCase();
  if (status.includes("cover_photo") || status.includes("profile")) return true;
  const story = (post.story ?? "").toLowerCase();
  return (
    story.includes("foto da capa") ||
    story.includes("cover photo") ||
    story.includes("foto do perfil") ||
    story.includes("profile picture")
  );
}

function normalize(post: RawPost): NormalizedPost {
  const reactions = post.reactions?.summary?.total_count ?? 0;
  const comments = post.comments?.summary?.total_count ?? 0;
  const shares = post.shares?.count ?? 0;
  const picture = post.full_picture ?? post.attachments?.data?.[0]?.media?.image?.src ?? null;
  return {
    id: post.id,
    message: post.message ?? post.story ?? "",
    createdTime: post.created_time,
    permalink: post.permalink_url ?? null,
    picture,
    type: categorize(post),
    hasMedia: Boolean(picture),
    reactions,
    comments,
    shares,
    engagement: reactions + comments + shares,
    isCoverOrProfile: isCoverOrProfile(post),
  };
}

export async function fetchPagePosts(options: {
  pageId: string;
  token: string;
  since?: string | undefined;
  until?: string | undefined;
  maxPages?: number;
}): Promise<NormalizedPost[]> {
  const { pageId, token, since, until, maxPages = 12 } = options;
  const params = new URLSearchParams({
    access_token: token,
    fields: POST_FIELDS,
    limit: "100",
  });
  if (since) params.set("since", since);
  if (until) params.set("until", until);

  let url: string | null = `${GRAPH}/${encodeURIComponent(pageId)}/posts?${params.toString()}`;
  const collected: NormalizedPost[] = [];
  let pages = 0;

  while (url && pages < maxPages) {
    const data = (await graphRequest(url)) as {
      data?: RawPost[];
      paging?: { next?: string };
    };
    for (const raw of data.data ?? []) collected.push(normalize(raw));
    url = data.paging?.next ?? null;
    pages += 1;
  }
  return collected;
}

export interface DeleteOutcome {
  id: string;
  ok: boolean;
  error?: string;
}

/** Exclusão em lote via batch API, com fallback individual (fluxo original preservado). */
export async function deletePosts(
  postIds: string[],
  token: string,
): Promise<DeleteOutcome[]> {
  if (postIds.length === 0) return [];
  const batch = postIds.map((id) => ({
    method: "DELETE",
    relative_url: encodeURIComponent(id),
  }));

  try {
    const body = new URLSearchParams({
      access_token: token,
      batch: JSON.stringify(batch),
      include_headers: "false",
    });
    const response = await fetch(GRAPH, { method: "POST", body });
    const json = (await response.json()) as
      | Array<{ code: number; body: string } | null>
      | GraphError;

    if (!Array.isArray(json)) {
      const message = (json as GraphError).error?.message ?? "Falha no lote.";
      throw new GraphApiError(message, (json as GraphError).error?.code);
    }

    return postIds.map((id, index) => {
      const entry = json[index];
      if (entry && entry.code === 200) return { id, ok: true };
      let error = "Não foi possível excluir esta publicação.";
      try {
        const parsed = JSON.parse(entry?.body ?? "{}") as GraphError;
        if (parsed.error?.message) error = `(#${parsed.error.code ?? "?"}) ${parsed.error.message}`;
      } catch {
        /* mantém mensagem padrão */
      }
      return { id, ok: false, error };
    });
  } catch {
    // Fallback: um a um
    const results: DeleteOutcome[] = [];
    for (const id of postIds) {
      try {
        await graphRequest(
          `${GRAPH}/${encodeURIComponent(id)}?access_token=${encodeURIComponent(token)}`,
          { method: "DELETE" },
        );
        results.push({ id, ok: true });
      } catch (error) {
        results.push({
          id,
          ok: false,
          error: error instanceof Error ? error.message : "Erro desconhecido.",
        });
      }
    }
    return results;
  }
}
