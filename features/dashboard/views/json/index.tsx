/**
 * JSON field view - Keystone implementation with Shadcn UI
 */

import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FieldContainer } from '@/components/ui/field-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FieldDescription } from '@/components/ui/field-description'
import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

interface JSONFieldProps {
  field: {
    path: string
    label: string
    description?: string
  }
  value: string
  onChange?: (value: string) => void
  autoFocus?: boolean
  forceValidation?: boolean
}

interface CellProps {
  item: Record<string, any>
  field: any
  value?: any
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
}: JSONFieldProps) {
  const isReadOnly = onChange === undefined
  const errorMessage = forceValidation ? 'Invalid JSON' : undefined

  return (
    <FieldContainer>
      <FieldLabel htmlFor={`field-${field.path}`} className={errorMessage ? "text-[var(--ks-danger)]" : ""}>
        {field.label}
      </FieldLabel>
      {field.description && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      <Textarea
        id={`field-${field.path}`}
        autoFocus={autoFocus}
        readOnly={isReadOnly}
        onChange={(e) => onChange?.(e.target.value)}
        value={value}
        aria-invalid={!!errorMessage || undefined}
        className="font-mono text-[12px] leading-5"
        rows={8}
        placeholder={`{\n  "key": "value"\n}`}
      />
      {errorMessage && (
        <div className="text-[12px] text-[var(--ks-danger)]" role="alert">{errorMessage}</div>
      )}
    </FieldContainer>
  )
}

export function Cell({ item, field, value }: CellProps) {
  const fieldValue = value ?? item[field.path]
  return (
    <div className="flex items-center gap-2">
      {fieldValue ? (
        <>
          <span className="text-sm font-mono text-muted-foreground truncate max-w-32">
            {JSON.stringify(fieldValue)}
          </span>
        </>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </div>
  )
}

export function CardValue({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-muted-foreground">
        {value ? (
          <div className="space-y-1">
            <span className="ks-label">JSON</span>
            <pre className="max-h-32 overflow-auto rounded-[8px] bg-[var(--ks-surface-2)] p-2 font-mono text-[12px]">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ) : (
          '—'
        )}
      </div>
    </div>
  )
}

type Config = FieldControllerConfig<{ defaultValue: any }>

export function controller(config: Config): FieldController<string> {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue:
      config.fieldMeta?.defaultValue === null
        ? ''
        : JSON.stringify(config.fieldMeta?.defaultValue, null, 2),
    validate: value => {
      if (!value) return true
      try {
        JSON.parse(value)
        return true
      } catch (e) {
        return false
      }
    },
    deserialize: data => {
      const value = data[config.path]
      // null is equivalent to Prisma.DbNull, and we show that as an empty input
      if (value === null) return ''
      return JSON.stringify(value, null, 2)
    },
    serialize: value => {
      if (!value) return { [config.path]: null }
      try {
        return { [config.path]: JSON.parse(value) }
      } catch (e) {
        return { [config.path]: undefined }
      }
    },
  }
}

Cell.supportsLinkTo = false