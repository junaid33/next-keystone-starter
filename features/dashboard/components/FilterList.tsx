'use client'

import { useState, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { X as XIcon, ChevronDownIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { enhanceFields } from '../utils/enhanceFields'

interface FilterListProps {
  list: any
}

interface Filter {
  field: string
  type: string
  value: unknown
}

interface FilterPillProps {
  filter: Filter
  field: any
}

interface EditDialogProps extends FilterPillProps {
  onClose: () => void
}

interface FilterWrapperProps {
  field: any
  operator: string
  value: unknown
  onChange: (value: unknown) => void
}

export function FilterList({ list }: FilterListProps) {
  const searchParams = useSearchParams()
  
  // Get enhanced fields using dashboard's pattern
  const enhancedFields = useMemo(() => {
    return enhanceFields(list.fields, list.key)
  }, [list.fields, list.key])
  
  // Pre-compute all possible filter combinations (exactly like KeystoneJS)
  const possibleFilters = useMemo(() => {
    const possibleFilters: Record<string, { type: string; field: string }> = {}

    for (const [fieldPath, field] of Object.entries(enhancedFields)) {
      if (field.controller?.filter) {
        for (const filterType in field.controller.filter.types) {
          possibleFilters[`!${fieldPath}_${filterType}`] = {
            type: filterType,
            field: fieldPath,
          }
        }
      }
    }
    return possibleFilters
  }, [enhancedFields])

  // Get active filters by checking URL params (exactly like KeystoneJS)
  const activeFilters = useMemo(() => {
    if (!searchParams) return []

    const filters: Array<{
      id: string
      fieldPath: string
      filterType: string
      value: unknown
      field: any
      controller: any
      Filter: any
      Label: (props: { type: string; value: unknown }) => string
    }> = []

    searchParams.forEach((value, key) => {
      const filter = possibleFilters[key]
      if (!filter) return
      
      const field = enhancedFields[filter.field]
      if (!field || !field.controller?.filter) return
      
      // Parse the JSON value
      let parsedValue
      try {
        parsedValue = JSON.parse(value)
      } catch {
        parsedValue = value
      }
      
      filters.push({
        id: key,
        fieldPath: filter.field,
        filterType: filter.type,
        value: parsedValue,
        field,
        controller: field.controller,
        Filter: field.controller.filter.Filter,
        Label: ({ type, value }: { type: string; value: unknown }) => {
          if (field.controller.filter.Label) {
            return field.controller.filter.Label({
              label: field.label,
              type,
              value
            })
          }
          return `${field.label} ${type} ${value}`
        }
      })
    })

    return filters
  }, [searchParams, possibleFilters, enhancedFields])

  if (activeFilters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {activeFilters.map((filter) => (
        <FilterPill
          key={filter.id}
          filter={{
            field: filter.fieldPath,
            type: filter.filterType,
            value: filter.value
          }}
          field={filter.field}
        />
      ))}
      <ClearFilters />
    </div>
  )
}

function ClearFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const clear = () => {
    const next = new URLSearchParams(searchParams?.toString() ?? '')
    for (const key of [...next.keys()]) if (key.startsWith('!')) next.delete(key)
    next.delete('page')
    router.push(`${pathname}?${next.toString()}`)
  }
  return (
    <button type="button" onClick={clear} className="h-6 rounded-[6px] px-1.5 text-[12px] text-[var(--ks-dim)] hover:text-[var(--ks-ink)]">
      Clear
    </button>
  )
}

function FilterPill({ filter, field }: FilterPillProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Get filter label using KeystoneJS pattern
  const filterLabel = useMemo(() => {
    if (field.controller?.filter?.Label) {
      const filterTypeLabel = field.controller.filter.types[filter.type]?.label || filter.type
      return field.controller.filter.Label({
        label: filterTypeLabel,
        type: filter.type,
        value: filter.value
      })
    }
    return `${field.label} ${filter.type} ${filter.value}`
  }, [field, filter])

  const onRemove = () => {
    const newSearchParams = new URLSearchParams(searchParams?.toString() ?? '')
    newSearchParams.delete(`!${filter.field}_${filter.type}`)
    newSearchParams.delete('page')
    router.push(`${pathname}?${newSearchParams.toString()}`)
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <div className="inline-flex h-6 max-w-full items-center rounded-[7px] bg-[var(--ks-selected)] text-[12px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ks-accent)_22%,transparent)]">
        <PopoverTrigger asChild>
          <button type="button" className="flex min-w-0 items-center gap-1 pl-2 pr-1 outline-none focus-visible:underline">
            <span className="shrink-0 text-[var(--ks-dim)]">{field.label}</span>
            <span className="truncate font-medium text-[var(--ks-ink)]">{filterLabel}</span>
            <ChevronDownIcon className="size-3 shrink-0 text-[var(--ks-label)]" />
          </button>
        </PopoverTrigger>
        <button
          type="button"
          aria-label={`Remove ${field.label} filter`}
          onClick={onRemove}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-r-[7px] text-[var(--ks-label)] hover:text-[var(--ks-danger)]"
        >
          <XIcon className="size-3" aria-hidden="true" />
        </button>
      </div>
      <PopoverContent align="start" className="w-[260px] p-0">
        <EditDialog
          filter={filter}
          field={field}
          onClose={() => setPopoverOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}

function FilterWrapper({ field, operator, value, onChange }: FilterWrapperProps) {
  // Get Filter component from field controller
  const Filter = field.controller?.filter?.Filter
  if (!Filter) return null
  
  return (
    <Filter
      autoFocus
      context="edit"
      type={operator}
      value={value as string | number | boolean}
      onChange={onChange}
    />
  )
}

function EditDialog({ filter, field, onClose }: EditDialogProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [value, setValue] = useState(filter.value)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const newSearchParams = new URLSearchParams(searchParams?.toString() ?? '')
    
    // Remove any existing filters for this field first
    const keysToRemove: string[] = []
    newSearchParams.forEach((_, key) => {
      if (key.startsWith(`!${filter.field}_`)) {
        keysToRemove.push(key)
      }
    })
    keysToRemove.forEach(key => newSearchParams.delete(key))
    
    // Reset page and add the updated filter
    newSearchParams.delete('page')
    newSearchParams.set(`!${filter.field}_${filter.type}`, JSON.stringify(value))
    
    router.push(`${pathname}?${newSearchParams.toString()}`)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="ks-label border-b border-[var(--ks-line)] px-3 py-2">{field.label}</div>
      <div className="p-3">
        <FilterWrapper
          field={field}
          operator={filter.type}
          value={value}
          onChange={setValue}
        />
      </div>
      <div className="flex justify-end border-t border-[var(--ks-line)] p-2">
        <div className="ks-track">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit">
            Apply
          </Button>
        </div>
      </div>
    </form>
  )
}