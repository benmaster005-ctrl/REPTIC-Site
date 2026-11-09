"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { assertPermission, slugify, type Permission } from "@/lib/admin";
import { tags } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";

async function guard(p: Permission): Promise<FormState | null> {
  try {
    await assertPermission(p);
    return null;
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
}

const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
const optUuid = z.string().optional().transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null));

/** Le Cameroun est à UTC+1 toute l'année : une saisie « datetime-local » est interprétée à cette heure. */
function fromLocal(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}:00+01:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function dbError(error: { code?: string; message: string }, values: Record<string, string>): FormState {
  if (error.code === "23505") return { status: "error", fieldErrors: { slug: ["Cette adresse (slug) est déjà utilisée."] }, values };
  console.error("admin-content", error.message);
  return { status: "error", message: "L'enregistrement a échoué.", values };
}

// ---------------------------------------------------------------------------
// Actualités
// ---------------------------------------------------------------------------
const NEWS_FIELDS = ["title", "slug", "excerpt", "body", "category_id", "visibility", "status", "published_at", "cover_path", "seo_title", "seo_description"];

const newsSchema = z
  .object({
    title: z.string().trim().min(3, { error: "Titre trop court." }).max(200),
    slug: z.string().trim().max(90).optional(),
    excerpt: opt(400),
    body: opt(50000),
    category_id: optUuid,
    visibility: z.enum(["public", "members"]),
    status: z.enum(["draft", "published", "scheduled", "archived"]),
    published_at: z.string().optional(),
    cover_path: opt(400),
    seo_title: opt(70),
    seo_description: opt(170),
  })
  .superRefine((v, ctx) => {
    if (v.status === "scheduled") {
      const at = fromLocal(v.published_at);
      if (!at || new Date(at).getTime() <= Date.now()) ctx.addIssue({ code: "custom", path: ["published_at"], message: "Choisissez une date future pour programmer la publication." });
    }
  });

export async function saveNews(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard("content.manage");
  if (denied) return denied;
  const id = String(formData.get("id") ?? "");
  const values = formValues(formData, NEWS_FIELDS);
  const parsed = newsSchema.safeParse(values);
  if (!parsed.success) return { status: "error", message: "Merci de corriger les champs signalés.", fieldErrors: fieldErrors(parsed.error), values };
  const d = parsed.data;
  const slug = slugify(d.slug || d.title);
  if (!slug) return { status: "error", fieldErrors: { slug: ["Adresse invalide."] }, values };
  const publishedAt = d.status === "draft" ? fromLocal(d.published_at) : fromLocal(d.published_at) ?? new Date().toISOString();

  const supabase = await createClient();
  const ctx = await assertPermission("content.manage");
  const row = {
    title: d.title,
    slug,
    excerpt: d.excerpt,
    body: d.body,
    category_id: d.category_id,
    visibility: d.visibility,
    status: d.status,
    published_at: publishedAt,
    cover_path: d.cover_path,
    seo_title: d.seo_title,
    seo_description: d.seo_description,
  };
  const { data, error } = id
    ? await supabase.from("news").update(row).eq("id", id).select("id").single()
    : await supabase.from("news").insert({ ...row, author_id: ctx.user.id }).select("id").single();
  if (error) return dbError(error, values);

  updateTag(tags.news);
  updateTag(`news:${slug}`);
  if (!id) redirect(`/admin/actualites/${data.id}?enregistre=1`);
  refresh();
  return { status: "success", message: d.status === "published" ? "Actualité publiée." : d.status === "scheduled" ? "Publication programmée." : "Brouillon enregistré.", values: { ...values, slug } };
}

export async function deleteNews(formData: FormData) {
  await assertPermission("content.manage");
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("news").delete().eq("id", id);
  updateTag(tags.news);
  redirect("/admin/actualites?supprime=1");
}

// ---------------------------------------------------------------------------
// Événements
// ---------------------------------------------------------------------------
const EVENT_FIELDS = [
  "title", "slug", "excerpt", "body", "category_id", "starts_at", "ends_at", "location_name", "address", "city", "online_url",
  "status", "visibility", "registration_enabled", "capacity", "registration_deadline", "cover_path",
];

