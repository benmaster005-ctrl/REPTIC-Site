import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ApplicantType, ApplicationStatus } from "@/lib/membership";

/**
 * Lectures du back-office, faites avec la session du membre de l'équipe :
 * la RLS limite chaque requête à ses permissions.
 */

type Row = Record<string, unknown>;
const one = (v: unknown): Row | null => (Array.isArray(v) ? ((v[0] as Row) ?? null) : ((v as Row) ?? null));
const s = (v: unknown) => (typeof v === "string" ? v : null);
const like = (q: string) => `%${q.replace(/[%,()*]/g, " ").trim()}%`;
const personName = (r: Row | null) => (r ? [s(r.first_name), s(r.last_name)].filter(Boolean).join(" ") || s(r.email) || "—" : "—");

export const PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// Demandes
// ---------------------------------------------------------------------------
export type ApplicationRow = {
  id: string;
  reference: string;
  type: ApplicantType;
  status: ApplicationStatus;
  applicant: string;
  email: string | null;
  submittedAt: string | null;
  updatedAt: string;
  assignee: string | null;
};

export function applicantLabel(type: ApplicantType, payload: Row, fallback: string) {
  if (type === "legal") return s(payload.legal_name) ?? fallback;
  return [s(payload.first_name), s(payload.last_name)].filter(Boolean).join(" ") || fallback;
}

export async function listApplications({ status, type, q, page = 1 }: { status?: string; type?: string; q?: string; page?: number }) {
  const supabase = await createClient();
  let query = supabase
    .from("applications")
    .select(
      "id,reference,applicant_type,status,payload,submitted_at,updated_at,candidate:profiles!applications_user_id_fkey(email,first_name,last_name),assignee:profiles!applications_assigned_to_fkey(first_name,last_name,email)",
      { count: "exact" },
    );
  if (status === "open") query = query.in("status", ["submitted", "under_review"]);
  else if (status) query = query.eq("status", status);
  else query = query.neq("status", "draft");
  if (type) query = query.eq("applicant_type", type);
  if (q) {
    const t = like(q);
    query = query.or(`reference.ilike.${t},payload->>legal_name.ilike.${t},payload->>last_name.ilike.${t},payload->>first_name.ilike.${t}`);
  }
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) console.error("listApplications", error.message);
  const rows: ApplicationRow[] = (data ?? []).map((r: Row) => {
    const cand = one(r.candidate);
    return {
      id: r.id as string,
      reference: r.reference as string,
      type: r.applicant_type as ApplicantType,
      status: r.status as ApplicationStatus,
      applicant: applicantLabel(r.applicant_type as ApplicantType, (r.payload as Row) ?? {}, personName(cand)),
      email: s(cand?.email),
      submittedAt: s(r.submitted_at),
      updatedAt: r.updated_at as string,
      assignee: one(r.assignee) ? personName(one(r.assignee)) : null,
    };
  });
  return { rows, total: count ?? 0 };
}

export async function getApplicationDetail(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select(
      "id,reference,applicant_type,status,payload,category_id,submitted_at,decided_at,decision_reason,created_at,updated_at,member_id,candidate:profiles!applications_user_id_fkey(id,email,first_name,last_name,phone,status),assignee:profiles!applications_assigned_to_fkey(first_name,last_name,email),decider:profiles!applications_decided_by_fkey(first_name,last_name,email)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [{ data: docs }, { data: history }, { data: required }] = await Promise.all([
    supabase.from("documents").select("id,storage_path,file_name,mime_type,size_bytes,document_type,created_at").eq("application_id", id).order("created_at"),
    supabase
      .from("application_status_history")
      .select("id,to_status,comment,created_at,author:profiles!application_status_history_changed_by_fkey(first_name,last_name,email)")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("required_documents").select("key,label,is_required").eq("applicant_type", data.applicant_type).order("position"),
  ]);

  // Liens signés de courte durée (5 min) pour consulter les pièces
  const paths = (docs ?? []).map((d: Row) => d.storage_path as string);
  const { data: signed } = paths.length ? await supabase.storage.from("private-documents").createSignedUrls(paths, 300) : { data: [] };
  const urlByPath = new Map((signed ?? []).map((x) => [x.path, x.signedUrl]));

  const cand = one(data.candidate);
  return {
    id: data.id as string,
    reference: data.reference as string,
    type: data.applicant_type as ApplicantType,
    status: data.status as ApplicationStatus,
    payload: (data.payload as Row) ?? {},
    categoryId: s(data.category_id),
    submittedAt: s(data.submitted_at),
    decidedAt: s(data.decided_at),
    decisionReason: s(data.decision_reason),
    createdAt: data.created_at as string,
    memberId: s(data.member_id),
    candidate: { id: s(cand?.id), name: personName(cand), email: s(cand?.email), phone: s(cand?.phone), status: s(cand?.status) },
    applicant: applicantLabel(data.applicant_type as ApplicantType, (data.payload as Row) ?? {}, personName(cand)),
    assignee: one(data.assignee) ? personName(one(data.assignee)) : null,
    decider: one(data.decider) ? personName(one(data.decider)) : null,
    documents: (docs ?? []).map((d: Row) => ({
      id: d.id as string,
      fileName: d.file_name as string,
      mimeType: d.mime_type as string,
      sizeBytes: Number(d.size_bytes),
      documentType: s(d.document_type),
      url: urlByPath.get(d.storage_path as string) ?? null,
    })),
    required: (required ?? []).map((r: Row) => ({ key: r.key as string, label: r.label as string, isRequired: Boolean(r.is_required) })),
    history: (history ?? []).map((h: Row) => ({
      id: String(h.id),
      toStatus: h.to_status as ApplicationStatus,
      comment: s(h.comment),
      createdAt: h.created_at as string,
      author: one(h.author) ? personName(one(h.author)) : "Candidat ou système",
    })),
  };
}

