"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { MAX_FILE_BYTES, fieldsFor, isEditable, schemaFor, type ApplicantType, type ApplicationStatus } from "@/lib/membership";

const ROUTE = "/espace/adhesion";

/** Charge le dossier modifiable de l'utilisateur, ou lève une erreur explicite. */
async function loadEditable(applicationId: string) {
  const user = await requireUser(ROUTE);
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("id,user_id,applicant_type,status,payload")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) throw new Error("Dossier introuvable.");
  if (!isEditable(data.status as ApplicationStatus)) throw new Error("Ce dossier n'est plus modifiable.");
  return { user, supabase, app: data as { id: string; applicant_type: ApplicantType; status: ApplicationStatus; payload: Record<string, unknown> } };
}

// ---------------------------------------------------------------------------
// Étape 1 : type de demande
// ---------------------------------------------------------------------------
export async function chooseApplicantType(formData: FormData) {
  const type = z.enum(["physical", "legal"]).safeParse(formData.get("applicant_type"));
  if (!type.success) redirect(`${ROUTE}?etape=type&erreur=type`);
  const user = await requireUser(ROUTE);
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("applications")
    .select("id,status,applicant_type")
    .eq("user_id", user.id)
    .in("status", ["draft", "submitted", "under_review", "additional_info"])
    .maybeSingle();

  if (current && current.status !== "draft") redirect(ROUTE);

  if (current) {
    // Changer de type réinitialise les informations : elles ne correspondent plus.
    if (current.applicant_type !== type.data) {
      const { count } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("application_id", current.id);
      if (count) redirect(`${ROUTE}?etape=type&erreur=pieces`);
      await supabase.from("applications").update({ applicant_type: type.data, payload: {} }).eq("id", current.id);
    }
  } else {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("kind", "member_type")
      .eq("slug", type.data === "physical" ? "personne-physique" : "personne-morale")
      .maybeSingle();
    const { error } = await supabase
      .from("applications")
      .insert({ user_id: user.id, applicant_type: type.data, category_id: category?.id ?? null, status: "draft" });
    if (error) {
      console.error("chooseApplicantType", error.message);
      redirect(`${ROUTE}?etape=type&erreur=creation`);
    }
  }
  redirect(`${ROUTE}?etape=informations`);
}

// ---------------------------------------------------------------------------
// Étape 2 : informations
// ---------------------------------------------------------------------------
export async function saveApplicationInfo(_prev: FormState, formData: FormData): Promise<FormState> {
  const applicationId = String(formData.get("application_id") ?? "");
  let ctx;
  try {
    ctx = await loadEditable(applicationId);
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
  const keys = fieldsFor(ctx.app.applicant_type);
  const values = formValues(formData, keys);
  const parsed = schemaFor(ctx.app.applicant_type).safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Merci de corriger les champs signalés.", fieldErrors: fieldErrors(parsed.error), values };
  }

  const { error } = await ctx.supabase.from("applications").update({ payload: parsed.data }).eq("id", ctx.app.id);
  if (error) {
    console.error("saveApplicationInfo", error.message);
    return { status: "error", message: "L'enregistrement a échoué. Réessayez.", values };
  }
  // Le profil du compte reprend le nom du candidat (personne physique).
  if (ctx.app.applicant_type === "physical") {
    const p = parsed.data as Record<string, unknown>;
    await ctx.supabase
      .from("profiles")
      .update({ first_name: String(p.first_name), last_name: String(p.last_name), phone: String(p.phone) })
      .eq("id", ctx.user.id);
  }
  redirect(`${ROUTE}?etape=pieces`);
}

// ---------------------------------------------------------------------------
// Étape 3 : pièces justificatives
// Le fichier est envoyé directement au stockage privé par le navigateur
// (dossier <user_id>/<application_id>/) ; cette action vérifie puis enregistre.
// ---------------------------------------------------------------------------
const documentSchema = z.object({
  applicationId: z.uuid(),
  documentType: z.string().min(1).max(60),
  storagePath: z.string().min(10).max(400),
  fileName: z.string().min(1).max(200),
  mimeType: z.string().min(3).max(100),
  sizeBytes: z.number().int().positive().max(MAX_FILE_BYTES),
});

