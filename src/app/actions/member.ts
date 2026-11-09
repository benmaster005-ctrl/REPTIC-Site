"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { queueEmail } from "@/lib/email/send";
import { formatDate } from "@/lib/format";

// ---------------------------------------------------------------------------
// Profil
// ---------------------------------------------------------------------------
const phone = z
  .string()
  .trim()
  .max(30)
  .regex(/^[+\d\s().-]*$/, { error: "Numéro de téléphone invalide." })
  .optional()
  .transform((v) => v || null);

const accountSchema = z.object({
  first_name: z.string().trim().min(1, { error: "Indiquez votre prénom." }).max(80),
  last_name: z.string().trim().min(1, { error: "Indiquez votre nom." }).max(80),
  phone,
});

export async function updateAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/espace/profil");
  const values = formValues(formData, ["first_name", "last_name", "phone"]);
  const parsed = accountSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { status: "error", message: "L'enregistrement a échoué.", values };
  refresh();
  return { status: "success", message: "Vos informations ont été enregistrées.", values };
}

const memberSchema = z.object({
  profession: z.string().trim().max(120).optional().transform((v) => v || null),
  city: z.string().trim().max(80).optional().transform((v) => v || null),
  phone,
  bio: z.string().trim().max(600, { error: "600 caractères maximum." }).optional().transform((v) => v || null),
  directory_visibility: z.enum(["public", "members", "hidden"]).transform((v) => (v === "hidden" ? null : v)),
});

export async function updateMemberProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/espace/profil");
  const values = formValues(formData, ["profession", "city", "phone", "bio", "directory_visibility"]);
  const parsed = memberSchema.safeParse(values);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  const supabase = await createClient();
  const { error } = await supabase.from("members").update(parsed.data).eq("user_id", user.id);
  if (error) return { status: "error", message: "L'enregistrement a échoué.", values };
  refresh();
  return { status: "success", message: "Votre fiche membre a été mise à jour.", values };
}

// ---------------------------------------------------------------------------
// Sécurité
// ---------------------------------------------------------------------------
const passwordSchema = z
  .object({
    current: z.string().min(1, { error: "Saisissez votre mot de passe actuel." }),
    password: z
      .string()
      .min(10, { error: "10 caractères minimum." })
      .regex(/[A-Za-z]/, { error: "Au moins une lettre." })
      .regex(/\d/, { error: "Au moins un chiffre." }),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], error: "Les mots de passe ne correspondent pas." })
  .refine((v) => v.password !== v.current, { path: ["password"], error: "Le nouveau mot de passe doit être différent." });

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/espace/securite");
  const parsed = passwordSchema.safeParse({ current: formData.get("current"), password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  // Re-vérifie le mot de passe actuel avant tout changement.
  const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password: parsed.data.current });
  if (authError) return { status: "error", fieldErrors: { current: ["Mot de passe actuel incorrect."] } };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: "Le mot de passe n'a pas pu être modifié." };
  return { status: "success", message: "Votre mot de passe a été modifié." };
}

/** Ferme toutes les sessions ouvertes (tous les appareils). */
export async function signOutEverywhere() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/connexion?deconnecte=1");
}

/** Ferme les autres sessions, garde celle-ci. */
export async function signOutOthers() {
  await requireUser("/espace/securite");
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "others" });
  redirect("/espace/securite?autres=1");
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function markAllNotificationsRead() {
  const user = await requireUser("/espace/notifications");
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  refresh();
}

export async function openNotification(formData: FormData) {
  const user = await requireUser("/espace/notifications");
  const id = z.uuid().safeParse(formData.get("id"));
  const link = String(formData.get("link") ?? "");
  if (id.success) {
    const supabase = await createClient();
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id.data).eq("user_id", user.id).is("read_at", null);
  }
  redirect(link.startsWith("/") && !link.startsWith("//") ? link : "/espace/notifications");
}

// ---------------------------------------------------------------------------
// Événements
// ---------------------------------------------------------------------------
export async function registerForEvent(formData: FormData) {
  const user = await requireUser("/espace/evenements");
  const eventId = z.uuid().safeParse(formData.get("event_id"));
  if (!eventId.success) redirect("/espace/evenements");
  const supabase = await createClient();
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  const { data: existing } = await supabase.from("event_registrations").select("id").eq("event_id", eventId.data).eq("user_id", user.id).maybeSingle();
  const { error } = existing
    ? await supabase.from("event_registrations").update({ status: "registered" }).eq("id", existing.id)
    : await supabase.from("event_registrations").insert({ event_id: eventId.data, user_id: user.id, full_name: fullName, email: user.email });
  if (!error) {
    const [{ data: ev }, { data: reg }] = await Promise.all([
      supabase.from("events").select("title,starts_at,location_name,city").eq("id", eventId.data).maybeSingle(),
      supabase.from("event_registrations").select("status").eq("event_id", eventId.data).eq("user_id", user.id).maybeSingle(),
    ]);
    if (ev) {
      queueEmail("event.registered", user.email, {
        prenom: user.firstName ?? "",
        evenement: ev.title as string,
        date: formatDate(ev.starts_at as string, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        lieu: [ev.location_name, ev.city].filter(Boolean).join(", ") || null,
        statut: reg?.status === "waitlisted" ? "Liste d'attente (vous serez prévenu si une place se libère)" : "Inscription confirmée",
      });
    }
  }
  redirect(`/espace/evenements?${error ? "erreur=inscription" : "inscrit=1"}#evenement-${eventId.data}`);
}

export async function cancelEventRegistration(formData: FormData) {
  const user = await requireUser("/espace/evenements");
  const id = z.uuid().safeParse(formData.get("registration_id"));
  if (id.success) {
    const supabase = await createClient();
    await supabase.from("event_registrations").update({ status: "cancelled" }).eq("id", id.data).eq("user_id", user.id);
  }
  redirect("/espace/evenements?annule=1");
}

// ---------------------------------------------------------------------------
// Téléchargement : lien signé de courte durée (§8.2)
// ---------------------------------------------------------------------------
export async function downloadDocument(formData: FormData) {
  await requireUser("/espace/documents");
  const id = z.uuid().safeParse(formData.get("document_id"));
  if (!id.success) redirect("/espace/documents");
  const supabase = await createClient();
  // La RLS de documents filtre déjà ce que l'utilisateur a le droit de voir.
  const { data } = await supabase.from("documents").select("bucket,storage_path,file_name").eq("id", id.data).maybeSingle();
  if (!data) redirect("/espace/documents?erreur=acces");
  const { data: signed } = await supabase.storage
    .from(data.bucket as string)
    .createSignedUrl(data.storage_path as string, 60, { download: data.file_name as string });
  if (!signed?.signedUrl) redirect("/espace/documents?erreur=lien");
  redirect(signed.signedUrl);
}
