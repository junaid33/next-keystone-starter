/**
 * ListPageClient - Client Component
 * Find a record: title + count, search/filter/sort/columns, a dense table (cards on phones),
 * a sticky footer that turns into the bulk-action bar on selection.
 * Data comes from React Query with the server result as placeholder; all state is in the URL.
 */

'use client'

import React, { useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, SearchX, RotateCw, TriangleAlert } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { PageContainer } from '../../components/PageContainer'
import { FilterBar } from '../../components/FilterBar'
import { ListTable } from '../../components/ListTable'
import { useDashboard } from '../../context/DashboardProvider'
import { useSelectedFields } from '../../hooks/useSelectedFields'
import { useSort } from '../../hooks/useSort'
import { useListItemsQuery } from '../../hooks/useListItems.query'
import { buildOrderByClause } from '../../lib/buildOrderByClause'
import { buildWhereClause } from '../../lib/buildWhereClause'
import { listQueryFields } from '../../lib/listQueryFields'
import { listIcon } from '../../components/listIcons'

interface ListPageClientProps {
  list: any
  initialData: { items: any[], count: number }
  initialError: string | null
  initialSearchParams: {
    page: number
    pageSize: number
    search: string
  }
}

export function ListPageClient({
  list,
  initialData,
  initialError,
  initialSearchParams
}: ListPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { basePath } = useDashboard()

  const selectedFields = useSelectedFields(list)
  useSort(list)

  const currentSearchParams = useMemo(() => {
    const params: Record<string, string> = {}
    searchParams?.forEach((value, key) => {
      params[key] = value
    })
    return params
  }, [searchParams])

  const currentPage = parseInt(currentSearchParams.page || '1', 10) || 1
  const pageSize = parseInt(currentSearchParams.pageSize || list.pageSize?.toString() || '50', 10)
  const searchString = currentSearchParams.search || ''

  const variables = useMemo(() => {
    const orderBy = buildOrderByClause(list, currentSearchParams)
    const filterWhere = buildWhereClause(list, currentSearchParams)
    const searchWhere = buildWhereClause(list, searchString ? { search: searchString } : {})

    const whereConditions = []
    if (Object.keys(searchWhere).length > 0) whereConditions.push(searchWhere)
    if (Object.keys(filterWhere).length > 0) whereConditions.push(filterWhere)

    return {
      where: whereConditions.length > 0 ? { AND: whereConditions } : {},
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
      orderBy
    }
  }, [list, currentSearchParams, currentPage, pageSize, searchString])

  const querySelectedFields = useMemo(
    () => listQueryFields(list, currentSearchParams.fields),
    [list, currentSearchParams.fields]
  )

  // placeholderData (not initialData) so invalidation after edits refetches
  const { data: queryData, error: queryError, isFetching, refetch } = useListItemsQuery(
    {
      listKey: list.key,
      variables,
      selectedFields: querySelectedFields
    },
    {
      placeholderData: initialError ? undefined : initialData,
    }
  )

  const data = queryData || initialData
  const error = queryError ? queryError.message : initialError

  const handleResetFilters = useCallback(() => {
    router.push(window.location.pathname)
  }, [router])

  const hasFilterParams = Object.keys(currentSearchParams).some((k) => k.startsWith('!'))
  const isFiltered = !!searchString || hasFilterParams
  const isEmpty = data?.count === 0 && !isFiltered
  const Icon = listIcon(list.key)

  const createHref = `${basePath}/${list.path}/create`
  const createAction = !list.hideCreate ? (
    <Button asChild size="sm">
      <Link href={createHref}>
        <Plus />
        <span className="max-sm:hidden">New {list.singular.toLowerCase()}</span>
        <span className="sm:hidden">New</span>
      </Link>
    </Button>
  ) : null

  const breadcrumbs = [
    { type: 'link' as const, label: 'Overview', href: basePath },
    { type: 'page' as const, label: list.label }
  ]

  const header = (
    <div className="flex items-center gap-2.5">
      <h1 className="text-[18px] font-semibold leading-7 tracking-[-0.01em] text-[var(--ks-ink)] md:text-[20px]">
        {list.label}
      </h1>
      {!error && (
        <span className="font-mono text-[12px] text-[var(--ks-dim)]" aria-label={`${data?.count ?? 0} total`}>
          {data?.count ?? 0}
        </span>
      )}
    </div>
  )

  return (
    <PageContainer title={list.label} header={header} breadcrumbs={breadcrumbs} actions={createAction}>
      <div className="px-4 pb-3 pt-4 md:px-6">
        <FilterBar list={list} selectedFields={selectedFields} />
      </div>

      <div className="border-y border-[var(--ks-line)] md:mx-6 md:mb-6 md:rounded-[12px] md:border md:bg-[var(--ks-surface)] md:shadow-[var(--ks-card-shadow)]">
        {error ? (
          <EmptyState
            title={`Couldn't load ${list.label.toLowerCase()}`}
            description={error}
            icons={[TriangleAlert]}
          >
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RotateCw />
              Retry
            </Button>
          </EmptyState>
        ) : isEmpty ? (
          <EmptyState title={`No ${list.plural.toLowerCase()}`} icons={[Icon]}>
            {!list.hideCreate && (
              <Button asChild size="sm">
                <Link href={createHref}>
                  <Plus />
                  New {list.singular.toLowerCase()}
                </Link>
              </Button>
            )}
          </EmptyState>
        ) : data?.count === 0 ? (
          <EmptyState
            title="No matches"
            description={searchString ? `Nothing matches “${searchString}”` : undefined}
            icons={[SearchX]}
            action={{ label: 'Clear search and filters', onClick: handleResetFilters }}
          />
        ) : (
          <ListTable
            data={data}
            list={list}
            selectedFields={selectedFields}
            currentPage={currentPage || initialSearchParams.page}
            pageSize={pageSize}
            isFetching={isFetching && !!queryData}
          />
        )}
      </div>
    </PageContainer>
  )
}