const eventSchema = z
  .object({
    title: z.string().trim().min(3, { error: "Titre trop court." }).max(200),
    slug: z.string().trim().max(90).optional(),
    excerpt: opt(400),
    body: opt(50000),
    category_id: optUuid,
    starts_at: z.string().min(1, { error: "Date de début obligatoire." }),
    ends_at: z.string().optional(),
    location_name: opt(160),
    address: opt(200),
    city: opt(80),
    online_url: z.string().trim().max(300).optional().transform((v) => v || null).pipe(z.url({ error: "Lien invalide." }).nullable()),
    status: z.enum(["draft", "published", "archived"]),
    visibility: z.enum(["public", "members"]),
    registration_enabled: z.string().optional().transform((v) => v === "on"),
    capacity: z.string().optional().transform((v) => (v ? Number.parseInt(v, 10) : null)).pipe(z.number().int().positive({ error: "Capacité invalide." }).nullable()),
    registration_deadline: z.string().optional(),
    cover_path: opt(400),
  })
  .superRefine((v, ctx) => {
    const start = fromLocal(v.starts_at);
    const end = fromLocal(v.ends_at);
    if (!start) ctx.addIssue({ code: "custom", path: ["starts_at"], message: "Date de début invalide." });
    if (start && end && end < start) ctx.addIssue({ code: "custom", path: ["ends_at"], message: "La fin doit suivre le début." });
  });

export async function saveEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard("events.manage");
  if (denied) return denied;
  const id = String(formData.get("id") ?? "");
  const values = formValues(formData, EVENT_FIELDS);
  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) return { status: "error", message: "Merci de corriger les champs signalés.", fieldErrors: fieldErrors(parsed.error), values };
  const d = parsed.data;
  const slug = slugify(d.slug || d.title);
  const ctx = await assertPermission("events.manage");
  const row = {
    title: d.title,
    slug,
    excerpt: d.excerpt,
    body: d.body,
    category_id: d.category_id,
    starts_at: fromLocal(d.starts_at),
    ends_at: fromLocal(d.ends_at),
    location_name: d.location_name,
    address: d.address,
    city: d.city,
    online_url: d.online_url,
    status: d.status,
    visibility: d.visibility,
    registration_enabled: d.registration_enabled,
    capacity: d.capacity,
    registration_deadline: fromLocal(d.registration_deadline),
    cover_path: d.cover_path,
  };
  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("events").update(row).eq("id", id).select("id").single()
    : await supabase.from("events").insert({ ...row, created_by: ctx.user.id }).select("id").single();
  if (error) return dbError(error, values);
  updateTag(tags.events);
  updateTag(`event:${slug}`);
  if (!id) redirect(`/admin/evenements/${data.id}?enregistre=1`);
  refresh();
  return { status: "success", message: "Événement enregistré.", values: { ...values, slug } };
}

export async function deleteEvent(formData: FormData) {
  await assertPermission("events.manage");
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  updateTag(tags.events);
  redirect("/admin/evenements?supprime=1");
}

export async function setRegistrationStatus(formData: FormData) {
  await assertPermission("events.manage");
  const id = z.uuid().parse(formData.get("registration_id"));
  const status = z.enum(["registered", "waitlisted", "cancelled", "attended"]).parse(formData.get("status"));
  const supabase = await createClient();
  await supabase.from("event_registrations").update({ status }).eq("id", id);
  refresh();
}

// ---------------------------------------------------------------------------
// Pages institutionnelles
// ---------------------------------------------------------------------------
const pageSchema = z.object({
  title: z.string().trim().min(2).max(160),
  summary: opt(400),
  body: opt(50000),
  seo_title: opt(70),
  seo_description: opt(170),
  status: z.enum(["draft", "published"]),
});

export async function savePage(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard("content.manage");
  if (denied) return denied;
  const id = z.uuid().safeParse(formData.get("id"));
  const values = formValues(formData, ["title", "summary", "body", "seo_title", "seo_description", "status"]);
  const parsed = pageSchema.safeParse(values);
  if (!id.success || !parsed.success) return { status: "error", message: "Merci de corriger les champs signalés.", fieldErrors: parsed.success ? undefined : fieldErrors(parsed.error), values };
  const ctx = await assertPermission("content.manage");
  const supabase = await createClient();
  const { data, error } = await supabase.from("pages").update({ ...parsed.data, updated_by: ctx.user.id }).eq("id", id.data).select("slug").single();
  if (error) return dbError(error, values);
  updateTag(tags.pages);
  updateTag(`page:${data.slug}`);
  refresh();
  return { status: "success", message: "Page enregistrée et mise en ligne.", values };
}

// ---------------------------------------------------------------------------
// Bureau exécutif et chiffres clés
// ---------------------------------------------------------------------------
const governanceSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Nom obligatoire." }).max(120),
  position_title: z.string().trim().min(2, { error: "Fonction obligatoire." }).max(120),
  organization: opt(160),
  bio: opt(600),
  photo_path: opt(400),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_published: z.string().optional().transform((v) => v === "on"),
});

