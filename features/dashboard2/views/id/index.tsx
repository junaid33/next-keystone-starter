/**
 * ID field view - Read-only identifier field
 */

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Hash } from 'lucide-react'
import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

interface IdFieldProps {
  field: {
    path: string
    label: string
    description?: string
    kind: 'autoincrement' | 'uuid' | 'cuid'
  }
  value: string
  onChange?: never // ID fields are always read-only
  autoFocus?: boolean
  forceValidation?: boolean
}

interface CellProps {
  item: Record<string, any>
  field: any
}

export function Field({
  field,
  value,
  autoFocus,
}: IdFieldProps) {
  const displayValue = value || (field.kind === 'autoincrement' ? 'Auto-generated' : 'Generated on save')

  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={displayValue}
          className="bg-muted font-mono"
          autoFocus={autoFocus}
        />
        <Badge variant="secondary" className="flex items-center gap-1">
          <Hash className="w-3 h-3" />
          {field.kind}
        </Badge>
      </div>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      <p className="text-xs text-muted-foreground">
        This field is automatically managed and cannot be edited.
      </p>
    </div>
  )
}

export function Cell({ item, field }: CellProps) {
  const value = item[field.path]
  return (
    <div className="flex items-center gap-1">
      <Hash className="w-3 h-3 text-muted-foreground" />
      <span className="text-sm font-mono">
        {value || '—'}
      </span>
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
          <div className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            <span className="font-mono">{value}</span>
          </div>
        ) : (
          '—'
        )}
      </div>
    </div>
  )
}

type IdFieldMeta = {
  kind: 'autoincrement' | 'uuid' | 'cuid'
}

export function controller(
  config: FieldControllerConfig<IdFieldMeta>
): FieldController<string, string> & {
  kind: 'autoincrement' | 'uuid' | 'cuid'
} {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    kind: config.fieldMeta?.kind || 'autoincrement',
    defaultValue: '',
    deserialize: data => data[config.path] || '',
    serialize: () => ({}), // ID fields are never serialized for updates
    validate: () => true, // ID fields don't need validation
    filter: {
      Filter: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter ID..."
        />
      ),
      Label: ({ label, value }: { label: string; value: string }) => {
        const trimmedLabel = label.toLowerCase().replace(' exactly', '')
        return `${trimmedLabel} "${value}"`
      },
      graphql: ({ type, value }: { type: string; value: string }) => {
        if (type.startsWith('not_')) {
          const actualType = type.replace('not_', '')
          return { [config.path]: { not: { [actualType]: value } } }
        }
        return { [config.path]: { [type]: value } }
      },
      parseGraphQL: (value: any) => {
        return Object.entries(value).flatMap(([type, filterValue]) => {
          if (!filterValue) return []
          if (type === 'equals') return { type: 'equals', value: filterValue as string }
          if (type === 'contains') return { type: 'contains', value: filterValue as string }
          if (type === 'not') {
            const notValue = filterValue as any
            if (notValue?.equals) return { type: 'not_equals', value: notValue.equals as string }
            if (notValue?.contains) return { type: 'not_contains', value: notValue.contains as string }
          }
          return []
        })
      },
      types: {
        equals: {
          label: 'Equals',
          initialValue: '',
        },
        not_equals: {
          label: 'Does not equal',
          initialValue: '',
        },
        contains: {
          label: 'Contains',
          initialValue: '',
        },
        not_contains: {
          label: 'Does not contain',
          initialValue: '',
        },
      },
    },
  }
}

Cell.supportsLinkTo = true