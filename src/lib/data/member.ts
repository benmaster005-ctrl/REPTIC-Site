import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ApplicantType, ApplicationStatus } from "@/lib/membership";

/**
 * Lectures de l'espace membre, faites avec la session de l'utilisateur :
 * la RLS garantit qu'il ne voit que ce qui lui est autorisé (§9.3).
 * Ces fonctions lisent les cookies : à appeler derrière un <Suspense>.
 */

export type Application = {
  id: string;
  reference: string;
  applicantType: ApplicantType;
  status: ApplicationStatus;
  payload: Record<string, string | number | undefined>;
  submittedAt: string | null;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppDocument = {
  id: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  documentType: string | null;
  title: string | null;
  createdAt: string;
};

export type RequiredDocument = {
  key: string;
  label: string;
  help: string | null;
  isRequired: boolean;
  acceptedMime: string[];
};

type Row = Record<string, unknown>;

/** Relation « plusieurs-à-un » : Supabase peut la typer en tableau, elle arrive en objet. */
const one = (v: unknown): Row | null => (Array.isArray(v) ? ((v[0] as Row) ?? null) : ((v as Row) ?? null));

const toApplication = (r: Row): Application => ({
  id: r.id as string,
  reference: r.reference as string,
  applicantType: r.applicant_type as ApplicantType,
  status: r.status as ApplicationStatus,
  payload: (r.payload as Application["payload"]) ?? {},
  submittedAt: (r.submitted_at as string) ?? null,
  decisionReason: (r.decision_reason as string) ?? null,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

const toDocument = (r: Row): AppDocument => ({
  id: r.id as string,
  storagePath: r.storage_path as string,
  fileName: r.file_name as string,
  mimeType: r.mime_type as string,
  sizeBytes: Number(r.size_bytes),
  documentType: (r.document_type as string) ?? null,
  title: (r.title as string) ?? null,
  createdAt: r.created_at as string,
});

const APP_COLUMNS = "id,reference,applicant_type,status,payload,submitted_at,decision_reason,created_at,updated_at";

/** Dossier le plus récent de l'utilisateur. */
export const getMyApplication = cache(async (userId: string): Promise<Application | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("applications").select(APP_COLUMNS).eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data ? toApplication(data) : null;
});

export async function getApplicationDocuments(applicationId: string): Promise<AppDocument[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id,storage_path,file_name,mime_type,size_bytes,document_type,title,created_at")
    .eq("application_id", applicationId)
    .order("created_at");
  return (data ?? []).map(toDocument);
}

export async function getRequiredDocuments(type: ApplicantType): Promise<RequiredDocument[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("required_documents")
    .select("key,label,help,is_required,accepted_mime")
    .eq("applicant_type", type)
    .order("position");
  return (data ?? []).map((r: Row) => ({
    key: r.key as string,
    label: r.label as string,
    help: (r.help as string) ?? null,
    isRequired: Boolean(r.is_required),
    acceptedMime: (r.accepted_mime as string[]) ?? [],
  }));
}

export async function getApplicationHistory(applicationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("application_status_history")
    .select("id,from_status,to_status,comment,created_at")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r: Row) => ({
    id: String(r.id),
    toStatus: r.to_status as ApplicationStatus,
    comment: (r.comment as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

// ---------------------------------------------------------------------------
// Membre
// ---------------------------------------------------------------------------
export const getMyMember = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("id,member_type,member_number,first_name,last_name,profession,city,country,phone,bio,directory_visibility,created_at,organization:organizations(legal_name,website),category:categories(name)")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const org = one(data.organization);
  const cat = one(data.category);
  return {
    id: data.id as string,
    memberType: data.member_type as ApplicantType,
    memberNumber: (data.member_number as string) ?? null,
    firstName: (data.first_name as string) ?? null,
    lastName: (data.last_name as string) ?? null,
    profession: (data.profession as string) ?? null,
    city: (data.city as string) ?? null,
    country: (data.country as string) ?? null,
    phone: (data.phone as string) ?? null,
    bio: (data.bio as string) ?? null,
    directoryVisibility: (data.directory_visibility as "public" | "members" | null) ?? null,
    organizationName: (org?.legal_name as string) ?? null,
    website: (org?.website as string) ?? null,
    category: (cat?.name as string) ?? null,
    createdAt: data.created_at as string,
  };
});

export async function getMyMemberships(memberId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("id,status,starts_on,ends_on,category:categories(name)")
    .eq("member_id", memberId)
    .order("starts_on", { ascending: false });
  return (data ?? []).map((r: Row) => ({
    id: r.id as string,
    status: r.status as "active" | "expired" | "suspended" | "cancelled",
    startsOn: r.starts_on as string,
    endsOn: (r.ends_on as string) ?? null,
    category: ((r.category as Row | null)?.name as string) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function getNotifications(userId: string, limit = 50) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id,type,title,body,link,read_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r: Row) => ({
    id: r.id as string,
    type: r.type as string,
    title: r.title as string,
    body: (r.body as string) ?? null,
    link: (r.link as string) ?? null,
    readAt: (r.read_at as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

export const getUnreadCount = cache(async (userId: string) => {
  const supabase = await createClient();
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
  return count ?? 0;
});

// ---------------------------------------------------------------------------
// Contenus réservés
// ---------------------------------------------------------------------------
export async function getMemberNews(limit = 30) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("slug,title,excerpt,body,cover_path,published_at,visibility,category:categories(name)")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r: Row) => ({
    slug: r.slug as string,
    title: r.title as string,
    excerpt: (r.excerpt as string) ?? null,
    body: (r.body as string) ?? null,
    publishedAt: r.published_at as string,
    membersOnly: r.visibility === "members",
    category: ((r.category as Row | null)?.name as string) ?? null,
  }));
}

export async function getMemberEvents(userId: string) {
  const supabase = await createClient();
  const [{ data: events }, { data: regs }] = await Promise.all([
    supabase
      .from("events")
      .select("id,slug,title,excerpt,starts_at,ends_at,location_name,city,visibility,registration_enabled,registration_deadline,capacity")
      .order("starts_at", { ascending: true })
      .limit(100),
    supabase.from("event_registrations").select("id,event_id,status").eq("user_id", userId),
  ]);
  const byEvent = new Map((regs ?? []).map((r: Row) => [r.event_id as string, { id: r.id as string, status: r.status as string }]));
  return (events ?? []).map((e: Row) => ({
    id: e.id as string,
    slug: e.slug as string,
    title: e.title as string,
    excerpt: (e.excerpt as string) ?? null,
    startsAt: e.starts_at as string,
    endsAt: (e.ends_at as string) ?? null,
    location: [e.location_name, e.city].filter(Boolean).join(", ") || null,
    membersOnly: e.visibility === "members",
    registrationEnabled: Boolean(e.registration_enabled),
    registrationDeadline: (e.registration_deadline as string) ?? null,
    registration: byEvent.get(e.id as string) ?? null,
  }));
}

export async function getDirectory({ q, category }: { q?: string; category?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("member_directory")
    .select("id,member_type,display_name,profession,city,category,category_slug,website,bio")
    .order("display_name")
    .limit(200);
  if (category) query = query.eq("category_slug", category);
  if (q) {
    const term = q.replace(/[%,()]/g, " ").trim();
    if (term) query = query.or(`display_name.ilike.%${term}%,profession.ilike.%${term}%,city.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) console.error("getDirectory", error.message);
  return (data ?? []).map((r: Row) => ({
    id: r.id as string,
    memberType: r.member_type as ApplicantType,
    name: (r.display_name as string)?.trim() || "Membre",
    profession: (r.profession as string) ?? null,
    city: (r.city as string) ?? null,
    category: (r.category as string) ?? null,
    website: (r.website as string) ?? null,
    bio: (r.bio as string) ?? null,
  }));
}

/** Documents personnels (déposés par l'utilisateur) et documents associatifs réservés. */
export async function getMyDocuments(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id,storage_path,file_name,mime_type,size_bytes,document_type,title,created_at,owner_id,visibility,application_id")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];
  return {
    personal: rows.filter((r) => r.owner_id === userId).map(toDocument),
    shared: rows.filter((r) => r.owner_id !== userId && (r.visibility === "members" || r.visibility === "public")).map(toDocument),
  };
}

/** Événements non terminés, calculés au moment de la requête. */
export function upcomingEvents<T extends { startsAt: string; endsAt: string | null }>(events: T[]) {
  const now = Date.now();
  return events.filter((e) => new Date(e.endsAt ?? e.startsAt).getTime() >= now);
}

/** Vrai si la date limite est dépassée. */
export function isPast(iso: string | null) {
  return iso ? new Date(iso).getTime() < Date.now() : false;
}

/** Fiche profil d'un membre de l'annuaire (story 3). La RLS ne renvoie que les fiches visibles. */
export async function getMemberProfile(id: string) {
  const supabase = await createClient();
  const full =
    "id,member_type,display_name,profession,city,category,website,bio,phone,organization_email,organization_phone,organization_address,legal_form,organization_description,contact_name,member_number,created_at";
  let { data, error } = await supabase.from("member_directory").select(full).eq("id", id).maybeSingle();
  if (error) {
    // Annuaire non enrichi tant que la migration 7 n'est pas appliquée
    ({ data, error } = await supabase.from("member_directory").select("id,member_type,display_name,profession,city,category,website,bio").eq("id", id).maybeSingle());
  }
  if (!data) return null;
  const r = data as Row;
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
  return {
    id: r.id as string,
    memberType: r.member_type as ApplicantType,
    name: s(r.display_name) ?? "Membre",
    profession: s(r.profession),
    city: s(r.city),
    category: s(r.category),
    website: s(r.website),
    bio: s(r.bio),
    phone: s(r.phone),
    organizationEmail: s(r.organization_email),
    organizationPhone: s(r.organization_phone),
    organizationAddress: s(r.organization_address),
    legalForm: s(r.legal_form),
    organizationDescription: s(r.organization_description),
    contactName: s(r.contact_name),
    memberNumber: s(r.member_number),
    memberSince: s(r.created_at),
  };
}

// ---------------------------------------------------------------------------
// Cotisations (story 19)
// ---------------------------------------------------------------------------
export type FeePayment = {
  reference: string;
  year: number;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  method: string | null;
  createdAt: string;
  paidAt: string | null;
};

export async function getFeeOverview(userId: string, memberType: ApplicantType | null) {
  const supabase = await createClient();
  const [{ data: fee, error: feeError }, { data: pays }] = await Promise.all([
    memberType ? supabase.from("membership_fees").select("label,amount,currency").eq("member_type", memberType).maybeSingle() : Promise.resolve({ data: null, error: null }),
    supabase.from("payments").select("reference,year,amount,currency,status,payment_method,created_at,paid_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);
  const payments: FeePayment[] = (pays ?? []).map((r: Row) => ({
    reference: r.reference as string,
    year: Number(r.year),
    amount: Number(r.amount),
    currency: (r.currency as string) ?? "XAF",
    status: r.status as FeePayment["status"],
    method: (r.payment_method as string) ?? null,
    createdAt: r.created_at as string,
    paidAt: (r.paid_at as string) ?? null,
  }));
  return {
    available: !feeError,
    fee: fee ? { label: fee.label as string, amount: (fee.amount as number) ?? null, currency: (fee.currency as string) ?? "XAF" } : null,
    payments,
    paidYears: new Set(payments.filter((p) => p.status === "paid").map((p) => p.year)),
  };
}

/** Années payables : l'année en cours, et la suivante à partir d'octobre. */
export function payableYears() {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 9 ? [y, y + 1] : [y];
}
