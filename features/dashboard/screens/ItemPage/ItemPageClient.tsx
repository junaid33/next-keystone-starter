/**
 * ItemPageClient - Client Component
 * Based on Keystone's ItemPage implementation but using ShadCN components
 * Now using React Query mutations for update/delete operations
 */

'use client'

import { PUBLIC_REQUEST_ERROR, safeErrorSummary } from '@/features/dashboard/lib/security';
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Fields } from '../../components/Fields'
import { PageContainer } from '../../components/PageContainer'
import { useInvalidFields } from '../../utils/useInvalidFields'
import { useHasChanges, serializeValueToOperationItem } from '../../utils/useHasChanges'
import { enhanceFields } from '../../utils/enhanceFields'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import {
  AlertCircle,
  Check,
  Copy,
  FileQuestion,
  Trash2,
  Undo2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDashboard } from '../../context/DashboardProvider'
import { updateItemAction, deleteItemAction } from '../../actions/item-actions'
import { queryKeys } from '../../lib/queryKeys'
import { findStatusField } from '../../lib/listQueryFields'
import { statusTone } from '../../lib/statusTone'

interface ItemPageClientProps {
  list: any
  item: Record<string, unknown>
  itemId: string
}

// Hook for event callbacks (from Keystone)
function useEventCallback<Func extends (...args: any[]) => unknown>(callback: Func): Func {
  const callbackRef = useRef(callback)
  const cb = useCallback((...args: any[]) => {
    return callbackRef.current(...args)
  }, [])
  useEffect(() => {
    callbackRef.current = callback
  })
  return cb as any
}

