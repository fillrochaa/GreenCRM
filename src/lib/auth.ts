import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

export type SessionUser = { id: string; email: string; mustChangePassword: boolean };

/** Usuário logado, com o token verificado (assinatura e validade), ou null. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const { sub, email, user_metadata } = data.claims;
  return {
    id: sub,
    email: email ?? "",
    mustChangePassword: user_metadata?.must_change_password === true,
  };
});

/**
 * Porta de entrada de toda página e Server Action do CRM: exige login e que a
 * senha provisória já tenha sido trocada. O proxy só faz um redirecionamento
 * otimista; a verificação que vale é esta.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/trocar-senha");
  return user;
}
