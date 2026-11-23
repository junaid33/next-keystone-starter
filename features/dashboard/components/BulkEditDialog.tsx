'use client'

/**
 * Set one field to the same value on every selected item. The value comes from the field's own
 * view and controller (same Field component and serialize() as the item page), and is written with
 * Keystone's generated updateMany mutation, so access control and hooks run per item.
 */

import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldLabel } from '@/components/ui/field-label'
import { enhanceFields } from '../utils/enhanceFields'
import { getFieldTypeFromViewsIndex } from '../views/getFieldTypeFromViewsIndex'
import { updateManyItemsAction } from '../actions/item-actions'

const BULK_TYPES = new Set(['text', 'select', 'integer', 'float', 'decimal', 'bigInt', 'checkbox', 'timestamp', 'multiselect', 'relationship'])

export function bulkEditableFields(list: any): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [path, field] of Object.entries(list?.fields || {}) as [string, any][]) {
    if (path === 'id') continue
    let type: string
    try {
      type = getFieldTypeFromViewsIndex(field.viewsIndex)
    } catch {
      continue
    }
    if (!BULK_TYPES.has(type)) continue
    const mode = field.itemView?.fieldMode
    if (mode === 'hidden' || mode === 'read') continue
    if (type === 'relationship' && (field.fieldMeta?.displayMode === 'count' || field.fieldMeta?.displayMode === 'cards')) continue
    out[path] = field
  }
  return out
}

interface BulkEditDialogProps {
  list: any
  ids: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}

export function BulkEditDialog({ list, ids, open, onOpenChange, onDone }: BulkEditDialogProps) {
  const queryClient = useQueryClient()
  const editable = useMemo(() => enhanceFields(bulkEditableFields(list), list.key), [list])
  const [fieldPath, setFieldPath] = useState<string | null>(null)
  const [value, setValue] = useState<unknown>(undefined)
  const [saving, setSaving] = useState(false)

  const field = fieldPath ? editable[fieldPath] : null
  const data = useMemo(() => {
    if (!field || value === undefined) return null
    try {
      const serialized = field.controller.serialize(value) || {}
      return Object.keys(serialized).length ? serialized : null
    } catch {
      return null
    }
  }, [field, value])

  const reset = () => {
    setFieldPath(null)
    setValue(undefined)
  }

  const pick = (path: string) => {
    setFieldPath(path)
    setValue(editable[path].controller.defaultValue)
  }

  const apply = async () => {
    if (!field || !data) return
    setSaving(true)
    const res = await updateManyItemsAction(list.key, ids, data, {
      updateManyMutationName: list.gqlNames?.updateManyMutationName ?? `update${list.plural.replace(/\s+/g, '')}`,
      updateManyInputName: list.gqlNames?.updateManyInputName ?? `${list.key}UpdateArgs`,
    })
    setSaving(false)
    if (res.errors.length > 0) {
      toast.error(res.errors[0].message)
      return
    }
    toast.success(`Updated ${ids.length} ${ids.length === 1 ? list.singular : list.plural}`)
    await queryClient.invalidateQueries({ queryKey: ['lists', list.key, 'items'] })
    reset()
    onOpenChange(false)
    onDone()
  }

  const FieldView = field?.views?.Field

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit {ids.length} {ids.length === 1 ? list.singular : list.plural}
          </DialogTitle>
          <DialogDescription className="sr-only">Set one field on every selected item</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel>Field</FieldLabel>
            <Select value={fieldPath ?? undefined} onValueChange={pick}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a field" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(editable).map(([path, f]: [string, any]) => (
                  <SelectItem key={path} value={path}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {field && FieldView && (
            <div key={fieldPath} className="max-h-[50vh] overflow-y-auto pb-1">
              <FieldView field={field.controller} value={value} onChange={setValue} forceValidation={false} isRequired={false} />
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="ks-track">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!data || saving} onClick={apply}>
              {saving ? 'Saving' : `Apply to ${ids.length}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
