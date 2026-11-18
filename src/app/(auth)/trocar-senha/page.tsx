import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export const metadata: Metadata = { title: "Trocar senha" };

export default async function TrocarSenhaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <h1 className="font-display text-h1 font-semibold tracking-[-0.015em]">
        {user.mustChangePassword ? "Crie sua senha" : "Trocar senha"}
      </h1>
      <p className="mt-2 mb-8 text-ink-muted">
        {user.mustChangePassword ? (
          <>
            Você entrou com uma senha provisória. Defina uma senha só sua para continuar usando o GreenCRM
            como <span className="font-medium text-ink">{user.email}</span>.
          </>
        ) : (
          <>
            Defina uma nova senha para <span className="font-medium text-ink">{user.email}</span>.
          </>
        )}
      </p>
      <ChangePasswordForm />
      {!user.mustChangePassword && (
        <Link href="/funil" className="mt-6 inline-block text-label text-ink-muted hover:text-ink">
          ← Voltar ao Funil
        </Link>
      )}
    </>
  );
}
