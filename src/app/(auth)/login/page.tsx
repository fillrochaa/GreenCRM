import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <>
      <h1 className="font-display text-h1 font-semibold tracking-[-0.015em]">Entrar</h1>
      <p className="mt-2 mb-8 text-ink-muted">Acesse o GreenCRM com seu e-mail e senha.</p>
      <LoginForm next={next} />
    </>
  );
}
