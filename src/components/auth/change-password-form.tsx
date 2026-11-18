"use client";

import { useActionState } from "react";
import { changePassword } from "@/lib/actions/auth";
import { Button, Field } from "@/components/ui";
import { FormError } from "./form-error";
import { PasswordInput } from "./password-input";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <Field label="Nova senha" htmlFor="password" error={errors.password} hint="Pelo menos 8 caracteres.">
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          autoFocus
          required
          minLength={8}
          aria-invalid={Boolean(errors.password)}
        />
      </Field>

      <Field label="Confirme a nova senha" htmlFor="confirm" error={errors.confirm}>
        <PasswordInput
          id="confirm"
          name="confirm"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(errors.confirm)}
        />
      </Field>

      {state?.error && <FormError>{state.error}</FormError>}

      <Button type="submit" disabled={pending} className="mt-1 w-full justify-center">
        {pending ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}
