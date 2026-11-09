import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "./types";

/**
 * Client lié à la session de l'utilisateur (cookies). Les politiques RLS
 * s'appliquent avec son identité. À appeler uniquement derrière un <Suspense>
 * ou dans une Server Action / Route Handler.
 */
export async function createClient() {
  // La session (vérification du jeton, expiration via Date.now()) ne doit jamais
  // être figée dans une coque préchargée : on attend toujours la vraie requête.
  await connection();
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : le proxy rafraîchit déjà la session.
        }
      },
    },
  });
}
