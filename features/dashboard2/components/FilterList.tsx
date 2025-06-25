'use client'

import { useState, useMemo } from "react"
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { X as XIcon, Filter as FilterIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
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
  
  // Get enhanced fields using dashboard2's pattern
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
    <div className="flex gap-1.5 border-t bg-muted/40 py-2 -mx-4 md:-mx-6 px-4 md:px-6 items-center">
      <div className="flex items-center gap-1.5 border-r border-muted-foreground/30 pr-2 mr-1.5">
        <FilterIcon
          className="stroke-muted-foreground/50 size-4"
          strokeWidth={1.5}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
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
      </div>
    </div>
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
      <PopoverTrigger asChild>
        <div
          className="inline-flex items-center rounded-md text-muted-foreground shadow-xs h-8"
          role="group"
        >
          <div className="flex border rounded-s-md h-full">
            <Button
              variant="outline"
              className="max-h-full rounded-none rounded-s-[calc(theme(borderRadius.md)-1px)] [&_svg]:size-3 w-8 h-8 px-2 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 shadow-xs border-r-0"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
            >
              <XIcon />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="py-0 shadow-none justify-start uppercase rounded-l-none border-l-0 [&_svg]:size-3.5 text-xs px-2 h-8 max-w-64"
          >
            <span className="opacity-75 truncate">{field.label}</span>
            <ChevronRightIcon className="shrink-0" />
            <span className="font-semibold truncate">
              {filterLabel}
            </span>
            <ChevronDownIcon className="shrink-0" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0">
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
    <form className="space-y-2" onSubmit={handleSubmit}>
      <div className="px-2 pt-3 pb-1">
        <FilterWrapper
          field={field}
          operator={filter.type}
          value={value}
          onChange={setValue}
        />
      </div>
      <Separator />
      <div className="flex justify-between gap-2 px-2 pb-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" type="submit">
          Save
        </Button>
      </div>
    </form>
  )
}