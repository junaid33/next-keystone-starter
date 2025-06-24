/**
 * Relationship field view - Simplified implementation based on Keystone structure
 * Note: This is a simplified version. Full implementation would include search, create dialogs, etc.
 */

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link, ExternalLink, X } from 'lucide-react'
import type {
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

// Simplified relationship value types
type RelationshipValue = {
  id: string
  label: string
} | null

type RelationshipManyValue = Array<{
  id: string
  label: string
}>

type Value = 
  | { kind: 'one'; value: RelationshipValue; initialValue: RelationshipValue }
  | { kind: 'many'; value: RelationshipManyValue; initialValue: RelationshipManyValue }
  | { kind: 'count'; count: number; id: string }

interface RelationshipFieldProps {
  field: {
    path: string
    label: string
    description?: string
    refListKey: string
    refLabelField: string
    many: boolean
    display: 'select' | 'count' | 'table'
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
  value?: any
}

export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
  isRequired = false,
}: RelationshipFieldProps) {
  const [searchValue, setSearchValue] = useState('')
  const isReadOnly = onChange === undefined

  // Count display mode - just show the count
  if (value.kind === 'count') {
    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={value.count.toString()}
            className="w-20"
          />
          <Badge variant="secondary">
            <Link className="w-3 h-3 mr-1" />
            {field.refListKey}
          </Badge>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}
      </div>
    )
  }

  // Single relationship
  if (value.kind === 'one') {
    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        <div className="flex items-center gap-2">
          <Input
            autoFocus={autoFocus}
            placeholder={`Search ${field.refListKey.toLowerCase()}...`}
            value={value.value?.label || searchValue}
            readOnly={isReadOnly}
            required={isRequired}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex-1"
          />
          {value.value && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Link className="w-3 h-3" />
              {value.value.label}
              {!isReadOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange?.({ ...value, value: null })}
                  className="h-auto p-0 ml-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </Badge>
          )}
        </div>
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Note: This is a simplified relationship field. Full implementation would include search and selection.
        </p>
      </div>
    )
  }

  // Many relationships
  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
      <div className="space-y-2">
        <Input
          autoFocus={autoFocus}
          placeholder={`Search ${field.refListKey.toLowerCase()}...`}
          value={searchValue}
          readOnly={isReadOnly}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        
        {value.value.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {value.value.map((item) => (
              <Badge key={item.id} variant="secondary" className="flex items-center gap-1">
                <Link className="w-3 h-3" />
                {item.label}
                {!isReadOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newValue = value.value.filter(v => v.id !== item.id)
                      onChange?.({ ...value, value: newValue })
                    }}
                    className="h-auto p-0 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </Badge>
            ))}
          </div>
        )}
        
        {value.value.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No related {field.refListKey.toLowerCase()} selected
          </p>
        )}
      </div>
      
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Note: This is a simplified relationship field. Full implementation would include search and selection.
      </p>
    </div>
  )
}

export function Cell({ item, field, value }: CellProps) {
  if (field.display === 'count') {
    const count = item[`${field.path}Count`] as number
    return count != null ? (
      <Badge variant="outline">{count}</Badge>
    ) : null
  }

  const data = item[field.path]
  const items = (Array.isArray(data) ? data : [data]).filter(Boolean)
  const displayItems = items.length < 3 ? items : items.slice(0, 2)
  const overflow = items.length < 3 ? 0 : items.length - 2

  return (
    <div className="flex items-center gap-1">
      {displayItems.length > 0 ? (
        <>
          <Link className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            {displayItems.map((item, index) => (
              <span key={item.id}>
                {index > 0 && ', '}
                <span className="text-blue-600 hover:underline cursor-pointer">
                  {item.label || item.id}
                </span>
              </span>
            ))}
            {overflow > 0 && `, +${overflow} more`}
          </span>
        </>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      )}
    </div>
  )
}

export function CardValue({ item, field }: CellProps) {
  const value = field.display === 'count' 
    ? item[`${field.path}Count`]
    : item[field.path]
  
  return (
    <div>
      <div className="text-sm font-medium">{field.label}</div>
      <div className="text-sm text-muted-foreground">
        {field.display === 'count' ? (
          <div className="flex items-center gap-1">
            <Link className="w-3 h-3" />
            <span>{value || 0} related</span>
          </div>
        ) : value ? (
          <div className="flex items-center gap-1">
            <Link className="w-3 h-3" />
            {Array.isArray(value) ? (
              <span>{value.length} related</span>
            ) : (
              <span>{value.label || value.id}</span>
            )}
          </div>
        ) : (
          '—'
        )}
      </div>
    </div>
  )
}

type RelationshipFieldMeta = {
  refFieldKey?: string
  refListKey: string
  many: boolean
  hideCreate: boolean
  refLabelField: string
  refSearchFields: string[]
} & (
  | { displayMode: 'select' }
  | { displayMode: 'count' }
  | {
      displayMode: 'table'
      refFieldKey: string
      initialSort: { field: string; direction: 'ASC' | 'DESC' } | null
      columns: string[] | null
    }
)

export function controller(
  config: FieldControllerConfig<RelationshipFieldMeta>
): FieldController<Value> & {
  refListKey: string
  refLabelField: string
  many: boolean
  display: 'select' | 'count' | 'table'
} {
  const { displayMode, many, refLabelField, refListKey } = config.fieldMeta

  return {
    path: config.path,
    label: config.label,
    description: config.description,
    refListKey,
    refLabelField,
    many,
    display: displayMode,
    graphqlSelection:
      displayMode === 'count'
        ? `${config.path}Count`
        : `${config.path} {
            id
            label: ${refLabelField}
          }`,
    defaultValue: many
      ? {
          kind: 'many',
          value: [],
          initialValue: [],
        }
      : {
          kind: 'one',
          value: null,
          initialValue: null,
        },
    validate: (value, opts) => {
      if ('count' in value) return true
      return opts.isRequired
        ? value.kind === 'one'
          ? value.value !== null
          : value.value.length > 0
        : true
    },
    deserialize: data => {
      if (displayMode === 'count') {
        return {
          id: data.id,
          kind: 'count',
          count: data[`${config.path}Count`] ?? 0,
        }
      }
      
      if (many) {
        const value = (data[config.path] || []).map((x: any) => ({
          id: x.id,
          label: x.label || x.id,
        }))
        return {
          kind: 'many',
          value,
          initialValue: value,
        }
      }
      
      let value = data[config.path]
      if (value) {
        value = {
          id: value.id,
          label: value.label || value.id,
        }
      }
      return {
        kind: 'one',
        value,
        initialValue: value,
      }
    },
    serialize: state => {
      if (state.kind === 'many') {
        // Simplified - just return the current value
        return {
          [config.path]: state.value.map(item => ({ id: item.id })),
        }
      } else if (state.kind === 'one') {
        if (!state.value) return { [config.path]: null }
        return {
          [config.path]: { id: state.value.id },
        }
      }
      return {}
    },
  }
}

Cell.supportsLinkTo = true