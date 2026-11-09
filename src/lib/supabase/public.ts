import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "./types";

/**
 * Client anonyme sans cookies, pour lire les contenus publics dans des
 * fonctions "use cache". Il ne voit que ce que la RLS autorise au rôle anon.
 */
export function createPublicClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
