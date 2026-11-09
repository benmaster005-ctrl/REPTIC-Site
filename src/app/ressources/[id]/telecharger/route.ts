import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Téléchargement d'une ressource publique : lien signé valable 60 secondes,
 * créé avec le client anonyme. La RLS ne laisse passer que les documents
 * marqués « public » (migration 7).
 */
export async function GET(_request: NextRequest, { params }: RouteContext<"/ressources/[id]/telecharger">) {
  const { id } = await params;
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Document introuvable", { status: 404 });

  const supabase = createPublicClient();
  const { data } = await supabase.from("documents").select("bucket,storage_path,file_name").eq("id", id).eq("visibility", "public").maybeSingle();
  if (!data) return new NextResponse("Document introuvable", { status: 404 });

  const { data: signed } = await supabase.storage.from(data.bucket as string).createSignedUrl(data.storage_path as string, 60, { download: data.file_name as string });
  if (!signed?.signedUrl) return new NextResponse("Document momentanément indisponible", { status: 503 });

  return NextResponse.redirect(signed.signedUrl, { headers: { "Cache-Control": "no-store" } });
}
