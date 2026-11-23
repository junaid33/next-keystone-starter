"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createInitialUser, signIn } from "@/features/dashboard/actions";
import { AuthShell, AuthField, AuthMessage } from "@/features/dashboard/components/AuthShell";
import { PasswordInput } from "@/features/dashboard/components/PasswordInput";

type ActionState = {
  message: string | null;
  formData: {
    name: string;
    email: string;
  };
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-9 w-full text-[13px]" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {pending ? "Creating" : "Create account"}
    </Button>
  );
}

const initialState: ActionState = {
  message: null,
  formData: {
    name: "",
    email: "",
  },
};

export function InitPage() {
  const [state, formAction] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await createInitialUser(prevState, formData);

      if ("message" in result && result.message) {
        return {
          message: result.message,
          formData: {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
          },
        };
      }

      // If successful, sign in the user
      await signIn(
        {
          message: null,
          formData: {
            email: formData.get("email") as string,
          },
        },
        formData
      );

      return {
        message: null,
        formData: {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
        },
      };
    },
    initialState
  );

  return (
    <AuthShell title="Create admin account">
      <form action={formAction} className="flex flex-col gap-4">
        <AuthField id="name" label="Name">
          <Input
            type="text"
            id="name"
            name="name"
            autoComplete="name"
            className="h-9"
            defaultValue={state.formData.name}
            required
          />
        </AuthField>
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

export default InitPage;
