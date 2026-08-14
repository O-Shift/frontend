import { createBrowserClient } from "@supabase/ssr";

function initClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createBrowserClient(url, anonKey);
}

let client: ReturnType<typeof initClient> | undefined;

export function createClient() {
  if (!client) {
    client = initClient();
  }
  return client;
}
