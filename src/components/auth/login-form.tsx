"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";
import { Button, Field, Input } from "@/components/ui";
import { FormError } from "./form-error";
import { PasswordInput } from "./password-input";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next ?? ""} />

      <Field label="E-mail" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          autoFocus
          required
          defaultValue={state?.email}
          aria-invalid={Boolean(errors.email)}
        />
      </Field>

      <Field label="Senha" htmlFor="password" error={errors.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(errors.password)}
        />
      </Field>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending} className="mt-1 w-full justify-center">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
