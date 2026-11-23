/**
 * HomePage - Server Component
 * The overview: find a record, then every list with its live count and a create pill.
 */

import { PUBLIC_REQUEST_ERROR } from '@/features/dashboard/lib/security';
import React from 'react'
import Link from 'next/link'
import { ChevronRight, Database, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageContainer } from '../../components/PageContainer'
import { listIcon } from '../../components/listIcons'
import { getAdminMetaAction, getListCounts } from '../../actions'
import { OverviewSearch } from './OverviewSearch'

interface ListRowProps {
  list: any
  count?: number | null
  singletonItemId?: string | null
  hideCreate?: boolean
}

function ListRow({ list, count, singletonItemId = null, hideCreate = false }: ListRowProps) {
  const isSingleton = list.isSingleton || false
  const href = `/dashboard/${list.path}${isSingleton ? '/1' : ''}`
  const singletonIsMissing = isSingleton && !singletonItemId
  const Icon = listIcon(list.key)
  const meta = isSingleton
    ? singletonIsMissing
      ? 'Not created'
      : 'Singleton'
    : count === null || count === undefined
      ? '—'
      : count.toLocaleString('en-US')

  const body = (
    <>
      <span className="ks-raised grid size-7 shrink-0 place-items-center rounded-[8px]">
        <Icon className="size-3.5 text-[var(--ks-dim)]" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--ks-ink)]">{list.label}</span>
      <span className="shrink-0 font-mono text-[12px] tabular-nums text-[var(--ks-dim)]">{meta}</span>
    </>
  )

  return (
    <li className="group relative flex items-center gap-3 px-3 py-2 md:px-4">
      {singletonIsMissing && hideCreate ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
      ) : (
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[8px] outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-[10px] focus-visible:after:ring-2 focus-visible:after:ring-[var(--ks-focus)]"
        >
          {body}
        </Link>
      )}
      <div className="relative z-10 flex shrink-0 items-center justify-end gap-1 sm:w-[76px]">
        {!hideCreate && !isSingleton ? (
          <Button asChild size="sm" variant="outline" className="max-sm:w-7 max-sm:px-0">
            <Link href={`/dashboard/${list.path}/create`} aria-label={`New ${list.singular?.toLowerCase() || 'item'}`}>
              <Plus />
              <span className="max-sm:hidden">New</span>
            </Link>
          </Button>
        ) : null}
        <ChevronRight aria-hidden="true" className="size-3.5 text-[var(--ks-label)] max-sm:hidden" />
      </div>
    </li>
  )
}

const breadcrumbs = [{ type: 'page' as const, label: 'Overview' }]

export async function HomePage() {
  const adminMetaResponse = await getAdminMetaAction()

  if (!adminMetaResponse.success) {
    console.error('Failed to fetch admin meta:', PUBLIC_REQUEST_ERROR)
    return (
      <PageContainer title="Overview" breadcrumbs={breadcrumbs}>
        <div className="ks-card mx-4 mt-6 md:mx-6">
          <EmptyState title="Couldn't load lists" icons={[Database]} />
        </div>
      </PageContainer>
    )
  }

  const adminMeta = adminMetaResponse.data
  const lists = adminMeta?.lists || []
  // Lists are already enhanced with gqlNames from getAdminMetaAction
  const enhancedLists = lists.filter((list: any) => !(list.hideNavigation ?? list.isHidden))

  let countData: Record<string, any> = {}
  if (enhancedLists.length > 0) {
    const countResponse = await getListCounts(enhancedLists)
    if (countResponse.success && countResponse.data) {
      countData = countResponse.data
    }
  }

  const total = enhancedLists.reduce(
    (sum: number, list: any) => sum + (typeof countData[list.key] === 'number' ? countData[list.key] : 0),
    0
  )

  return (
    <PageContainer title="Overview" breadcrumbs={breadcrumbs}>
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 pb-16 pt-5 md:px-6 md:pt-8">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[18px] font-semibold leading-7 tracking-[-0.01em] text-[var(--ks-ink)] md:text-[20px]">Overview</h1>
          {enhancedLists.length > 0 && (
            <span className="font-mono text-[12px] tabular-nums text-[var(--ks-dim)]">{total.toLocaleString('en-US')} records</span>
          )}
        </div>

        <OverviewSearch />

        {enhancedLists.length === 0 ? (
          <div className="ks-card">
            <EmptyState title="No lists" icons={[Database]} />
          </div>
        ) : (
          <section aria-labelledby="lists-heading" className="flex flex-col gap-2">
            <h2 id="lists-heading" className="ks-label px-1">
              Lists
            </h2>
            <ul className="ks-card divide-y divide-[var(--ks-line)] overflow-hidden">
              {enhancedLists.map((list: any) => (
                <ListRow
                  key={list.key}
                  list={list}
                  count={typeof countData[list.key] === 'number' ? countData[list.key] : null}
                  singletonItemId={Array.isArray(countData[`singleton_${list.key}`]) ? countData[`singleton_${list.key}`][0]?.id ?? null : null}
                  hideCreate={list.hideCreate ?? false}
                />
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageContainer>
  )
}

export default HomePage
