import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function createBrowserClient(): SupabaseClient {
  if (!url || !key) {
    // Avoid crashing at import/build time when env is missing
    return createClient("https://placeholder.supabase.co", "public-anon-key");
  }
  return createClient(url, key);
}

export const supabase = createBrowserClient();

export type Keyword = {
  id: string;
  text: string;
  active: boolean;
  created_at: string;
};

export type EventRow = {
  id: string;
  device_id: string;
  keyword: string;
  transcript: string | null;
  clip_path: string | null;
  triggered_at: string;
};
