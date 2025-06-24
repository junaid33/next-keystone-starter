/**
 * Decimal field view - Keystone implementation with Shadcn UI
 */

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  min: string | null
  max: string | null
}

interface DecimalFieldProps {
  field: {
    path: string
    label: string
    description?: string
    validation: Validation
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

// Validation function - exact copy from Keystone but without Decimal library
function validate_(
  value: Value,
  validation: Validation,
  isRequired: boolean,
  label: string
): string | undefined {
  const { value: input, kind } = value
  if (kind === 'update' && value.initial === null && input === null) return
  if (isRequired && input === null) return `${label} is required`
  if (typeof input !== 'string') return
  
  // Basic validation without Decimal library
  const numericInput = parseFloat(input)
  if (input !== '' && (isNaN(numericInput) || !isFinite(numericInput))) {
    return `${label} must be a valid decimal number`
  }
  
  if (validation.min !== null && numericInput < parseFloat(validation.min)) {
    return `${label} must be greater than or equal to ${validation.min}`
  }
  if (validation.max !== null && numericInput > parseFloat(validation.max)) {
    return `${label} must be less than or equal to ${validation.max}`
  }
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
  isRequired = false,
}: DecimalFieldProps) {
  const [isDirty, setDirty] = useState(false)
  const isReadOnly = !onChange

  const validate = (value: Value) => {
    return validate_(value, field.validation, isRequired, field.label)
  }

  const errorMessage = (forceValidation || isDirty) && validate(value)

  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
      <Input
        inputMode="decimal"
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
        placeholder="0.00"
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
    defaultValue: string | null
  }>
): FieldController<Value> & {
  validation: Validation
} {
  const validate = (value: Value, opts: { isRequired: boolean }) => {
    return validate_(value, config.fieldMeta?.validation || { min: null, max: null }, opts.isRequired, config.label)
  }

  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    validation: config.fieldMeta?.validation || { min: null, max: null },
    defaultValue: { 
      kind: 'create', 
      value: config.fieldMeta?.defaultValue || null 
    },
    deserialize: data => ({ 
      kind: 'update', 
      value: data[config.path], 
      initial: data[config.path] 
    }),
    serialize: value => ({ [config.path]: value.value }),
    validate: (value, opts) => validate(value, opts) === undefined,
  }
}

Cell.supportsLinkTo = false