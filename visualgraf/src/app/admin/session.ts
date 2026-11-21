import "server-only";
import { cache } from "react";
import { createSessionClient } from "@/lib/supabase/server";

export async function getAdminClient() {
  const supabase = await createSessionClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true ? supabase : null;
}

export const getPanelClient = cache(getAdminClient);
