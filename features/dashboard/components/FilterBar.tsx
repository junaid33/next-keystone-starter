'use client'

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, SlidersHorizontal, ArrowUpDown, Columns3, X } from "lucide-react"
import { FilterAdd } from "./FilterAdd"
import { FilterList } from "./FilterList"
import { SortSelection } from "./SortSelection"
import { FieldSelection } from "./FieldSelection"
import { enhanceFields } from '../utils/enhanceFields'

interface FilterBarProps {
  list: any
  selectedFields?: Set<string>
}

/**
 * Find-a-record toolbar: search on the left, Filter / Sort / Columns pills in one track on the right,
 * active filter chips below. All state stays in the URL (search, page, sortBy, fields, !field_type).
 */
export function FilterBar({ list, selectedFields = new Set() }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const [searchString, setSearchString] = useState(searchParams?.get("search") || "")

  const enhancedFields = useMemo(() => enhanceFields(list.fields, list.key), [list.fields, list.key])

  const createQueryString = (params: Record<string, string | number | null | undefined>) => {
    const newSearchParams = new URLSearchParams(searchParams?.toString() || "")
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") newSearchParams.delete(key)
      else newSearchParams.set(key, String(value))
    })
    return newSearchParams.toString()
  }

  const updateSearch = (value: string) => {
    const query = createQueryString({ search: value.trim() || null, page: null })
    router.push(`${pathname}?${query}`)
  }

  useEffect(() => {
    setSearchString(searchParams?.get("search") || "")
  }, [searchParams])

  // "/" focuses search, like Linear and GitHub
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key !== "/" || e.metaKey || e.ctrlKey || t.closest("input,textarea,[contenteditable=true]")) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const searchLabels = (list.initialSearchFields || [])
    .map((path: string) => enhancedFields[path]?.label)
    .filter(Boolean) as string[]
  const placeholder = `Search ${searchLabels.length ? searchLabels.join(", ").toLowerCase() : "by ID"}`

  const hasSort = !!searchParams?.get("sortBy")
  const hasFields = !!searchParams?.get("fields")

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <form
          role="search"
          className="ks-field relative flex h-8 min-w-0 flex-1 items-center md:max-w-[420px]"
          onSubmit={(e) => {
            e.preventDefault()
            updateSearch(searchString)
          }}
        >
          <Search className="pointer-events-none absolute left-2.5 size-3.5 text-[var(--ks-label)]" />
          <input
            ref={inputRef}
            type="search"
            aria-label="Search"
            className="h-full w-full min-w-0 bg-transparent pl-8 pr-8 text-[13px] text-[var(--ks-ink)] outline-none placeholder:text-[var(--ks-label)] [&::-webkit-search-cancel-button]:hidden"
            value={searchString}
            onChange={(e) => setSearchString(e.target.value)}
            onBlur={() => {
              if ((searchParams?.get("search") || "") !== searchString.trim()) updateSearch(searchString)
            }}
            placeholder={placeholder}
          />
          {searchString ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearchString("")
                updateSearch("")
              }}
              className="absolute right-1.5 grid size-5 place-items-center rounded-[5px] text-[var(--ks-label)] hover:text-[var(--ks-ink)]"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <span className="ks-kbd pointer-events-none absolute right-1.5 h-5 max-md:hidden">/</span>
          )}
        </form>

        <div className="ks-track ml-auto shrink-0">
          <FilterAdd list={list}>
            <Button variant="outline" size="sm" aria-label="Filter" className="max-sm:w-7 max-sm:px-0">
              <SlidersHorizontal />
              <span className="max-sm:hidden">Filter</span>
            </Button>
          </FilterAdd>
          <SortSelection listMeta={list}>
            <Button variant="outline" size="sm" aria-label="Sort" className="max-sm:w-7 max-sm:px-0">
              <ArrowUpDown className={hasSort ? "!text-[var(--ks-accent)]" : undefined} />
              <span className="max-sm:hidden">Sort</span>
            </Button>
          </SortSelection>
          <FieldSelection listMeta={list} selectedFields={selectedFields}>
            <Button variant="outline" size="sm" aria-label="Columns" className="max-sm:w-7 max-sm:px-0">
              <Columns3 className={hasFields ? "!text-[var(--ks-accent)]" : undefined} />
              <span className="max-sm:hidden">Columns</span>
            </Button>
          </FieldSelection>
        </div>
      </div>

      <FilterList list={list} />
    </div>
  )
}