export async function registerDocument(input: z.infer<typeof documentSchema>): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Fichier invalide (taille maximale : 10 Mo)." };
  const doc = parsed.data;

  let ctx;
  try {
    ctx = await loadEditable(doc.applicationId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const { supabase, user, app } = ctx;
  const folder = `${user.id}/${app.id}`;
  if (!doc.storagePath.startsWith(`${folder}/`) || doc.storagePath.includes("..")) return { ok: false, error: "Emplacement de fichier invalide." };

  const { data: rule } = await supabase
    .from("required_documents")
    .select("accepted_mime")
    .eq("applicant_type", app.applicant_type)
    .eq("key", doc.documentType)
    .maybeSingle();
  if (!rule) return { ok: false, error: "Type de pièce inconnu." };

  // Vérifie le fichier réellement stocké (taille et type déclarés par le stockage, pas par le navigateur).
  const name = doc.storagePath.slice(folder.length + 1);
  const { data: listed } = await supabase.storage.from("private-documents").list(folder, { search: name, limit: 5 });
  const object = listed?.find((o) => o.name === name);
  const realSize = Number(object?.metadata?.size ?? 0);
  const realMime = String(object?.metadata?.mimetype ?? "");
  const remove = () => supabase.storage.from("private-documents").remove([doc.storagePath]);
  if (!object) return { ok: false, error: "Le fichier n'a pas été reçu. Réessayez." };
  if (!(rule.accepted_mime as string[]).includes(realMime) || realSize <= 0 || realSize > MAX_FILE_BYTES) {
    await remove();
    return { ok: false, error: "Format ou taille de fichier non accepté pour cette pièce." };
  }

  // Une seule pièce par type : la précédente est remplacée.
  const { data: previous } = await supabase
    .from("documents")
    .select("id,storage_path")
    .eq("application_id", app.id)
    .eq("document_type", doc.documentType);

  const { error } = await supabase.from("documents").insert({
    bucket: "private-documents",
    storage_path: doc.storagePath,
    file_name: doc.fileName,
    mime_type: realMime,
    size_bytes: realSize,
    owner_id: user.id,
    application_id: app.id,
    document_type: doc.documentType,
  });
  if (error) {
    console.error("registerDocument", error.message);
    await remove();
    return { ok: false, error: "L'enregistrement de la pièce a échoué." };
  }
  if (previous?.length) {
    await supabase.from("documents").delete().in("id", previous.map((p) => p.id));
    await supabase.storage.from("private-documents").remove(previous.map((p) => p.storage_path as string));
  }
  return { ok: true };
}

export async function deleteDocument(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("document_id"));
  const applicationId = z.uuid().safeParse(formData.get("application_id"));
  if (!id.success || !applicationId.success) redirect(`${ROUTE}?etape=pieces`);
  const { supabase } = await loadEditable(applicationId.data);
  const { data } = await supabase.from("documents").select("storage_path").eq("id", id.data).eq("application_id", applicationId.data).maybeSingle();
  if (data) {
    await supabase.from("documents").delete().eq("id", id.data);
    await supabase.storage.from("private-documents").remove([data.storage_path as string]);
  }
  redirect(`${ROUTE}?etape=pieces`);
}

// ---------------------------------------------------------------------------
// Étape 4 : vérification et envoi
// ---------------------------------------------------------------------------
export async function submitApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("terms") !== "on") {
    return { status: "error", fieldErrors: { terms: ["Vous devez accepter les conditions pour envoyer votre demande."] } };
  }
  if (formData.get("accuracy") !== "on") {
    return { status: "error", fieldErrors: { accuracy: ["Vous devez certifier l'exactitude des informations."] } };
  }
  const applicationId = String(formData.get("application_id") ?? "");
  try {
    await loadEditable(applicationId);
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_application", { p_application_id: applicationId });
  if (error) {
    // Les messages métier de la fonction SQL sont destinés au candidat.
    const message = error.code === "P0001" || error.code === "P0002" ? error.message : "L'envoi a échoué. Réessayez dans un instant.";
    if (!(error.code === "P0001" || error.code === "P0002")) console.error("submitApplication", error.message);
    return { status: "error", message };
  }
  redirect(`${ROUTE}?envoye=1`);
}
