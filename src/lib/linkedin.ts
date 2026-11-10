import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Synchronisation des posts de la page LinkedIn du REPTIC.CM via Bright Data
 * (Web Scraper API, collecteur « LinkedIn posts », porte discover_by_company_url).
 *
 * Une collecte prend plusieurs minutes : la synchronisation se fait en deux temps.
 *   1er appel : lance la collecte et mémorise son identifiant (snapshot)
 *   appel suivant : si la collecte est prête, importe les posts en base
 *
 * Variables : BRIGHTDATA_API_KEY, LINKEDIN_SYNC_SECRET, LINKEDIN_COMPANY_URL (facultatif),
 * LINKEDIN_POSTS_LIMIT (facultatif, 10 par défaut : chaque post est facturé).
 */

const API = "https://api.brightdata.com/datasets/v3";
const DATASET = "gd_lyy3tktm25m4avu764";
const KEY = process.env.BRIGHTDATA_API_KEY ?? "";
const SECRET = process.env.LINKEDIN_SYNC_SECRET ?? "";
export const COMPANY_URL = process.env.LINKEDIN_COMPANY_URL || "https://www.linkedin.com/company/reptic-cm/";
const LIMIT = Math.min(50, Math.max(1, Number(process.env.LINKEDIN_POSTS_LIMIT) || 10));
const COMPANY_SLUG = (COMPANY_URL.match(/company\/([^/?#]+)/)?.[1] ?? "reptic-cm").toLowerCase();

export const isLinkedinSyncConfigured = Boolean(KEY && SECRET);

type Raw = Record<string, unknown>;
export type SyncResult =
  | { status: "started"; snapshotId: string }
  | { status: "running"; snapshotId: string }
  | { status: "imported"; count: number; skipped: number }
  | { status: "failed"; error: string }
  | { status: "disabled"; error: string };

async function bd(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // NDJSON ou texte : traité par l'appelant
  }
  return { ok: res.ok, status: res.status, body, text };
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() && !Number.isNaN(Number(v)) ? Number(v) : null);

/** Ne garde que les posts publiés par la page du REPTIC.CM (la collecte peut ramener des contenus voisins). */
function isFromCompany(r: Raw) {
  const fields = [r.user_id, r.use_url, r.url, r.user_name].map((v) => String(v ?? "").toLowerCase());
  return fields.some((f) => f.includes(COMPANY_SLUG)) || fields.some((f) => f.includes("reptic"));
}

function normalize(r: Raw) {
  const images = Array.isArray(r.images) ? (r.images as unknown[]).map(str).filter((x): x is string => Boolean(x)).slice(0, 4) : [];
  return {
    id: str(r.id) ?? str(r.url),
    url: str(r.url),
    text: str(r.post_text) ?? str(r.original_post_text) ?? str(r.title),
    posted_at: str(r.date_posted),
    post_type: str(r.post_type),
    images,
    video_thumbnail: str(r.video_thumbnail),
    document_cover: str(r.document_cover_image),
    num_likes: num(r.num_likes),
    num_comments: num(r.num_comments),
    raw: { user_name: r.user_name ?? null, account_type: r.account_type ?? null, hashtags: r.hashtags ?? null, embedded_links: r.embedded_links ?? null, repost: r.repost ?? null },
  };
}

function parseRecords(body: unknown, text: string): Raw[] {
  if (Array.isArray(body)) return body as Raw[];
  if (body && typeof body === "object") return [body as Raw];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l) as Raw];
      } catch {
        return [];
      }
    });
}

/** Avance la synchronisation d'une étape. Sans session : utilisable par la tâche planifiée. */
export async function syncLinkedin(startedBy?: string | null): Promise<SyncResult> {
  if (!isLinkedinSyncConfigured) return { status: "disabled", error: "BRIGHTDATA_API_KEY ou LINKEDIN_SYNC_SECRET manquant." };
  const db = createPublicClient();

  const { data: pendingRows, error: pendingError } = await db.rpc("linkedin_pending_run", { p_secret: SECRET });
  if (pendingError) return { status: "failed", error: `Base : ${pendingError.message}` };
  const pending = (Array.isArray(pendingRows) ? pendingRows[0] : pendingRows) as { run_id: number; snapshot_id: string; created_at: string } | undefined;

  // 1. Une collecte est en cours : est-elle prête ?
  if (pending) {
    const progress = await bd(`/progress/${encodeURIComponent(pending.snapshot_id)}`);
    const state = String((progress.body as Raw | null)?.status ?? "").toLowerCase();
    const tooOld = Date.now() - new Date(pending.created_at).getTime() > 6 * 3600_000;
    if (state === "failed" || (tooOld && state !== "ready")) {
      const error = `Collecte ${state || "sans réponse"}`;
      await db.rpc("import_linkedin_posts", { p_secret: SECRET, p_run_id: pending.run_id, p_posts: [], p_error: error });
      return { status: "failed", error };
    }
    if (state !== "ready") return { status: "running", snapshotId: pending.snapshot_id };

    const snap = await bd(`/snapshot/${encodeURIComponent(pending.snapshot_id)}?format=json`);
    if (!snap.ok) return { status: "running", snapshotId: pending.snapshot_id };
    const records = parseRecords(snap.body, snap.text).filter((r) => !r.error && !r.error_code);
    // Les partages (repost) reprennent un post déjà collecté : on ne garde que les originaux.
    const mine = records.filter((r) => isFromCompany(r) && String(r.post_type ?? "").toLowerCase() !== "repost").map(normalize).filter((p) => p.id && p.url);
    const { data: count, error } = await db.rpc("import_linkedin_posts", { p_secret: SECRET, p_run_id: pending.run_id, p_posts: mine, p_error: null });
    if (error) return { status: "failed", error: `Import : ${error.message}` };
    return { status: "imported", count: Number(count ?? 0), skipped: records.length - mine.length };
  }

  // 2. Aucune collecte en cours : en lancer une (posts des 12 derniers mois, plafonnés)
  const since = new Date(Date.now() - 365 * 86400_000).toISOString().slice(0, 10);
  const trigger = await bd(`/trigger?dataset_id=${DATASET}&type=discover_new&discover_by=company_url`, {
    method: "POST",
    body: JSON.stringify({ input: [{ url: COMPANY_URL, start_date: since }], limit_per_input: LIMIT }),
  });
  const snapshotId = str((trigger.body as Raw | null)?.snapshot_id);
  if (!trigger.ok || !snapshotId) {
    const reason = typeof trigger.body === "object" && trigger.body ? String((trigger.body as Raw).error ?? (trigger.body as Raw).message ?? trigger.status) : String(trigger.status);
    return { status: "failed", error: `Bright Data a refusé la collecte : ${reason}` };
  }
  const { error } = await db.rpc("linkedin_sync_started", { p_secret: SECRET, p_snapshot_id: snapshotId, p_user: startedBy ?? null });
  if (error) return { status: "failed", error: `Base : ${error.message}` };
  return { status: "started", snapshotId };
}