// Delete Button Component (adapted from Keystone with responsive design)
function DeleteButton({
  list,
  value,
  onError,
  queryClient,
  isDesktop = true
}: {
  list: any;
  value: Record<string, unknown>;
  onError: (error: Error) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  isDesktop?: boolean;
}) {
  const itemId = ((value.id ?? '') as string | number).toString()
  const router = useRouter()
  const { basePath } = useDashboard()

  const handleDelete = useEventCallback(async () => {
    try {
      const { errors } = await deleteItemAction(list.key, itemId)

      // Handle errors exactly like Keystone does
      const error = errors?.find((x: any) => x.path === undefined || x.path?.length === 1)
      if (error) {
        toast.error('Unable to delete item.', {
          description: error.message,
          action: {
            label: 'Details',
            onClick: () => onError(new Error(error.message || PUBLIC_REQUEST_ERROR))
          }
        })
        return
      }

      toast.success(`${list.singular} deleted successfully.`)

      // Invalidate React Query cache - this will automatically refetch the data
      // Invalidate all items queries for this list (partial match on query key)
      await queryClient.invalidateQueries({
        queryKey: ['lists', list.key, 'items']
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.items.item(list.key, itemId)
      })

      // Navigate to list page after delete
      router.push(list.isSingleton ? `${basePath}/` : `${basePath}/${list.path}`)
    } catch (err: any) {
      toast.error("Unable to delete item.", {
        action: {
          label: "Details",
          onClick: () => onError(err)
        }
      })
    }
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" data-variant="danger" aria-label="Delete" className={isDesktop ? undefined : 'max-sm:w-7 max-sm:px-0'}>
          <Trash2 />
          <span className={isDesktop ? undefined : 'max-sm:hidden'}>Delete</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {list.singular.toLowerCase()}</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="ks-track">
            <AlertDialogCancel className="h-7 px-2.5 text-[12px]">Cancel</AlertDialogCancel>
            <AlertDialogAction data-variant="danger-fill" className="h-7 px-2.5 text-[12px]" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Reset Button Component (adapted from Keystone with responsive design)
function ResetButton(props: { onReset: () => void; hasChanges?: boolean; isDesktop?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Reset" disabled={!props.hasChanges} className={props.isDesktop ? undefined : 'max-sm:w-7 max-sm:px-0'}>
          <Undo2 />
          <span className={props.isDesktop ? undefined : 'max-sm:hidden'}>Reset</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard changes</AlertDialogTitle>
          <AlertDialogDescription>Unsaved edits will be lost.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="ks-track">
            <AlertDialogCancel className="h-7 px-2.5 text-[12px]">Keep editing</AlertDialogCancel>
            <AlertDialogAction data-variant="danger-fill" className="h-7 px-2.5 text-[12px]" onClick={props.onReset}>
              Discard
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Item Not Found Component (adapted from Keystone)
function ItemNotFound({ children }: { children: React.ReactNode }) {
  return (
    <div className="ks-card mx-4 mt-6 md:mx-6">
      <EmptyState title="Not found" icons={[FileQuestion]}>
        {children}
      </EmptyState>
    </div>
  )
}

// Error Dialog Component (adapted from Keystone)
function ErrorDialog({ error, onClose }: { error: Error; onClose: () => void }) {
  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Error</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line break-words">
            {error.message || PUBLIC_REQUEST_ERROR}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="ks-track">
            <AlertDialogAction className="h-7 px-2.5 text-[12px]" onClick={onClose}>
              Close
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Helper function to deserialize item data using enhanced fields
function deserializeItemToValue(
  enhancedFields: Record<string, any>,
  item: Record<string, unknown | null>
) {
  const result: Record<string, unknown | null> = {}
  
  Object.entries(enhancedFields).forEach(([fieldPath, field]) => {
    try {
      // Enhanced fields already have controllers
      const controller = field.controller
      
      // Create itemForField with only the GraphQL fields this controller needs
      const itemForField: Record<string, unknown> = {}
      // For now, just use the field path as the GraphQL field
      itemForField[field.path] = item?.[field.path] ?? null
      
      // Call deserialize with the properly structured data
      result[fieldPath] = controller.deserialize(itemForField)
    } catch (error) {
      console.error(`Error deserializing field ${fieldPath}:`, safeErrorSummary(error))
    }
  })
  
  return result
}

// Main ItemPageClient component
export function ItemPageClient({ list, item, itemId }: ItemPageClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Create enhanced fields like Keystone does
  const enhancedFields = useMemo(() => {
    return enhanceFields(list.fields || {}, list.key)
  }, [list.fields, list.key])

  // Deserialize the item data once - following Keystone pattern
  const initialValue = useMemo(() => {
    return deserializeItemToValue(enhancedFields, item)
  }, [enhancedFields, item])

  // State for form values - initialized with deserialized data
  const [value, setValue] = useState(() => initialValue)
  const [loading, setLoading] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [forceValidation, setForceValidation] = useState(false)
  const [errorDialogValue, setErrorDialogValue] = useState<Error | null>(null)
  
  // Reset value when initialValue changes
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  // Create isRequireds object from enhanced fields - exactly like Keystone
  const isRequireds = useMemo(() => {
    const result: Record<string, any> = {}
    
    Object.entries(enhancedFields).forEach(([fieldPath, field]) => {
      result[fieldPath] = field.itemView?.isRequired || false
    })
    
    // Override with dynamic adminMeta data if available
    if (list.adminMetaFields) {
      list.adminMetaFields.forEach((field: any) => {
        if (field.itemView && field.itemView.isRequired !== undefined) {
          result[field.path] = field.itemView.isRequired
        }
      })
    }
    
    return result
  }, [enhancedFields, list.adminMetaFields])

  // Use Keystone's useInvalidFields hook with enhanced fields
  const invalidFields = useInvalidFields(enhancedFields, value, isRequireds)
  
  // Check if we have changes using Keystone's exact pattern with enhanced fields
  const hasChanges = useHasChanges('update', enhancedFields, value, initialValue)

  // Save handler following Keystone's exact pattern with save state
  const handleSave = useEventCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    // Check for invalid fields - exact Keystone pattern
    const newForceValidation = invalidFields.size !== 0
    setForceValidation(newForceValidation)
    if (newForceValidation) {
      return
    }

    setSaveState('saving')
    setLoading(true)

    try {
      // Serialize only changed fields - exact Keystone pattern
      const changedData = serializeValueToOperationItem('update', enhancedFields, value, initialValue)

      const { errors } = await updateItemAction(list.key, initialValue.id as string, changedData)

      // Handle errors exactly like Keystone does
      const error = errors?.find((x: any) => x.path === undefined || x.path?.length === 1)
      if (error) {
        toast.error('Unable to save item', {
          description: error.message,
          action: {
            label: 'Details',
            onClick: () => setErrorDialogValue(new Error(error.message || PUBLIC_REQUEST_ERROR))
          }
        })
        setSaveState('idle')
        return
      }

      toast.success(`Saved changes to ${list.singular.toLowerCase()}`)
      setSaveState('saved')

      // Reset validation state after successful save
      setForceValidation(false)

      // Reset to idle after showing saved state
      setTimeout(() => setSaveState('idle'), 3000)

      // Avoid forcing a full route refresh immediately after save;
      // it can remount uncontrolled editors (Slate) and break editing.
      await queryClient.invalidateQueries({
        queryKey: queryKeys.items.item(list.key, itemId)
      })

    } catch (error: any) {
      console.error('Save error:', safeErrorSummary(error))
      toast.error("Unable to save item", {
        action: {
          label: "Details",
          onClick: () => setErrorDialogValue(error)
        }
      })
      setSaveState('idle')
    } finally {
      setLoading(false)
    }
  })

  // Reset handler
  const handleReset = useCallback(() => {
    setValue(initialValue)
    setForceValidation(false)
  }, [initialValue])

  const { basePath } = useDashboard()

  // Cmd/Ctrl+S saves, like every desktop editor
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (hasChanges && !loading) handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasChanges, loading, handleSave])

  const pageLabel = String(item[list.labelField] ?? item.id ?? itemId)
  const pageTitle = list.isSingleton ? list.label : pageLabel

  // Copy ID to clipboard handler
  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(itemId)
    toast.success('ID copied')
  }, [itemId])

  // Keystone's itemView.fieldPosition: 'sidebar' fields go in the right rail, the rest in the form
  const fieldsSplit = useMemo(() => {
    const sidebarFields: Record<string, any> = {}
    const mainFields: Record<string, any> = {}

    Object.entries(enhancedFields).forEach(([key, field]) => {
      if (field.itemView?.fieldPosition === 'sidebar') sidebarFields[key] = field
      else mainFields[key] = field
    })

    return { sidebarFields, mainFields }
  }, [enhancedFields])

  // Status dot on the title line follows the live value of the list's status select, if any
  const statusField = useMemo(() => findStatusField(list.fields || {}), [list.fields])
  const status = useMemo(() => {
    if (!statusField) return null
    const live = (value[statusField.path] as any)?.value
    const raw = live ? live.value : item[statusField.path]
    const option = statusField.fieldMeta?.options?.find((o: any) => String(o.value) === String(raw))
    return { tone: statusTone(raw), label: option?.label ?? (raw == null ? 'None' : String(raw)) }
  }, [statusField, value, item])

  const breadcrumbItems = [
    { type: 'link' as const, label: 'Dashboard', href: basePath },
    { type: 'link' as const, label: list.label, href: `${basePath}/${list.path}` },
    { type: 'page' as const, label: pageTitle }
  ]

  // If item doesn't exist
  if (!item || Object.keys(item).length === 0) {
    return (
      <PageContainer breadcrumbs={breadcrumbItems.slice(0, 2).concat({ type: 'page' as const, label: 'Not found' })}>
        <ItemNotFound>
          {list.isSingleton && itemId === '1' && !list.hideCreate ? (
            <Button size="sm" onClick={() => router.push(`${basePath}/${list.path}/create`)}>
              New {list.singular.toLowerCase()}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => router.push(`${basePath}/${list.path}`)}>
              {list.label}
            </Button>
          )}
        </ItemNotFound>
      </PageContainer>
    )
  }

  const hasSidebar = Object.keys(fieldsSplit.sidebarFields).length > 0

  const actions = (
    <div className="ks-track">
      {!list.hideDelete && (
        <DeleteButton
          list={list}
          value={value}
          onError={setErrorDialogValue}
          queryClient={queryClient}
          isDesktop={false}
        />
      )}
      {hasChanges && (
        <ResetButton hasChanges={hasChanges} onReset={handleReset} isDesktop={false} />
      )}
      <Button
        size="sm"
        onClick={handleSave}
        disabled={!hasChanges || loading || saveState === 'saving'}
        title="Save (⌘S)"
      >
        {saveState === 'saved' && !hasChanges ? <Check /> : null}
        {saveState === 'saving' ? 'Saving' : saveState === 'saved' && !hasChanges ? 'Saved' : 'Save'}
      </Button>
    </div>
  )

  return (
    <PageContainer breadcrumbs={breadcrumbItems} actions={actions}>
      <div className={hasSidebar ? 'mx-auto w-full max-w-[1120px] px-4 pb-16 pt-5 md:px-6 md:pt-6' : 'mx-auto w-full max-w-[760px] px-4 pb-16 pt-5 md:px-6 md:pt-6'}>
        {/* Title line: status dot + record label; meta: list, ID */}
        <div className="mb-5 flex flex-col gap-1.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {status && (
              <span className="ks-dot" data-tone={status.tone} role="img" aria-label={status.label} title={status.label} />
            )}
            <h1 className="min-w-0 truncate text-[18px] font-semibold leading-7 tracking-[-0.01em] text-[var(--ks-ink)] md:text-[20px]" title={pageTitle}>
              {pageTitle}
            </h1>
            {hasChanges && (
              <span className="shrink-0 rounded-[6px] bg-[color-mix(in_oklab,var(--ks-amber)_14%,transparent)] px-1.5 py-0.5 text-[12px] font-medium leading-4 text-[var(--ks-amber)]">
                Edited
              </span>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-2 text-[12px] text-[var(--ks-dim)]">
            {status && <span className="shrink-0">{status.label}</span>}
            {status && <span aria-hidden="true" className="text-[var(--ks-label)]">·</span>}
            <button
              type="button"
              onClick={handleCopyId}
              className="group/id flex min-w-0 items-center gap-1.5 rounded-[6px] font-mono text-[12px] text-[var(--ks-dim)] hover:text-[var(--ks-ink)]"
              aria-label="Copy ID"
            >
              <span className="truncate">{itemId}</span>
              <Copy className="size-3 shrink-0 opacity-60 group-hover/id:opacity-100" />
            </button>
          </div>
        </div>

        {errorDialogValue && (
          <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-[10px] bg-[color-mix(in_oklab,var(--ks-red)_10%,transparent)] px-3 py-2.5 text-[13px] text-[var(--ks-danger)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ks-red)_25%,transparent)]">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p className="whitespace-pre-line break-words">{errorDialogValue.message || PUBLIC_REQUEST_ERROR}</p>
          </div>
        )}

        <div
          className={hasSidebar ? 'grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]' : undefined}
        >
          <div className="min-w-0">
            {Object.keys(fieldsSplit.mainFields).length > 0 && (
              <Fields
                list={list}
                fields={fieldsSplit.mainFields}
                value={value}
                onChange={setValue}
                forceValidation={forceValidation}
                invalidFields={invalidFields}
                isRequireds={isRequireds}
                groups={list.groups}
                layout="cards"
              />
            )}
          </div>

          {hasSidebar && (
            <aside className="min-w-0 lg:sticky lg:top-16 lg:self-start">
              <Fields
                list={list}
                fields={fieldsSplit.sidebarFields}
                value={value}
                onChange={setValue}
                forceValidation={forceValidation}
                invalidFields={invalidFields}
                isRequireds={isRequireds}
                layout="cards"
              />
            </aside>
          )}
        </div>
      </div>

      {/* Error Dialog */}
      {errorDialogValue && (
        <ErrorDialog
          error={errorDialogValue}
          onClose={() => setErrorDialogValue(null)}
        />
      )}
    </PageContainer>
  )
}