export async function getMemberTypeCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id,name,slug").eq("kind", "member_type").order("position");
  return (data ?? []).map((r: Row) => ({ id: r.id as string, name: r.name as string, slug: r.slug as string }));
}

// ---------------------------------------------------------------------------
// Membres
// ---------------------------------------------------------------------------
export type MemberRow = {
  id: string;
  number: string | null;
  name: string;
  type: ApplicantType;
  email: string | null;
  city: string | null;
  category: string | null;
  accountStatus: string | null;
  membershipEnds: string | null;
  createdAt: string;
};

const MEMBER_SELECT =
  "id,member_number,member_type,first_name,last_name,city,phone,profession,created_at,directory_visibility,organization:organizations(legal_name,city,email,phone,registration_number,tax_id),category:categories(name),account:profiles(email,status,role_key),memberships(status,starts_on,ends_on)";

function toMemberRow(r: Row): MemberRow & { raw: Row } {
  const org = one(r.organization);
  const acc = one(r.account);
  const ms = ((r.memberships as Row[]) ?? []).sort((a, b) => String(b.starts_on).localeCompare(String(a.starts_on)));
  return {
    id: r.id as string,
    number: s(r.member_number),
    name: s(org?.legal_name) ?? ([s(r.first_name), s(r.last_name)].filter(Boolean).join(" ") || "—"),
    type: r.member_type as ApplicantType,
    email: s(acc?.email) ?? s(org?.email),
    city: s(r.city) ?? s(org?.city),
    category: s(one(r.category)?.name),
    accountStatus: s(acc?.status),
    membershipEnds: s(ms[0]?.ends_on),
    createdAt: r.created_at as string,
    raw: r,
  };
}

export async function listMembers({ q, type, status, page = 1, all = false }: { q?: string; type?: string; status?: string; page?: number; all?: boolean }) {
  const supabase = await createClient();
  // Le filtre de statut porte sur le compte lié : jointure interne dans ce cas.
  const select = status ? MEMBER_SELECT.replace("account:profiles(", "account:profiles!inner(") : MEMBER_SELECT;
  let query = supabase.from("members").select(select, { count: "exact" });
  if (type) query = query.eq("member_type", type);
  if (status) query = query.eq("account.status", status);
  if (q) {
    const t = like(q);
    query = query.or(`member_number.ilike.${t},first_name.ilike.${t},last_name.ilike.${t},city.ilike.${t},profession.ilike.${t}`);
  }
  query = query.order("created_at", { ascending: false });
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = all ? await query.limit(5000) : await query.range(from, from + PAGE_SIZE - 1);
  if (error) console.error("listMembers", error.message);
  return { rows: ((data ?? []) as unknown as Row[]).map(toMemberRow), total: count ?? 0 };
}

