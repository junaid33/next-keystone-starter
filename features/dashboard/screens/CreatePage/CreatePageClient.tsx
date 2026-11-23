/**
 * CreatePageClient for Dashboard 2
 * Client component with form functionality matching ItemPage layout
 */

'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageContainer } from '../../components/PageContainer'
import { useDashboard } from '../../context/DashboardProvider'
import { Fields } from '../../components/Fields'
import { useCreateItem } from '../../utils/useCreateItem'
import { enhanceFields } from '../../utils/enhanceFields'

interface CreatePageClientProps {
  listKey: string
  list: any
}

// Cancel Button Component (matches ItemPage pattern)
function CancelButton({ 
  onCancel,
  isDesktop = true 
}: { 
  onCancel: () => void;
  isDesktop?: boolean;
}) {
  return (
    <Button variant="outline" size="sm" aria-label="Cancel" onClick={onCancel} className={isDesktop ? undefined : 'max-sm:w-7 max-sm:px-0'}>
      <X className="sm:hidden" />
      <span className={isDesktop ? undefined : 'max-sm:hidden'}>Cancel</span>
    </Button>
  )
}

export function CreatePageClient({ listKey, list }: CreatePageClientProps) {
  const { basePath } = useDashboard()
  const router = useRouter()
  
  // Create enhanced fields like Keystone does - same pattern as ItemPage
  const enhancedFields = useMemo(() => {
    return enhanceFields(list.fields || {}, list.key)
  }, [list.fields, list.key])
  
  // Use the create item hook with enhanced fields
  const createItem = useCreateItem(list, enhancedFields)

  const handleSave = useCallback(async () => {
    if (!createItem) return
    
    // Check for invalid fields before attempting to create - same pattern as ItemPage
    if (createItem.props.invalidFields.size !== 0) {
      return
    }
    
    const item = await createItem.create()
    if (item?.id) {
      router.push(`${basePath}/${list.path}/${item.id}`)
    }
  }, [createItem, router, basePath, list])

  const handleCancel = useCallback(() => {
    router.push(`${basePath}/${list.path}`)
  }, [router, basePath, list])

  // Keystone's createView.fieldPosition: 'sidebar' fields go in the right rail
  const fieldsSplit = useMemo(() => {
    const sidebarFields: Record<string, any> = {}
    const mainFields: Record<string, any> = {}
    Object.entries(enhancedFields).forEach(([key, field]: [string, any]) => {
      if (field.createView?.fieldPosition === 'sidebar') sidebarFields[key] = field
      else mainFields[key] = field
    })
    return { sidebarFields, mainFields }
  }, [enhancedFields])

  // Cmd/Ctrl+S creates
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (createItem?.state !== 'loading') handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [createItem?.state, handleSave])

  const breadcrumbItems = list
    ? [
        { type: 'link' as const, label: 'Dashboard', href: basePath },
        { type: 'link' as const, label: list.label, href: `${basePath}/${list.path}` },
        { type: 'page' as const, label: `New ${list.singular.toLowerCase()}` },
      ]
    : [{ type: 'page' as const, label: 'Not found' }]

  if (!list || !createItem) {
    return (
      <PageContainer breadcrumbs={breadcrumbItems}>
        <div className="mx-auto w-full max-w-[760px] px-4 pt-6 md:px-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{!list ? `No list “${listKey}”` : `Couldn't open the form for ${list.label}`}</AlertDescription>
          </Alert>
        </div>
      </PageContainer>
    )
  }

  const hasSidebar = Object.keys(fieldsSplit.sidebarFields).length > 0
  const errorMessage =
    createItem.error?.networkError?.message || createItem.error?.graphQLErrors?.[0]?.message || null

  const actions = (
    <div className="ks-track">
      <CancelButton onCancel={handleCancel} isDesktop={false} />
      <Button size="sm" onClick={handleSave} disabled={createItem.state === 'loading'} title="Create (⌘S)">
        {createItem.state === 'loading' ? 'Creating' : 'Create'}
      </Button>
    </div>
  )

  return (
    <PageContainer breadcrumbs={breadcrumbItems} actions={actions}>
      <div className={hasSidebar ? 'mx-auto w-full max-w-[1120px] px-4 pb-16 pt-5 md:px-6 md:pt-6' : 'mx-auto w-full max-w-[760px] px-4 pb-16 pt-5 md:px-6 md:pt-6'}>
        <div className="mb-5 flex items-center gap-2.5">
          <span className="ks-dot" data-tone="gray" aria-hidden="true" />
          <h1 className="truncate text-[18px] font-semibold leading-7 tracking-[-0.01em] text-[var(--ks-ink)] md:text-[20px]">
            New {list.singular.toLowerCase()}
          </h1>
        </div>

        {errorMessage && (
          <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-[10px] bg-[color-mix(in_oklab,var(--ks-red)_10%,transparent)] px-3 py-2.5 text-[13px] text-[var(--ks-danger)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--ks-red)_25%,transparent)]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p className="whitespace-pre-line break-words">{errorMessage}</p>
          </div>
        )}

        <div className={hasSidebar ? 'grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]' : undefined}>
          <div className="min-w-0">
            {Object.keys(fieldsSplit.mainFields).length > 0 && (
              <Fields {...createItem.props} fields={fieldsSplit.mainFields} view="createView" groups={list.groups} layout="cards" />
            )}
          </div>
          {hasSidebar && (
            <aside className="min-w-0 lg:sticky lg:top-16 lg:self-start">
              <Fields {...createItem.props} fields={fieldsSplit.sidebarFields} view="createView" groups={[]} layout="cards" />
            </aside>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

export default CreatePageClient
