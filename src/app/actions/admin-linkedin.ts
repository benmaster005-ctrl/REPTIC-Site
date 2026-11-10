"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { syncLinkedin } from "@/lib/linkedin";
import { tags } from "@/lib/data/public";
import { type FormState } from "@/lib/forms";

/** Lance la collecte, ou importe celle en cours si elle est prête. */
export async function syncLinkedinNow(): Promise<FormState> {
  let ctx;
  try {
    ctx = await assertPermission("content.manage");
  } catch (e) {
    return { status: "error", message: (e as Error).message };
  }
  const result = await syncLinkedin(ctx.user.id);
  refresh();
  switch (result.status) {
    case "started":
      return { status: "success", message: "Collecte lancée chez Bright Data. Elle prend quelques minutes : cliquez de nouveau dans un moment pour importer les posts." };
    case "running":
      return { status: "success", message: "La collecte est toujours en cours. Réessayez dans quelques minutes." };
    case "imported":
      updateTag(tags.linkedin);
      return { status: "success", message: `${result.count} post${result.count > 1 ? "s" : ""} importé${result.count > 1 ? "s" : ""}${result.skipped ? ` (${result.skipped} ignoré${result.skipped > 1 ? "s" : ""} : autre auteur)` : ""}.` };
    default:
      return { status: "error", message: result.error };
  }
}

export async function setLinkedinPostVisibility(formData: FormData) {
  await assertPermission("content.manage");
  const id = z.string().min(1).max(200).parse(formData.get("id"));
  const visible = formData.get("visible") === "1";
  const supabase = await createClient();
  await supabase.from("linkedin_posts").update({ is_visible: visible }).eq("id", id);
  updateTag(tags.linkedin);
  refresh();
}
