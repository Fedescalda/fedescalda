import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/** Cliente con la sesión del usuario (cookies). Respeta RLS. */
export async function createSessionClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: el middleware refresca la sesión.
        }
      },
    },
  });
}

/** Cliente anónimo sin cookies, para lecturas públicas cacheables. */
export function createPublicClient() {
  if (!isSupabaseConfigured) return null;
  return createPlainClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
}

/** Cliente con service role: SOLO en el servidor (API routes). Saltea RLS. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) return null;
  return createPlainClient(supabaseUrl, key, { auth: { persistSession: false } });
}