export async function saveGovernanceMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard("content.manage");
  if (denied) return denied;
  const id = String(formData.get("id") ?? "");
  const values = formValues(formData, ["full_name", "position_title", "organization", "bio", "photo_path", "sort_order", "is_published"]);
  const parsed = governanceSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  const supabase = await createClient();
  const { error } = id ? await supabase.from("governance_members").update(parsed.data).eq("id", id) : await supabase.from("governance_members").insert(parsed.data);
  if (error) return dbError(error, values);
  updateTag(tags.governance);
  refresh();
  return id ? { status: "success", message: "Enregistré.", values } : { status: "success", message: "Membre du bureau ajouté." };
}

export async function deleteGovernanceMember(formData: FormData) {
  await assertPermission("content.manage");
  const supabase = await createClient();
  await supabase.from("governance_members").delete().eq("id", z.uuid().parse(formData.get("id")));
  updateTag(tags.governance);
  refresh();
}

const figureSchema = z.object({
  label: z.string().trim().min(2).max(80),
  value: z.string().trim().min(1).max(20),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_published: z.string().optional().transform((v) => v === "on"),
});

export async function saveKeyFigure(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await guard("content.manage");
  if (denied) return denied;
  const id = String(formData.get("id") ?? "");
  const values = formValues(formData, ["label", "value", "sort_order", "is_published"]);
  const parsed = figureSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  const supabase = await createClient();
  const { error } = id ? await supabase.from("key_figures").update(parsed.data).eq("id", id) : await supabase.from("key_figures").insert(parsed.data);
  if (error) return dbError(error, values);
  updateTag(tags.figures);
  refresh();
  return id ? { status: "success", message: "Enregistré.", values } : { status: "success", message: "Chiffre ajouté." };
}

export async function deleteKeyFigure(formData: FormData) {
  await assertPermission("content.manage");
  const supabase = await createClient();
  await supabase.from("key_figures").delete().eq("id", z.uuid().parse(formData.get("id")));
  updateTag(tags.figures);
  refresh();
}

// ---------------------------------------------------------------------------
// Documents associatifs (stockage privé, dossier « association/ »)
// ---------------------------------------------------------------------------
const assocDocSchema = z.object({
  storagePath: z.string().regex(/^association\/[a-zA-Z0-9._-]+$/),
  title: z.string().trim().min(2).max(160),
  fileName: z.string().min(1).max(200),
  visibility: z.enum(["members", "public"]),
});

export async function registerAssociationDocument(input: z.infer<typeof assocDocSchema>): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertPermission("documents.manage");
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const parsed = assocDocSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Informations du document invalides." };
  const supabase = await createClient();
  const name = parsed.data.storagePath.slice("association/".length);
  const { data: listed } = await supabase.storage.from("private-documents").list("association", { search: name, limit: 5 });
  const object = listed?.find((o) => o.name === name);
  if (!object) return { ok: false, error: "Le fichier n'a pas été reçu." };
  const ctx = await assertPermission("documents.manage");
  const { error } = await supabase.from("documents").insert({
    bucket: "private-documents",
    storage_path: parsed.data.storagePath,
    file_name: parsed.data.fileName,
    mime_type: String(object.metadata?.mimetype ?? "application/octet-stream"),
    size_bytes: Number(object.metadata?.size ?? 1),
    owner_id: ctx.user.id,
    title: parsed.data.title,
    visibility: parsed.data.visibility,
  });
  if (error) {
    await supabase.storage.from("private-documents").remove([parsed.data.storagePath]);
    return { ok: false, error: "Le document n'a pas pu être enregistré." };
  }
  return { ok: true };
}

export async function deleteAssociationDocument(formData: FormData) {
  await assertPermission("documents.manage");
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data } = await supabase.from("documents").select("storage_path").eq("id", id).is("application_id", null).maybeSingle();
  if (data) {
    await supabase.from("documents").delete().eq("id", id);
    await supabase.storage.from("private-documents").remove([data.storage_path as string]);
  }
  refresh();
}

// ---------------------------------------------------------------------------
// Messages de contact
// ---------------------------------------------------------------------------
export async function toggleMessageHandled(formData: FormData) {
  const ctx = await assertPermission("contact.manage");
  const id = z.uuid().parse(formData.get("id"));
  const handled = formData.get("handled") === "1";
  const supabase = await createClient();
  await supabase
    .from("contact_messages")
    .update(handled ? { handled_at: new Date().toISOString(), handled_by: ctx.user.id } : { handled_at: null, handled_by: null })
    .eq("id", id);
  refresh();
}
