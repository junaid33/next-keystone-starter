/**
 * Fields component - Following Keystone's exact pattern with field grouping support
 * Creates controllers and renders fields dynamically using viewsIndex
 */

'use client'

import React, { useMemo, useId, ReactNode } from 'react'
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Exact copy from Keystone - testFilter function
function applyFilter<T>(
  filter: {
    equals?: T
    in?: T[]
  },
  val: T
): boolean {
  if (filter.equals !== undefined && val !== filter.equals) return false
  if (filter.in !== undefined && !filter.in.includes(val)) return false
  return true
}

export function testFilter(
  filter: any | undefined,
  serialized: Record<string, unknown>
): boolean {
  if (filter === undefined) return false
  if (typeof filter === 'boolean') return filter
  for (const [key, filterOnField] of Object.entries(filter)) {
    const serializedValue = serialized[key]
    if (!applyFilter(filterOnField as any, serializedValue)) return false
    if ((filterOnField as any).not !== undefined && applyFilter((filterOnField as any).not, serializedValue)) {
      return false
    }
  }
  return true
}

interface FieldGroupMeta {
  label: string
  description?: string | null
  fields: { path: string }[]
}

interface FieldsProps {
  list: any
  fields: Record<string, any>
  value: Record<string, unknown>
  onChange?: (values: Record<string, unknown>) => void
  forceValidation?: boolean
  invalidFields?: ReadonlySet<string>
  isRequireds?: Record<string, any>
  view?: 'createView' | 'itemView'
  groups?: FieldGroupMeta[]
  /** 'cards': loose fields share one section card, each group gets its own (item and create pages). */
  layout?: 'plain' | 'cards'
}

export function Fields({ fields, value, onChange, forceValidation, invalidFields, isRequireds, view = 'itemView', groups = [], layout = 'plain' }: FieldsProps) {
  // Create serialized data exactly like Keystone for testFilter
  const serialized = useMemo(() => {
    const result: Record<string, unknown> = {}
    for (const [fieldKey, field] of Object.entries(fields)) {
      Object.assign(result, field.controller.serialize(value[fieldKey]))
    }
    return result
  }, [fields, value])

  // Render a single field
  const renderField = (fieldPath: string, field: any) => {
    const fieldValue = value[fieldPath]
    
    // Get field mode from the appropriate view - following Keystone pattern
    const fieldModeFilter = field[view]?.fieldMode || 'edit'
    let fieldMode: 'read' | 'edit' | 'hidden'
    
    if (typeof fieldModeFilter === 'string') {
      fieldMode = fieldModeFilter as 'read' | 'edit' | 'hidden'
    } else {
      // Handle conditional field modes
      if (testFilter(fieldModeFilter?.edit, serialized)) fieldMode = 'edit'
      else if (view === 'itemView' && testFilter(fieldModeFilter?.read, serialized)) fieldMode = 'read'
      else fieldMode = 'hidden'
    }
    
    const isReadOnly = fieldMode === 'read' || fieldMode === 'hidden'
    
    if (fieldMode === 'hidden') {
      return null
    }

    return (
      <field.views.Field
        key={fieldPath}
        field={field.controller}
        value={fieldValue}
        forceValidation={forceValidation && invalidFields?.has(fieldPath)}
        isRequired={testFilter(isRequireds?.[fieldPath] ?? false, serialized)}
        onChange={
          isReadOnly || !onChange
            ? undefined
            : (newFieldValue: unknown) => {
                onChange({
                  ...value,
                  [fieldPath]: newFieldValue,
                })
              }
        }
      />
    )
  }

  // Group fields logic
  const renderedFields = Object.fromEntries(
    Object.keys(fields).map((fieldKey) => [fieldKey, renderField(fieldKey, fields[fieldKey])])
  )

  const rendered: ReactNode[] = []
  const fieldGroups = new Map()

  // Create group mapping
  for (const group of groups) {
    const state = { group, rendered: false }
    for (const field of group.fields) {
      fieldGroups.set(field.path, state)
    }
  }

  // In card layout, consecutive ungrouped fields are collected into one section
  let loose: ReactNode[] = []
  const flushLoose = () => {
    if (!loose.length) return
    rendered.push(
      <section key={`loose-${rendered.length}`} className="ks-card flex flex-col gap-5 p-4 md:p-5">
        {loose}
      </section>
    )
    loose = []
  }

  // Render grouped and ungrouped fields
  for (const field of Object.values(fields)) {
    const fieldKey = field.path
    if (fieldGroups.has(fieldKey)) {
      const groupState = fieldGroups.get(field.path)
      if (groupState.rendered) {
        continue
      }
      groupState.rendered = true
      const { group } = groupState
      const renderedFieldsInGroup = group.fields.map(
        (field: { path: string }) => renderedFields[field.path]
      )
      if (renderedFieldsInGroup.every((field: ReactNode | null) => field === null)) {
        continue
      }

      if (layout === 'cards') flushLoose()
      rendered.push(
        <FieldGroup
          key={group.label}
          count={group.fields.length}
          label={group.label}
          description={group.description}
          layout={layout}
        >
          {renderedFieldsInGroup}
        </FieldGroup>
      )
      continue
    }
    if (renderedFields[fieldKey] === null || renderedFields[fieldKey] === undefined) {
      continue
    }
    if (layout === 'cards') loose.push(renderedFields[fieldKey])
    else rendered.push(renderedFields[fieldKey])
  }
  if (layout === 'cards') flushLoose()

  return (
    <div className={cn("grid w-full grid-cols-1", layout === 'cards' ? "gap-4" : "items-center gap-5")}>
      {rendered.length === 0 && value && Object.keys(value).length === 0
        ? <p className="text-[13px] text-[var(--ks-dim)]">No fields</p>
        : rendered}
    </div>
  )
}

