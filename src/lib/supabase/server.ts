import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";

/** Cliente do Supabase Auth para Server Components e Server Actions, com a sessão nos cookies. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components não podem gravar cookies; o proxy renova a sessão nesses casos.
        }
      },
    },
  });
}
