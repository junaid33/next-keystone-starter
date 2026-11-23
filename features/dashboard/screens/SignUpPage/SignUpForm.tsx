"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signUp } from "@/features/dashboard/actions";
import { AuthShell, AuthField, AuthMessage, authLinkClass } from "@/features/dashboard/components/AuthShell";
import { PasswordInput } from "@/features/dashboard/components/PasswordInput";

type ActionState = {
  message: string | null;
  formData: {
    email: string;
  };
};

const initialState: ActionState = {
  message: null,
  formData: {
    email: "",
  },
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-9 w-full text-[13px]" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {pending ? "Creating account" : "Create account"}
    </Button>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState(signUp, initialState);

  return (
    <AuthShell
      title="Create account"
      foot={
        <>
          Have an account?{" "}
          <Link href="/dashboard/signin" className={authLinkClass}>
            Sign in
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <AuthField id="email" label="Email">
          <Input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-9"
            defaultValue={state.formData.email}
            required
          />
        </AuthField>
        <AuthField id="password" label="Password">
          <PasswordInput id="password" name="password" autoComplete="new-password" required />
        </AuthField>
        <div className="ks-track mt-1 flex w-full">
          <SubmitButton />
        </div>
      </form>

      {state.message && <AuthMessage>{state.message}</AuthMessage>}
    </AuthShell>
  );
}
