'use client';

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/features/dashboard/actions";
import { AuthField, AuthMessage } from "@/features/dashboard/components/AuthShell";
import { PasswordInput } from "@/features/dashboard/components/PasswordInput";

type ResetFormProps = {
  mode: "reset" | "request";
  token: string | null;
}

type ActionState = {
  message: string | null;
  success: string | null;
  formData: {
    email: string;
  };
};

const initialState: ActionState = {
  message: null,
  success: null,
  formData: {
    email: '',
  }
};

function SubmitButton({ mode }: { mode: "reset" | "request" }) {
  const { pending } = useFormStatus();
  const label = mode === "reset" ? "Set password" : "Send reset link";

  return (
    <Button type="submit" className="h-9 w-full text-[13px]" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {pending ? (mode === "reset" ? "Saving" : "Sending") : label}
    </Button>
  );
}

async function formAction(
  prevState: ActionState | null,
  formData: FormData,
  mode: "reset" | "request",
  token: string | null
): Promise<ActionState> {
  // Add token to formData if in reset mode
  if (mode === 'reset' && token) {
    formData.append('token', token);
  }

  const result = await resetPassword(prevState ?? initialState, formData, mode);

  // Convert the result to match ActionState shape
  return {
    message: ('message' in result ? result.message : null) ?? null,
    success: ('success' in result ? result.success : null) ?? null,
    formData: result.formData
  };
}

export function ResetForm({ mode, token }: ResetFormProps) {
  const [state, dispatch] = useActionState(
    (prevState: ActionState | null, formData: FormData) => formAction(prevState, formData, mode, token),
    initialState
  );

  return (
    <>
      <form action={dispatch} className="flex flex-col gap-4">
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

        {mode === "reset" && (
          <AuthField id="password" label="New password">
            <PasswordInput id="password" name="password" autoComplete="new-password" required />
          </AuthField>
        )}

        <div className="ks-track mt-1 flex w-full">
          <SubmitButton mode={mode} />
        </div>
      </form>

      {state.message && <AuthMessage>{state.message}</AuthMessage>}
      {state.success && <AuthMessage tone="success">{state.success}</AuthMessage>}
    </>
  );
}