export async function getMemberDetail(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select(
      "id,user_id,member_number,member_type,first_name,last_name,birth_date,profession,city,country,phone,bio,experience_years,directory_visibility,created_at,activity_category_id,organization_id,organization:organizations(*),account:profiles(email,status,role_key,first_name,last_name),memberships(id,status,starts_on,ends_on,category:categories(name))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const { data: apps } = await supabase.from("applications").select("id,reference,status,submitted_at").eq("member_id", id);
  return { ...(data as Row), applications: apps ?? [] } as Row & { applications: Row[] };
}

// ---------------------------------------------------------------------------
// Contenus
// ---------------------------------------------------------------------------
export async function listNews({ q, status, page = 1 }: { q?: string; status?: string; page?: number }) {
  const supabase = await createClient();
  let query = supabase.from("news").select("id,slug,title,status,visibility,published_at,updated_at,category:categories(name)", { count: "exact" });
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("title", like(q));
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query.order("updated_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  return { rows: (data ?? []) as Row[], total: count ?? 0 };
}

export async function getNewsById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("news").select("*").eq("id", id).maybeSingle();
  return (data as Row) ?? null;
}

export async function getCategoriesOf(kind: "news" | "event" | "actor" | "document") {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id,name").eq("kind", kind).order("position");
  return (data ?? []).map((r: Row) => ({ value: r.id as string, label: r.name as string }));
}

export async function listEvents({ q, page = 1 }: { q?: string; page?: number }) {
  const supabase = await createClient();
  let query = supabase.from("events").select("id,slug,title,status,visibility,starts_at,city,registration_enabled,capacity,event_registrations(status)", { count: "exact" });
  if (q) query = query.ilike("title", like(q));
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query.order("starts_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  return { rows: (data ?? []) as Row[], total: count ?? 0 };
}

export async function getEventById(id: string) {
  const supabase = await createClient();
  const [{ data }, { data: regs }] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle(),
    supabase.from("event_registrations").select("id,full_name,email,phone,organization,status,created_at").eq("event_id", id).order("created_at"),
  ]);
  return data ? { event: data as Row, registrations: (regs ?? []) as Row[] } : null;
}

export async function listPages() {
  const supabase = await createClient();
  const { data } = await supabase.from("pages").select("id,slug,title,status,updated_at").order("slug");
  return (data ?? []) as Row[];
}

export async function getPageById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("pages").select("*").eq("id", id).maybeSingle();
  return (data as Row) ?? null;
}

export async function getInstitution() {
  const supabase = await createClient();
  const [{ data: gov }, { data: figures }] = await Promise.all([
    supabase.from("governance_members").select("*").order("sort_order"),
    supabase.from("key_figures").select("*").order("sort_order"),
  ]);
  return { governance: (gov ?? []) as Row[], figures: (figures ?? []) as Row[] };
}

export async function listAssociationDocuments() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id,title,file_name,mime_type,size_bytes,visibility,created_at,storage_path")
    .is("application_id", null)
    .not("visibility", "is", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as Row[];
}

export async function listMessages({ handled, page = 1 }: { handled?: boolean; page?: number }) {
  const supabase = await createClient();
  let query = supabase.from("contact_messages").select("*", { count: "exact" });
  query = handled ? query.not("handled_at", "is", null) : query.is("handled_at", null);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  return { rows: (data ?? []) as Row[], total: count ?? 0 };
}

// ---------------------------------------------------------------------------
// Utilisateurs, journal, indicateurs
// ---------------------------------------------------------------------------
export async function listUsers({ q, role, page = 1 }: { q?: string; role?: string; page?: number }) {
  const supabase = await createClient();
  let query = supabase.from("profiles").select("id,email,first_name,last_name,role_key,status,created_at", { count: "exact" });
  if (role) query = query.eq("role_key", role);
  if (q) {
    const t = like(q);
    query = query.or(`email.ilike.${t},first_name.ilike.${t},last_name.ilike.${t}`);
  }
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  return { rows: (data ?? []) as Row[], total: count ?? 0 };
}

export async function listAudit({ action, page = 1 }: { action?: string; page?: number }) {
  const supabase = await createClient();
  let query = supabase.from("audit_logs").select("id,action,entity_type,entity_id,details,created_at,actor:profiles(email,first_name,last_name)", { count: "exact" });
  if (action) query = query.ilike("action", `${action.replace(/[%,]/g, "")}%`);
  const from = (page - 1) * 50;
  const { data, count } = await query.order("created_at", { ascending: false }).range(from, from + 49);
  return {
    rows: (data ?? []).map((r: Row) => ({
      id: String(r.id),
      action: r.action as string,
      entityType: r.entity_type as string,
      entityId: s(r.entity_id),
      details: (r.details as Row) ?? {},
      createdAt: r.created_at as string,
      actor: one(r.actor) ? personName(one(r.actor)) : "Système",
    })),
    total: count ?? 0,
  };
}

export type AdminStats = {
  applications_received: number;
  applications_pending: number;
  applications_waiting_candidate: number;
  applications_last_30d: number;
  members_active: number;
  members_suspended: number;
  contact_unread: number;
  newsletter: number;
  by_type: Record<string, number>;
  by_category: { name: string; count: number }[];
};

export async function getAdminStats(): Promise<AdminStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_stats");
  if (error) {
    console.error("admin_stats", error.message);
    return null;
  }
  return data as AdminStats;
}
