// Server Component
import { ResetForm } from "./ResetForm";
import Link from "next/link";
import { passwordResetEmailAvailable, RESET_EMAIL_UNAVAILABLE } from "../../lib/authFlow";
import { AuthShell, AuthMessage, authLinkClass } from "../../components/AuthShell";

type ResetPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function ResetPage({ searchParams }: ResetPageProps) {
  const resolvedSearchParams = await searchParams;
  const token =
    typeof resolvedSearchParams.token === "string"
      ? resolvedSearchParams.token
      : null;

  const mode = token ? "reset" : "request";
  const emailUnavailable = mode === "request" && !passwordResetEmailAvailable();

  return (
    <AuthShell
      title={mode === "reset" ? "New password" : "Reset password"}
      foot={
        <Link href="/dashboard/signin" className={authLinkClass}>
          Back to sign in
        </Link>
      }
    >
      {emailUnavailable ? (
        <AuthMessage tone="neutral" className="mt-0">{RESET_EMAIL_UNAVAILABLE}</AuthMessage>
      ) : (
        <ResetForm mode={mode} token={token} />
      )}
    </AuthShell>
  );
}
