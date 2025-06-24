/**
 * BigInt field view - Keystone implementation with Shadcn UI
 */

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

// Types matching Keystone exactly
type Value =
  | { kind: 'create'; value: string | null }
  | { kind: 'update'; initial: string | null; value: string | null }

type Validation = {
  min: string
  max: string
}

interface BigIntFieldProps {
  field: {
    path: string
    label: string
    description?: string
    validation: Validation
    hasAutoIncrementDefault: boolean
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

// Validation function - exact copy from Keystone
function validate_(
  value: Value,
  validation: Validation,
  isRequired: boolean,
  label: string,
  hasAutoIncrementDefault: boolean
): string | undefined {
  const { value: input, kind } = value
  if (kind === 'create' && hasAutoIncrementDefault && input === null) return
  if (kind === 'update' && (value as any).initial === null && input === null) return
  if (isRequired && input === null) return `${label} is required`
  if (typeof input !== 'string') return
  try {
    const v = BigInt(input)
    if (validation.min !== undefined && v < BigInt(validation.min))
      return `${label} must be greater than or equal to ${validation.min}`
    if (validation.max !== undefined && v > BigInt(validation.max))
      return `${label} must be less than or equal to ${validation.max}`
  } catch (e: any) {
    return `${label} is not a valid BigInt`
  }
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
  isRequired = false,
}: BigIntFieldProps) {
  const [isDirty, setDirty] = useState(false)
  const isReadOnly = !onChange || field.hasAutoIncrementDefault

  if (field.hasAutoIncrementDefault && value.kind === 'create') {
    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        <Input
          readOnly
          value="Auto increment"
          className="bg-muted"
        />
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This field is set to auto increment. It will default to the next available number.
          </AlertDescription>
        </Alert>
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}
      </div>
    )
  }

  const validate = (value: Value) => {
    return validate_(
      value,
      field.validation,
      isRequired,
      field.label,
      field.hasAutoIncrementDefault
    )
  }

  const errorMessage = (forceValidation || isDirty) && validate(value)

  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
      <Input
        inputMode="numeric"
        autoFocus={autoFocus}
        readOnly={isReadOnly}
        required={isRequired}
        onBlur={() => setDirty(true)}
        onChange={(e) => {
          if (!onChange) return
          const inputValue = e.target.value === '' ? null : e.target.value
          onChange({ ...value, value: inputValue })
        }}
        value={value.value ?? ''}
        className={errorMessage ? 'border-red-500' : ''}
        placeholder="Enter a large integer"
      />
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">{errorMessage}</p>
      )}
    </div>
  )
}

export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <span className="text-sm font-mono">
      {value !== null && value !== undefined ? 
        value.toString() : 
        <span className="text-muted-foreground">—</span>
      }
    </span>
  )
}

export function CardValue({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-muted-foreground font-mono">
        {value !== null && value !== undefined ? value.toString() : '—'}
      </div>
    </div>
  )
}

export function controller(
  config: FieldControllerConfig<{
    validation: Validation
    defaultValue: string | null | 'autoincrement'
  }>
): FieldController<Value> & {
  validation: Validation
  hasAutoIncrementDefault: boolean
} {
  const validate = (value: Value, opts: { isRequired: boolean }) => {
    return validate_(
      value,
      config.fieldMeta?.validation || { min: '', max: '' },
      opts.isRequired,
      config.label,
      config.fieldMeta?.defaultValue === 'autoincrement'
    )
  }

  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    validation: config.fieldMeta?.validation || { min: '', max: '' },
    defaultValue: {
      kind: 'create',
      value:
        config.fieldMeta?.defaultValue === 'autoincrement' ? null : config.fieldMeta?.defaultValue || null,
    },
    deserialize: data => ({ kind: 'update', value: data[config.path], initial: data[config.path] }),
    serialize: value => ({ [config.path]: value.value }),
    hasAutoIncrementDefault: config.fieldMeta?.defaultValue === 'autoincrement',
    validate: (value, opts) => validate(value, opts) === undefined,
  }
}

Cell.supportsLinkTo = false