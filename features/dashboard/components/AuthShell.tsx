/**
 * AuthShell: the one frame for sign-in, sign-up, reset, first-run and no-access.
 * A single calm card on the page tone, the product mark above it and an optional foot link below.
 */

import React from 'react'
import { LogoIcon } from './Logo'
import { cn } from '@/lib/utils'

export function AuthShell({
  title,
  description,
  children,
  foot,
  className,
}: {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  foot?: React.ReactNode
  className?: string
}) {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center bg-[var(--ks-page)] px-4 py-10">
      <div className={cn('w-full max-w-[360px]', className)}>
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="ks-raised grid size-8 place-items-center rounded-[9px]">
            <LogoIcon className="size-4" suffix="-auth" />
          </span>
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--ks-ink)]">Keystone</span>
        </div>
        <div className="ks-card px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
          <h1 className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-[var(--ks-ink)]">{title}</h1>
          {description && <p className="mt-1 text-[13px] leading-5 text-[var(--ks-dim)]">{description}</p>}
          <div className="mt-5">{children}</div>
        </div>
        {foot && <div className="mt-4 text-center text-[12px] text-[var(--ks-dim)]">{foot}</div>}
      </div>
    </main>
  )
}

/** Label + control stack used by every auth form. */
export function AuthField({ id, label, aside, children }: { id: string; label: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[12px] font-medium text-[var(--ks-ink-2)]">
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  )
}

/** Inline form message: danger for failures, green for sent links, neutral for notices. */
export function AuthMessage({ tone = 'danger', className, children }: { tone?: 'danger' | 'success' | 'neutral'; className?: string; children: React.ReactNode }) {
  const color = tone === 'danger' ? 'var(--ks-red)' : tone === 'success' ? 'var(--ks-green)' : 'var(--ks-gray)'
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('mt-4 rounded-[10px] px-3 py-2.5 text-[13px] leading-5 break-words', className)}
      style={{
        color: tone === 'danger' ? 'var(--ks-danger)' : tone === 'success' ? color : 'var(--ks-ink-2)',
        background: `color-mix(in oklab, ${color} 9%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 26%, transparent)`,
      }}
    >
      {children}
    </div>
  )
}

export const authLinkClass = 'font-medium text-[var(--ks-accent-ink)] underline-offset-4 hover:underline'
