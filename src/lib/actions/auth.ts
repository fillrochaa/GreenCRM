"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthFormState =
  | { error?: string; fieldErrors?: Record<string, string>; email?: string }
  | undefined;

function fieldErrorsOf(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  return fieldErrors;
}

/** Só aceita caminhos internos, para o ?next= não virar um redirecionamento para fora. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/funil";
}

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Informe seu e-mail.")
    .refine((v) => z.email().safeParse(v).success, "E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), email };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const wrong = error.code === "invalid_credentials";
    return {
      error: wrong ? "E-mail ou senha incorretos." : "Não foi possível entrar agora. Tente de novo em instantes.",
      email,
    };
  }

  const mustChange = data.user.user_metadata?.must_change_password === true;
  redirect(mustChange ? "/trocar-senha" : safeNext(formData.get("next")));
}

const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Use pelo menos 8 caracteres.").max(72, "Use no máximo 72 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "As senhas não conferem." });

export async function changePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!(await getCurrentUser())) redirect("/login");

  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password") ?? "",
    confirm: formData.get("confirm") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: { must_change_password: false },
  });
  if (error) {
    if (error.code === "same_password") {
      return { fieldErrors: { password: "A nova senha precisa ser diferente da atual." } };
    }
    if (error.code === "weak_password") {
      return { fieldErrors: { password: "Senha fraca demais. Misture letras, números e símbolos." } };
    }
    return { error: "Não foi possível trocar a senha agora. Tente de novo." };
  }

  // Pega um token novo, já sem a marca de senha provisória.
  await supabase.auth.refreshSession();
  redirect("/funil");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
