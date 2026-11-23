/**
 * Timestamp field view - Keystone implementation with ShadCN UI
 */

'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FieldContainer } from '@/components/ui/field-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FieldDescription } from '@/components/ui/field-description'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { entriesTyped } from '../../lib/entriesTyped'
import {
  calendarDayForZone,
  formatInZone,
  formatTimeInputInZone,
  withCalendarDayInZone,
  withTimeInZone,
} from '../../lib/storeTime'
import { useIsMounted } from '../../lib/useViewerTime'
import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

export type Value =
  | {
      kind: 'create'
      value: string | null
    }
  | {
      kind: 'update'
      value: string | null
      initial: string | null
    }

export type TimestampFieldMeta = {
  defaultValue: string | { kind: 'now' } | null
  updatedAt: boolean
}

interface TimestampFieldProps {
  field: {
    path: string
    label: string
    description?: string
    fieldMeta: TimestampFieldMeta
  }
  value: Value
  onChange?: (value: Value) => void
  autoFocus?: boolean
  forceValidation?: boolean
  isRequired?: boolean
}

interface CellProps {
  item: Record<string, any>
  field: any
}

// Viewer's browser zone with a short label. Empty until mounted so SSR/hydration match.
export function formatTimestamp(date: Date, timeZone?: string | null, mounted = true) {
  return mounted ? formatInZone(date, timeZone, 'datetime') : ''
}

