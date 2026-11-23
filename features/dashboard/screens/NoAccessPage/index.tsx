'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Lock, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/features/dashboard/actions/auth';
import { AuthShell } from '@/features/dashboard/components/AuthShell';

export function NoAccessPage() {
  const router = useRouter();

  return (
    <AuthShell title="No access">
      <div className="-mt-2 mb-5 flex items-center gap-2 text-[13px] text-[var(--ks-dim)]">
        <span className="ks-dot" data-tone="red" aria-hidden="true" />
        <Lock className="size-3.5" aria-hidden="true" />
        <span>Role without dashboard access</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="ks-track flex w-full">
          <Button type="button" variant="outline" size="sm" className="h-8 flex-1" onClick={() => router.back()}>
            <ArrowLeft />
            Back
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8 flex-1" onClick={() => router.push('/')}>
            <Home />
            Home
          </Button>
        </div>
        <form action={signOut} className="ks-track flex w-full">
          <Button type="submit" variant="outline" size="sm" data-variant="danger" className="h-8 w-full">
            <LogOut />
            Sign out
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}

export default NoAccessPage;
