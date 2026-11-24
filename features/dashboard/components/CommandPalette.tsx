'use client'

/**
 * Command palette (⌘K / Ctrl+K): jump to a list, create in a list, open a record.
 * Record search reuses the list search the list page already runs: buildWhereClause's
 * `search` (id equals + initialSearchFields contains) through getListItemsAction.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { CircleUser, CornerDownLeft, Home, Monitor, Moon, Plus, Sun } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { DialogTitle } from '@/components/ui/dialog'
import { useAdminMeta } from '../hooks/useAdminMeta'
import { visibleSidebarLists } from '../lib/sidebarAccess'
import { buildWhereClause } from '../lib/buildWhereClause'
import { getListItemsAction } from '../actions/getListItemsAction'

type PaletteCtx = { open: () => void }
const CommandPaletteContext = createContext<PaletteCtx>({ open: () => {} })

export function useCommandPalette() {
  return useContext(CommandPaletteContext)
}

type RecordHit = { listKey: string; listLabel: string; path: string; id: string; label: string }

function useRecordSearch(lists: any[], query: string, enabled: boolean) {
  const [hits, setHits] = useState<RecordHit[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const term = query.trim()
    if (!enabled || term.length < 2) {
      setHits([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      const results = await Promise.all(
        lists.map(async (list) => {
          const fields = Object.fromEntries((list.fields || []).map((f: any) => [f.path, f]))
          const where = buildWhereClause({ ...list, fields }, { search: term })
          const labelField = list.labelField || 'id'
          const res = await getListItemsAction(list.key, { where, take: 4, skip: 0 }, [labelField]).catch(() => null)
          if (!res || !res.success) return []
          return res.data.items.map((item: any) => ({
            listKey: list.key,
            listLabel: list.singular || list.label,
            path: list.path,
            id: item.id,
            label: String(item[labelField] ?? item.id),
          }))
        })
      )
      if (!cancelled) {
        setHits(results.flat())
        setLoading(false)
      }
    }, 180)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [lists, query, enabled])

  return { hits, loading }
}

export function CommandPaletteProvider({ children, user }: { children: React.ReactNode; user?: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { setTheme } = useTheme()
  const { adminMeta } = useAdminMeta()

  const lists = useMemo(
    () => visibleSidebarLists(((adminMeta?.lists || []) as any[]).filter((l) => !l.isSingleton), user),
    [adminMeta, user]
  )
  const { hits, loading } = useRecordSearch(lists, query, isOpen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!isOpen) setQuery('')
  }, [isOpen])

  const go = useCallback(
    (href: string) => {
      setIsOpen(false)
      router.push(href)
    },
    [router]
  )

  const ctx = useMemo(() => ({ open: () => setIsOpen(true) }), [])

  return (
    <CommandPaletteContext.Provider value={ctx}>
      {children}
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTitle className="sr-only">Search</DialogTitle>
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search" />
        <CommandList className="max-h-[min(60vh,420px)] pb-1">
          <CommandEmpty>{loading ? 'Searching' : 'No results'}</CommandEmpty>

          {hits.length > 0 && (
            <CommandGroup heading="Records">
              {hits.map((hit) => (
                <CommandItem
                  key={`${hit.listKey}:${hit.id}`}
                  value={`record ${hit.listKey} ${hit.id} ${hit.label}`}
                  keywords={[query]}
                  onSelect={() => go(`/dashboard/${hit.path}/${hit.id}`)}
                >
                  <span className="truncate">{hit.label}</span>
                  <span className="ml-auto shrink-0 text-[12px] text-[var(--ks-label)]">{hit.listLabel}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Go to">
            <CommandItem value="Overview" onSelect={() => go('/dashboard')}>
              <Home />
              Overview
            </CommandItem>
            {lists.map((list: any) => (
              <CommandItem key={list.key} value={`go ${list.label}`} onSelect={() => go(`/dashboard/${list.path}`)}>
                {list.label}
              </CommandItem>
            ))}
            <CommandItem value="Account" onSelect={() => go('/dashboard/account')}>
              <CircleUser />
              Account
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Create">
            {lists
              .filter((list: any) => !list.hideCreate)
              .map((list: any) => (
                <CommandItem key={list.key} value={`new ${list.singular}`} onSelect={() => go(`/dashboard/${list.path}/create`)}>
                  <Plus />
                  New {list.singular}
                </CommandItem>
              ))}
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem value="theme light" onSelect={() => { setTheme('light'); setIsOpen(false) }}>
              <Sun />
              Light
            </CommandItem>
            <CommandItem value="theme dark" onSelect={() => { setTheme('dark'); setIsOpen(false) }}>
              <Moon />
              Dark
            </CommandItem>
            <CommandItem value="theme system" onSelect={() => { setTheme('system'); setIsOpen(false) }}>
              <Monitor />
              System
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <div className="flex items-center gap-3 border-t border-[var(--ks-line)] px-3 py-2 text-[12px] text-[var(--ks-label)] max-md:hidden">
          <span className="inline-flex items-center gap-1.5"><span className="ks-kbd">↑↓</span>Move</span>
          <span className="inline-flex items-center gap-1.5"><span className="ks-kbd"><CornerDownLeft className="size-3" /></span>Open</span>
          <span className="inline-flex items-center gap-1.5"><span className="ks-kbd">esc</span>Close</span>
        </div>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  )
}
