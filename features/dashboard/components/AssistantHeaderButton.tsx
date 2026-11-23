'use client'

import { Sparkles } from 'lucide-react'
import { useSidebarWithSide } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

/**
 * Assistant trigger in the page top bar. While it is on screen the floating corner
 * button stays hidden (see DashboardLayout), so nothing covers rows or fields.
 */
export function AssistantHeaderButton({ className }: { className?: string }) {
  const { toggleSidebar, open, openMobile, isMobile } = useSidebarWithSide('right')
  const isOpen = isMobile ? openMobile : open
  return (
    <button
      type="button"
      data-assistant-header=""
      onClick={toggleSidebar}
      aria-label="Assistant"
      aria-pressed={isOpen}
      title="Assistant"
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-[7px] text-[var(--ks-dim)] transition-colors hover:bg-[var(--ks-hover)] hover:text-[var(--ks-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)] aria-pressed:bg-[var(--ks-hover)] aria-pressed:text-[var(--ks-accent-ink)]',
        className
      )}
    >
      <Sparkles className="size-4" aria-hidden="true" />
    </button>
  )
}
