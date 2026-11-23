'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { signOut } from '@/features/dashboard/actions/auth'

/** Appearance and session rows under the account form. */
export function AccountExtras() {
  return (
    <section aria-label="Preferences" className="ks-card mt-4 divide-y divide-[var(--ks-line)]">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[13px] font-medium text-[var(--ks-ink)]">Appearance</h2>
          <p className="text-[12px] text-[var(--ks-dim)]">System, light or dark</p>
        </div>
        <ThemeSwitcher withLabels className="shrink-0 max-sm:[&_span]:hidden" />
      </div>
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[13px] font-medium text-[var(--ks-ink)]">Session</h2>
          <p className="text-[12px] text-[var(--ks-dim)]">This browser</p>
        </div>
        <form action={signOut} className="ks-track shrink-0">
          <Button type="submit" size="sm" variant="outline" data-variant="danger">
            <LogOut />
            Sign out
          </Button>
        </form>
      </div>
    </section>
  )
}
