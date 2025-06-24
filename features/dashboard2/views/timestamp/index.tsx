/**
 * Timestamp field view - Keystone implementation with Shadcn UI
 */

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

// Types matching Keystone exactly
type Value =
  | { kind: 'create'; value: string | null }
  | { kind: 'update'; initial: string | null; value: string | null }

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
  value?: string
}

type TimestampFieldMeta = {
  defaultValue: string | { kind: 'now' } | null
  updatedAt: boolean
}

// Validation function - similar to Keystone
function validate(
  value: Value,
  fieldMeta: TimestampFieldMeta,
  isRequired: boolean,
  label: string
): string | undefined {
  const isEmpty = !value.value

  // if we receive null initially on the item view and the current value is null,
  // we should always allow saving it
  if (value.kind === 'update' && (value as any).initial === null && isEmpty) return

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

  // Convert ISO string to datetime-local format
  const toDatetimeLocal = (isoString: string | null) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  }

  // Convert datetime-local format to ISO string
  const fromDatetimeLocal = (datetimeLocal: string) => {
    if (!datetimeLocal) return null
    return new Date(datetimeLocal).toISOString()
  }

  const setToNow = () => {
    if (!onChange) return
    const now = new Date().toISOString()
    onChange({ ...value, value: now })
    setDirty(true)
  }

  if (isReadOnly) {
    const displayValue = value.value
      ? new Intl.DateTimeFormat('en-US', {
          dateStyle: 'long',
          timeStyle: 'long',
        }).format(new Date(value.value))
      : 'yyyy-mm-dd --:--:--'

    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        <Input
          readOnly
          value={displayValue}
          className="bg-muted"
        />
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
      <div className="flex gap-2">
        <Input
          type="datetime-local"
          step="1"
          autoFocus={autoFocus}
          required={isRequired}
          onBlur={() => setDirty(true)}
          onChange={(e) => {
            if (!onChange) return
            const isoValue = fromDatetimeLocal(e.target.value)
            onChange({ ...value, value: isoValue })
          }}
          value={toDatetimeLocal(value.value)}
          className={validationMessage ? 'border-red-500' : ''}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={setToNow}
          title="Set to now"
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </div>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      {validationMessage && (
        <p className="text-sm text-red-600" role="alert">{validationMessage}</p>
      )}
    </div>
  )
}

export function Cell({ item, field, value }: CellProps) {
  const fieldValue = value ?? item[field.path]
  return (
    <span className="text-sm">
      {fieldValue ? (
        new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(fieldValue))
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </span>
  )
}

export function CardValue({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-muted-foreground">
        {value ? (
          new Intl.DateTimeFormat('en-US', {
            dateStyle: 'long',
            timeStyle: 'medium',
          }).format(new Date(value))
        ) : (
          '—'
        )}
      </div>
    </div>
  )
}

export function controller(config: FieldControllerConfig<TimestampFieldMeta>): FieldController<Value> & {
  fieldMeta: TimestampFieldMeta
} {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    fieldMeta: config.fieldMeta || { defaultValue: null, updatedAt: false },
    defaultValue: {
      kind: 'create',
      value:
        typeof config.fieldMeta?.defaultValue === 'string' ? config.fieldMeta.defaultValue : null,
    },
    deserialize: data => {
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
      validate(value, config.fieldMeta || { defaultValue: null, updatedAt: false }, opts.isRequired, config.label) === undefined,
  }
}

Cell.supportsLinkTo = false