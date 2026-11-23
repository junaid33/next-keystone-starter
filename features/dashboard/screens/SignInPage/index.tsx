// Server Component
import { SignInForm } from "./SignInForm";
import Link from "next/link";
import { publicSignUpsAllowed } from "../../lib/authFlow";
import { AuthShell, authLinkClass } from "../../components/AuthShell";

type SignInPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const from =
    typeof resolvedSearchParams.from === "string"
      ? resolvedSearchParams.from
      : "/dashboard";

  return (
    <AuthShell
      title="Sign in"
      foot={
        publicSignUpsAllowed() ? (
          <>
            No account?{" "}
            <Link href="/dashboard/signup" className={authLinkClass}>
              Sign up
            </Link>
          </>
        ) : undefined
      }
    >
      <SignInForm from={from} />
    </AuthShell>
  );
}
