'use client';

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signIn } from "@/features/dashboard/actions";
import { AuthField, AuthMessage } from "@/features/dashboard/components/AuthShell";
import { PasswordInput } from "@/features/dashboard/components/PasswordInput";

type SignInFormProps = {
  from: string;
}

type ActionState = {
  message: string | null;
  formData: {
    email: string;
  };
};

const initialState: ActionState = {
  message: null,
  formData: {
    email: '',
  }
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-9 w-full text-[13px]" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {pending ? "Signing in" : "Sign in"}
    </Button>
  );
}

export function SignInForm({ from }: SignInFormProps) {
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="from" value={from} />
        <AuthField id="email" label="Email">
          <Input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-9"
            defaultValue={state.formData.email}
            aria-invalid={state.message ? true : undefined}
            required
          />
        </AuthField>
        <AuthField
          id="password"
          label="Password"
          aside={
            <Link href="/dashboard/reset" className="text-[12px] text-[var(--ks-dim)] hover:text-[var(--ks-ink)]">
              Forgot?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            aria-invalid={state.message ? true : undefined}
            required
          />
        </AuthField>
        <div className="ks-track mt-1 flex w-full">
          <SubmitButton />
        </div>
      </form>

      {state.message && <AuthMessage>{state.message}</AuthMessage>}
    </>
  );
}
