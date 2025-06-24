/**
 * ListPage - Server Component
 * Based on Keystone's ListPage but adapted for server-side rendering
 * Follows the same pattern as ItemPage
 */

import { getListItemsAction } from '../../actions/getListItemsAction'
import { getListByPath } from '../../actions/getListByPath'
import { getAdminMetaAction } from '../../actions'
import { buildOrderByClause } from '../../lib/buildOrderByClause'
import { notFound } from 'next/navigation'
import { ListPageClient } from './ListPageClient'

interface PageProps {
  params: Promise<{ listKey: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function ListPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { listKey: listKeyParam } = resolvedParams;
  const searchParamsObj = Object.fromEntries(
    Object.entries(resolvedSearchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value : value?.toString(),
    ])
  );

  // Get the list by path using our cached function
  const list = await getListByPath(listKeyParam);

  if (!list) {
    notFound()
  }

  // Parse search params
  const currentPage = parseInt(searchParamsObj.page?.toString() || '1', 10) || 1
  const pageSize = parseInt(searchParamsObj.pageSize?.toString() || list.pageSize?.toString() || '50', 10)
  const searchString = searchParamsObj.search?.toString() || ''

  // Build dynamic orderBy clause using Keystone's defaults
  const orderBy = buildOrderByClause(list, searchParamsObj)

  // Build GraphQL variables - following the same pattern as existing code
  const variables = {
    where: searchString ? { 
      OR: [
        { name: { contains: searchString, mode: 'insensitive' } },
        { id: { contains: searchString, mode: 'insensitive' } }
      ]
    } : {},
    take: pageSize,
    skip: (currentPage - 1) * pageSize,
    orderBy
  }

  // Build selected fields set (for now, use basic fields)
  const selectedFields = ['id']
  if (list.fields) {
    Object.keys(list.fields).forEach(fieldKey => {
      if (['name', 'title', 'label', 'createdAt', 'updatedAt'].includes(fieldKey)) {
        selectedFields.push(fieldKey)
      }
    })
  }

  // Fetch list items data with cache options
  const cacheOptions = {
    next: {
      tags: [`list-${list.key}`],
      revalidate: 300, // 5 minutes
    },
  }

  // Use the working dashboard action for list items data
  const response = await getListItemsAction(listKeyParam, variables, selectedFields, cacheOptions)

  let fetchedData: { items: any[], count: number } = { items: [], count: 0 }
  let error: string | null = null

  if (response.success) {
    fetchedData = response.data
  } else {
    console.error('Error fetching list items:', response.error)
    error = response.error
  }

  // Get adminMeta for the list structure
  const adminMetaResponse = await getAdminMetaAction(list.key)
  
  // Extract the list with proper field metadata if successful
  const adminMetaList = adminMetaResponse.success ? adminMetaResponse.data.list : null
  
  // Create enhanced list with validation data
  const enhancedList = adminMetaList || list

  return (
    <ListPageClient
      list={enhancedList}
      initialData={fetchedData}
      initialError={error}
      initialSearchParams={{
        page: currentPage,
        pageSize,
        search: searchString
      }}
    />
  )
}

export default ListPage