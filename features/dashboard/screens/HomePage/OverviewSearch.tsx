'use client'

import { Search } from 'lucide-react'
import { useCommandPalette } from '../../components/CommandPalette'

/** Find-a-record entry on the overview: opens the command palette's record search. */
export function OverviewSearch() {
  const palette = useCommandPalette()
  return (
    <button
      type="button"
      onClick={palette.open}
      className="ks-field flex h-10 w-full items-center gap-2.5 px-3 text-left text-[13px] text-[var(--ks-label)] hover:text-[var(--ks-dim)]"
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 truncate">Search records</span>
      <kbd className="ks-kbd max-sm:hidden">⌘K</kbd>
    </button>
  )
}
