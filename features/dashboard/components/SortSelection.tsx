'use client'

import { useState, ReactNode } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ListMeta } from '../types'
import { cn } from '@/lib/utils'

interface SortSelectionProps {
  listMeta: ListMeta
  children?: ReactNode
}

export function SortSelection({ listMeta, children }: SortSelectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const query: Record<string, string> = {}
  if (searchParams) {
    for (const [key, value] of searchParams.entries()) {
      query[key] = value
    }
  }

  const resetSort = () => {
    const newQueryParams = new URLSearchParams(query)
    newQueryParams.delete('sortBy')
    router.push(`${pathname}?${newQueryParams.toString()}`)
    setIsOpen(false)
  }

  const handleSortChange = (fieldPath: string) => {
    const currentSortBy = searchParams?.get('sortBy')
    let newSortQuery = ''

    if (currentSortBy === fieldPath) {
      // Toggle direction if same field (ASC -> DESC)
      newSortQuery = `-${fieldPath}`
    } else if (currentSortBy === `-${fieldPath}`) {
      // Toggle direction if same field (DESC -> ASC)
      newSortQuery = fieldPath
    } else {
      // Default to ASC for new field
      newSortQuery = fieldPath
    }

    const newQueryParams = new URLSearchParams(query)
    newQueryParams.set('sortBy', newSortQuery)
    router.push(`${pathname}?${newQueryParams.toString()}`)
    setIsOpen(false)
  }

  const sortBy = searchParams?.get('sortBy') || ''
  const field = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy
  const direction = sortBy.startsWith('-') ? 'DESC' : 'ASC'

  const setSort = (fieldPath: string, dir: 'ASC' | 'DESC') => {
    const newQueryParams = new URLSearchParams(query)
    newQueryParams.set('sortBy', dir === 'DESC' ? `-${fieldPath}` : fieldPath)
    router.push(`${pathname}?${newQueryParams.toString()}`)
  }

  const DefaultTrigger = () => (
    <Button variant="outline" size="sm">
      <ArrowUpDown />
      Sort
    </Button>
  )

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>{children || <DefaultTrigger />}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px] p-0">
        <div className="flex h-9 items-center justify-between border-b border-[var(--ks-line)] pl-3 pr-1.5">
          <DropdownMenuLabel className="p-0">Sort by</DropdownMenuLabel>
          {field && (
            <div className="ks-seg" role="group" aria-label="Direction">
              {(['ASC', 'DESC'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={direction === d}
                  aria-label={d === 'ASC' ? 'Ascending' : 'Descending'}
                  onClick={() => setSort(field, d)}
                >
                  {d === 'ASC' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {Object.entries(listMeta.fields)
            .filter(([, f]) => f.isOrderable)
            .map(([fieldPath, fieldMeta]) => (
              <DropdownMenuItem key={fieldPath} onSelect={() => handleSortChange(fieldPath)} className="justify-between">
                <span className={cn(fieldPath === field && 'font-medium text-[var(--ks-ink)]')}>{fieldMeta.label}</span>
                {fieldPath === field && (
                  <span className="font-mono text-[12px] text-[var(--ks-accent)]">{direction === 'ASC' ? 'A→Z' : 'Z→A'}</span>
                )}
              </DropdownMenuItem>
            ))}
        </div>
        {field && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-1">
              <DropdownMenuItem onSelect={resetSort}>Default order</DropdownMenuItem>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
