/**
 * ListPage for Dashboard 2 
 * Combines Keystone's list functionality with Dashboard 1's ShadCN UI styling
 */

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Trash2, 
  RotateCcw,
  SearchX,
  Table as TableIcon 
} from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '../../components/PageContainer'
import { useAdminMeta, useList } from '../../hooks/useAdminMeta'
import { useDashboard } from '../../context/DashboardProvider'
import { getFieldViews } from '../../views/registry'
import { cn } from '@/lib/utils'
import { getListItemsAction } from '../../actions/getListItemsAction'

interface ListPageProps {
  listKey: string
}

// Pagination hook - adapted for next/navigation
function usePagination(defaultPageSize = 50) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const page = searchParams.get('page') || '1'
  const pageSize = searchParams.get('pageSize') || defaultPageSize.toString()
  
  const currentPage = parseInt(page, 10) || 1
  const currentPageSize = parseInt(pageSize, 10) || defaultPageSize

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  return { currentPage, pageSize: currentPageSize, updatePage }
}

// Search and filters hook - adapted for next/navigation
function useFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const searchString = searchParams.get('search') || ''

  const updateSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value.trim()) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('?')
  }

  return { searchString, updateSearch, clearFilters, hasFilters: !!searchString }
}


function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {isFiltered ? (
        <>
          <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground">
            No items found. Try adjusting your search or filters.
          </p>
        </>
      ) : (
        <>
          <TableIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items yet</h3>
          <p className="text-muted-foreground">
            Add the first item to see it here.
          </p>
        </>
      )}
    </div>
  )
}

function LoadingTable() {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Skeleton className="h-4 w-4" />
            </TableHead>
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function Pagination({ 
  currentPage, 
  pageSize, 
  total, 
  onPageChange 
}: { 
  currentPage: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize)
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, total)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {start} to {end} of {total} items
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <div className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export function ListPage({ listKey }: ListPageProps) {
  const { list } = useList(listKey) || { list: null }
  const { basePath } = useDashboard()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [searchInput, setSearchInput] = useState('')
  const { currentPage, pageSize, updatePage } = usePagination(list?.pageSize)
  const { searchString, updateSearch, clearFilters, hasFilters } = useFilters()

  // Initialize search input from URL
  useEffect(() => {
    setSearchInput(searchString)
  }, [searchString])

  // Build GraphQL variables
  const variables = useMemo(() => ({
    where: searchString ? { 
      OR: [
        { name: { contains: searchString, mode: 'insensitive' } },
        { id: { contains: searchString, mode: 'insensitive' } }
      ]
    } : {},
    take: pageSize,
    skip: (currentPage - 1) * pageSize,
    orderBy: [{ createdAt: 'desc' }]
  }), [searchString, pageSize, currentPage])

  // Build selected fields set (for now, use basic fields)
  const selectedFields = useMemo(() => {
    const fields = ['id']
    // Add some default fields that are commonly available
    if (list?.fields) {
      Object.keys(list.fields).forEach(fieldKey => {
        if (['name', 'title', 'label', 'createdAt', 'updatedAt'].includes(fieldKey)) {
          fields.push(fieldKey)
        }
      })
    }
    return fields
  }, [list])

  // State for data fetching
  const [data, setData] = useState<{ items: any[], count: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Debug info state
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Fetch data function
  const fetchData = async () => {
    console.log(`🔍 ListPage fetchData called with:`, { listKey, list: !!list, variables, selectedFields })
    
    if (!list) {
      console.error(`❌ No list found for listKey: "${listKey}"`)
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log(`🚀 Calling getListItemsAction with:`, { listKey, variables, selectedFields })
      const response = await getListItemsAction(listKey, variables, selectedFields)
      
      console.log(`📥 getListItemsAction response:`, response)
      
      // Store debug info
      setDebugInfo({
        listKey,
        variables,
        selectedFields,
        response,
        timestamp: new Date().toISOString()
      })
      
      if (response.success) {
        setData(response.data)
      } else {
        setError(response.error)
      }
    } catch (err) {
      console.error(`💥 Error in fetchData:`, err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchData()
  }, [listKey, JSON.stringify(variables), JSON.stringify(selectedFields)])

  // Refresh function for manual reloading
  const mutate = fetchData

  if (!list) {
    return (
      <PageContainer title="List not found">
        <Alert variant="destructive">
          <AlertDescription>
            The requested list "{listKey}" was not found.
          </AlertDescription>
        </Alert>
      </PageContainer>
    )
  }

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: basePath },
    { type: 'page' as const, label: list.label }
  ]

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-semibold md:text-2xl">{list.label}</h1>
      {!list.hideCreate && (
        <Button asChild>
          <Link href={`${basePath}/${list.path}/create`}>
            <Plus className="h-4 w-4 mr-2" />
            New {list.singular?.toLowerCase() || 'item'}
          </Link>
        </Button>
      )}
    </div>
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearch(searchInput)
  }

  const isFiltered = hasFilters
  const isEmpty = data?.count === 0 && !isFiltered

  return (
    <PageContainer title={list.label} header={header} breadcrumbs={breadcrumbs}>
      <div className="space-y-4">
        {/* Search and filters bar */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>
          
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {/* Selection toolbar */}
        {selectedItems.size > 0 && (
          <div className="bg-muted/50 border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedItems(new Set())}
                >
                  Clear selection
                </Button>
                {!list.hideDelete && (
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Debug Info Panel */}
        {debugInfo && (
          <div className="bg-gray-100 border rounded-lg p-4 text-xs font-mono">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <div className="space-y-2">
              <div><strong>List Key:</strong> "{debugInfo.listKey}"</div>
              <div><strong>Variables:</strong> {JSON.stringify(debugInfo.variables, null, 2)}</div>
              <div><strong>Selected Fields:</strong> {JSON.stringify(debugInfo.selectedFields, null, 2)}</div>
              <div><strong>Response:</strong> {JSON.stringify(debugInfo.response, null, 2)}</div>
              <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
            </div>
          </div>
        )}

        {/* Data table */}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load items: {error}
              <Button variant="outline" size="sm" onClick={() => mutate()} className="ml-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <LoadingTable />
        ) : isEmpty ? (
          <EmptyState isFiltered={false} />
        ) : data?.count === 0 ? (
          <EmptyState isFiltered={isFiltered} />
        ) : (
          <div className="space-y-4">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedItems)
                            if (checked) {
                              newSelected.add(item.id)
                            } else {
                              newSelected.delete(item.id)
                            }
                            setSelectedItems(newSelected)
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`${basePath}/${list.path}/${item.id}`}
                          className="font-medium hover:underline"
                        >
                          {item.id}
                        </Link>
                      </TableCell>
                      <TableCell>{item.name || '—'}</TableCell>
                      <TableCell>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`${basePath}/${list.path}/${item.id}`}>
                                View
                              </Link>
                            </DropdownMenuItem>
                            {!list.hideDelete && (
                              <DropdownMenuItem className="text-destructive">
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {data && (
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                total={data.count}
                onPageChange={updatePage}
              />
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}

export default ListPage