function validate(
  value: Value,
  fieldMeta: TimestampFieldMeta,
  isRequired: boolean,
  label: string
): string | undefined {
  const isEmpty = !value.value

  // if we receive null initially on the item view and the current value is null,
  // we should always allow saving it because:
  // - the value might be null in the database and we don't want to prevent saving the whole item because of that
  // - we might have null because of an access control error
  if (value.kind === 'update' && value.initial === null && isEmpty) return

  if (
    value.kind === 'create' &&
    isEmpty &&
    ((typeof fieldMeta.defaultValue === 'object' && fieldMeta.defaultValue?.kind === 'now') ||
      fieldMeta.updatedAt)
  )
    return

  if (isRequired && isEmpty) return `${label} is required`

  return
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
  isRequired = false,
}: TimestampFieldProps) {
  const [isDirty, setDirty] = useState(false)
  const isReadOnly = !onChange

  const showValidation = isDirty || forceValidation
  const validationMessage = showValidation
    ? validate(value, field.fieldMeta, isRequired, field.label)
    : undefined

  const timeZone = undefined
  const mounted = useIsMounted()
  const dateValue = value.value ? new Date(value.value) : undefined
  const inputId = `field-${field.path}`

  if (isReadOnly) {
    return (
      <FieldContainer>
        <FieldLabel htmlFor={inputId}>{field.label}</FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <Input
          id={inputId}
          readOnly
          tabIndex={-1}
          value={
            dateValue
              ? formatTimestamp(dateValue, timeZone, mounted)
              : 'yyyy-mm-dd --:--:--'
          }
          className="cursor-default"
          onFocus={(e) => e.target.blur()}
        />
      </FieldContainer>
    )
  }

  return (
    <FieldContainer>
      <FieldLabel htmlFor={inputId} className={validationMessage ? "text-[var(--ks-danger)]" : ""}>
        {field.label}
      </FieldLabel>
      {field.description && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={inputId}
            aria-invalid={validationMessage ? true : undefined}
            className={cn(
              "ks-field flex h-8 w-full items-center gap-2 px-2.5 text-left text-[13px] tabular-nums focus-visible:outline-none disabled:opacity-60",
              !dateValue && "text-[var(--ks-label)]"
            )}
            autoFocus={autoFocus}
            onBlur={() => setDirty(true)}
          >
            <CalendarIcon className="size-3.5 shrink-0 text-[var(--ks-label)]" />
            {dateValue ? formatTimestamp(dateValue, timeZone, mounted) : <span>Date and time</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue ? calendarDayForZone(dateValue, timeZone) : undefined}
            onSelect={(date) => {
              if (date && onChange) {
                // Keep the existing store-zone time of day, otherwise use the current one
                const picked = withCalendarDayInZone(date, dateValue, timeZone)
                onChange({ ...value, value: picked.toISOString() })
              } else if (!date && onChange) {
                onChange({ ...value, value: null })
              }
              setDirty(true)
            }}
            initialFocus
          />
          {dateValue && (
            <div className="flex items-center gap-2 border-t border-[var(--ks-line)] p-3">
              <Label className="ks-label">Time</Label>
              <Input
                type="time"
                step="1"
                value={dateValue ? formatTimeInputInZone(dateValue, timeZone) : ""}
                onChange={(e) => {
                  if (onChange && dateValue) {
                    const timeValue = e.target.value
                    if (timeValue) {
                      const [hours, minutes, seconds] = timeValue.split(':').map(Number)
                      const newDate = withTimeInZone(dateValue, hours, minutes || 0, seconds || 0, timeZone)
                      onChange({ ...value, value: newDate.toISOString() })
                      setDirty(true)
                    }
                  }
                }}
                className="flex-1"
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
      {validationMessage && (
        <div className="text-[12px] text-[var(--ks-danger)]" role="alert">{validationMessage}</div>
      )}
    </FieldContainer>
  )
}

export function Cell({ item, field }: CellProps) {
  const timeZone = undefined
  const mounted = useIsMounted()
  const value = item[field.path]
  return (
    <span className="tabular-nums">
      {value ? formatTimestamp(new Date(value), timeZone, mounted) : <span className="text-[var(--ks-label)]">—</span>}
    </span>
  )
}

export function CardValue({ item, field }: CellProps) {
  const timeZone = undefined
  const mounted = useIsMounted()
  const value = item[field.path]
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-muted-foreground">
        {value ? formatTimestamp(new Date(value), timeZone, mounted) : '—'}
      </div>
    </div>
  )
}

export function controller(config: FieldControllerConfig<TimestampFieldMeta>): FieldController<
  Value,
  string | null
> & {
  fieldMeta: TimestampFieldMeta
} {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    fieldMeta: config.fieldMeta,
    defaultValue: {
      kind: 'create',
      value:
        typeof config.fieldMeta.defaultValue === 'string' ? config.fieldMeta.defaultValue : null,
    },
    deserialize: (data: any) => {
      const value = data[config.path]
      return {
        kind: 'update',
        initial: data[config.path],
        value: value ?? null,
      }
    },
    serialize: ({ value }) => {
      if (value) return { [config.path]: value }
      return { [config.path]: null }
    },
    validate: (value, opts) =>
      validate(value, config.fieldMeta, opts.isRequired, config.label) === undefined,
    filter: {
      Filter: ({ value, onChange, type, autoFocus }: any) => {
        const [isDirty, setDirty] = useState(false)
        const timeZone = undefined
  const mounted = useIsMounted()

        if (type === 'empty' || type === 'not_empty') return null
        const dateValue = value ? new Date(value) : undefined

        return (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "ks-field flex h-8 w-full items-center gap-2 px-2.5 text-left text-[13px] tabular-nums focus-visible:outline-none",
                  !dateValue && "text-[var(--ks-label)]"
                )}
                autoFocus={autoFocus}
                onBlur={() => setDirty(true)}
              >
                <CalendarIcon className="size-3.5 shrink-0 text-[var(--ks-label)]" />
                {dateValue ? formatTimestamp(dateValue, timeZone, mounted) : <span>Date and time</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue ? calendarDayForZone(dateValue, timeZone) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const picked = withCalendarDayInZone(date, dateValue, timeZone)
                    onChange(picked.toISOString())
                  } else {
                    onChange(null)
                  }
                  setDirty(true)
                }}
                initialFocus
              />
              {dateValue && (
                <div className="flex items-center gap-2 border-t border-[var(--ks-line)] p-3">
                  <Label className="ks-label">Time</Label>
                  <Input
                    type="time"
                    step="1"
                    value={dateValue ? formatTimeInputInZone(dateValue, timeZone) : ""}
                    onChange={(e) => {
                      if (dateValue) {
                        const timeValue = e.target.value
                        if (timeValue) {
                          const [hours, minutes, seconds] = timeValue.split(':').map(Number)
                          const newDate = withTimeInZone(dateValue, hours, minutes || 0, seconds || 0, timeZone)
                          onChange(newDate.toISOString())
                          setDirty(true)
                        }
                      }
                    }}
                    className="flex-1"
                  />
                </div>
              )}
            </PopoverContent>
          </Popover>
        )
      },
      graphql: ({ type, value }: { type: string; value: string }) => {
        if (type === 'empty') return { [config.path]: { equals: null } }
        if (type === 'not_empty') return { [config.path]: { not: { equals: null } } }
        if (type === 'not') return { [config.path]: { not: { equals: value } } }
        return { [config.path]: { [type]: value } }
      },
      parseGraphQL: (value: any) => {
        return entriesTyped(value).flatMap(([type, value]) => {
          if (type === 'equals' && value === null) {
            return { type: 'empty', value: null }
          }
          if (!value) return []
          if (type === 'equals') return { type: 'equals', value: value as unknown as string }
          if (type === 'not') {
            if (value?.equals === null) return { type: 'not_empty', value: null }
            return { type: 'not', value: value.equals as unknown as string }
          }
          if (type === 'gt' || type === 'lt') {
            return { type, value: value as unknown as string }
          }
          return []
        })
      },
      Label: ({ label, type, value }: { label: string; type: string; value: string }) => {
        if (type === 'empty' || type === 'not_empty' || value == null) {
          return label.toLowerCase()
        }

        return `${label.toLowerCase()} ${formatInZone(new Date(value), undefined, "datetime")}`
      },
      types: {
        equals: {
          label: 'Is exactly',
          initialValue: null,
        },
        not: {
          label: 'Is not exactly',
          initialValue: null,
        },
        lt: {
          label: 'Is before',
          initialValue: null,
        },
        gt: {
          label: 'Is after',
          initialValue: null,
        },
        empty: {
          label: 'Is empty',
          initialValue: null,
        },
        not_empty: {
          label: 'Is not empty',
          initialValue: null,
        },
      },
    },
  }
}

Cell.supportsLinkTo = false