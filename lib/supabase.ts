import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, hasSupabase } from "@/lib/env";

// Ein Supabase-Client für den Server, mit dem Service-Role-Key.
// Gibt null zurück, solange SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen —
// dann läuft die App wie bisher ohne Datenbank (Katalog aus catalog.json,
// Bestellungen und Render-Kosten nur im Server-Log).
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!hasSupabase()) return null;
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
