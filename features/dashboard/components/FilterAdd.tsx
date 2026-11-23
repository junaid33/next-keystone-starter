'use client'

import { Fragment, useMemo, useState, ReactNode } from "react"
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { enhanceFields } from '../utils/enhanceFields'

interface FilterState {
  kind: "selecting-field" | "filter-value"
  fieldPath: string | null
  filterType: string | null
  filterValue: string | number | boolean | null
}

interface FilterAddProps {
  list: any
  children: ReactNode
}

export function FilterAdd({ list, children }: FilterAddProps) {
  const [isOpen, setIsOpen] = useState(false)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  
  // Get enhanced fields using dashboard's pattern
  const enhancedFields = useMemo(() => {
    return enhanceFields(list.fields, list.key)
  }, [list.fields, list.key])

  // Get filterable fields with their filter implementations
  const filterableFields = useMemo(() => {
    const fields: Record<string, any> = {}
    
    Object.entries(enhancedFields).forEach(([fieldPath, field]: [string, any]) => {
      // Check if field has filter capability via controller
      if (field.controller?.filter && Object.keys(field.controller.filter.types || {}).length > 0) {
        fields[fieldPath] = field
      }
    })
    
    return fields
  }, [enhancedFields])

  const [state, setState] = useState<FilterState>({
    kind: "selecting-field",
    fieldPath: null,
    filterType: null,
    filterValue: null
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (state.kind === "filter-value" && state.fieldPath && state.filterType && searchParams) {
      // Allow null values for empty/not_empty filters
      const allowNullValue = state.filterType === 'empty' || state.filterType === 'not_empty'
      
      if (state.filterValue !== null || allowNullValue) {
        const newSearchParams = new URLSearchParams(searchParams.toString())
        
        // Remove the page parameter and add the new filter
        newSearchParams.delete('page')
        const filterKey = `!${state.fieldPath}_${state.filterType}`
        newSearchParams.set(filterKey, JSON.stringify(state.filterValue))
        
        router.push(`${pathname}?${newSearchParams.toString()}`)
        setIsOpen(false)
      }
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      {isOpen && (
        <PopoverContent align="end" className="w-[280px] p-0">
          <form onSubmit={handleSubmit}>
            <div className="flex h-9 items-center gap-1 border-b border-[var(--ks-line)] px-2">
              {state.kind !== "selecting-field" && (
                <Button
                  type="button"
                  onClick={() => setState({ kind: "selecting-field", fieldPath: state.fieldPath, filterType: null, filterValue: null })}
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Back"
                  className="size-6"
                >
                  <ChevronLeft />
                </Button>
              )}
              <div className="ks-label px-1">
                {state.kind === "selecting-field"
                  ? "Filter"
                  : state.fieldPath ? enhancedFields[state.fieldPath]?.label : ""}
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3">
              {state.kind === "selecting-field" && (
                <Select
                  value={state.fieldPath || undefined}
                  onValueChange={(fieldPath) => {
                    if (fieldPath) {
                      const field = filterableFields[fieldPath]
                      const firstFilterType = Object.keys(field.controller.filter.types)[0]
                      setState({
                        kind: "filter-value",
                        fieldPath,
                        filterType: firstFilterType,
                        filterValue: field.controller.filter.types[firstFilterType].initialValue
                      })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(filterableFields).map(([fieldPath, field]) => (
                      <SelectItem key={fieldPath} value={fieldPath}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {state.kind === "filter-value" && state.fieldPath && (
                <>
                  <Select
                    value={state.filterType || ''}
                    onValueChange={(filterType) => {
                      const field = filterableFields[state.fieldPath!]
                      setState({
                        ...state,
                        filterType,
                        filterValue: field.controller.filter.types[filterType].initialValue
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {state.filterType ? filterableFields[state.fieldPath].controller.filter.types[state.filterType].label : 'Select filter type'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(filterableFields[state.fieldPath].controller.filter.types).map(([filterType, filterConfig]) => (
                        <SelectItem key={filterType} value={filterType}>
                          {(filterConfig as any).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {state.filterType && (
                    <div>
                      {(() => {
                        const field = filterableFields[state.fieldPath!]
                        const Filter = field.controller.filter.Filter
                        
                        return (
                          <Filter
                            value={state.filterValue}
                            onChange={(value: string | number | boolean | null) => {
                              setState({
                                ...state,
                                filterValue: value
                              })
                            }}
                            type={state.filterType}
                          />
                        )
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>

            {state.kind === "filter-value" && (
              <div className="flex justify-end border-t border-[var(--ks-line)] p-2">
                <div className="ks-track">
                  <Button type="button" onClick={() => setIsOpen(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </form>
        </PopoverContent>
      )}
    </Popover>
  )
}