function FieldGroup(props: {
  label: string
  description?: string | null
  count: number
  children: ReactNode
  layout?: 'plain' | 'cards'
}) {
  const descriptionId = useId()
  const labelId = useId()

  // Count actual fields (excluding virtual fields in create view)
  const actualFieldCount = props.children ? Array.isArray(props.children) ? props.children.filter(
    (item) =>
      item !== undefined &&
      item !== null &&
      !(
        item?.props?.value &&
        typeof item?.props?.value === "symbol" &&
        item?.props?.value.toString() ===
          "Symbol(create view virtual field value)"
      )
  ).length : 1 : 0

  // Don't render the group if there are no actual fields
  if (actualFieldCount === 0) {
    return null
  }

  const cards = props.layout === 'cards'

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={props.description === null || props.description === undefined ? undefined : descriptionId}
      className={cn(cards && "ks-card overflow-hidden")}
    >
      <details open className="group/fg">
        <summary
          className={cn(
            "flex cursor-pointer list-none items-start gap-2 outline-none [&::-webkit-details-marker]:hidden focus-visible:[&>span]:ring-2 focus-visible:[&>span]:ring-[var(--ks-focus)]",
            cards ? "px-4 py-3 md:px-5 group-open/fg:border-b group-open/fg:border-[var(--ks-line)]" : "py-1"
          )}
        >
          <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] text-[var(--ks-label)] transition-transform group-open/fg:rotate-90">
            <ChevronRight className="size-3.5" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span id={labelId} className="text-[13px] font-semibold leading-5 text-[var(--ks-ink)]">
              {props.label}
            </span>
            {props.description !== null && props.description !== undefined && (
              <span className="text-[12px] leading-4 text-[var(--ks-dim)]" id={descriptionId}>
                {props.description}
              </span>
            )}
          </span>
          <span className="ml-auto mt-0.5 font-mono text-[12px] text-[var(--ks-label)]">{actualFieldCount}</span>
        </summary>
        <div className={cn("flex flex-col gap-5", cards ? "p-4 md:p-5" : "ml-2 mt-3 border-l border-[var(--ks-line)] pl-4")}>
          {props.children}
        </div>
      </details>
    </div>
  )
}
