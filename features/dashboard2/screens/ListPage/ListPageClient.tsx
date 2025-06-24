/**
 * ListPageClient - Client Component  
 * Based on Keystone's ListPage implementation but using ShadCN components
 * Follows the same pattern as ItemPageClient
 */

'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { FilterBar } from '../../components/FilterBar'
import { useDashboard } from '../../context/DashboardProvider'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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

export function ListPageClient({ 
  list, 
  initialData, 
  initialError, 
  initialSearchParams 
}: ListPageClientProps) {
  const router = useRouter()
  const { basePath } = useDashboard()
  
  // State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Extract data from props
  const data = initialData
  const error = initialError
  const currentPage = initialSearchParams.page
  const pageSize = initialSearchParams.pageSize
  const searchString = initialSearchParams.search

  // Handle page change - simplified since FilterBar handles search/filters
  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(window.location.search)
    
    if (newPage && newPage > 1) {
      params.set('page', newPage.toString())
    } else {
      params.delete('page')
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.push(newUrl)
  }, [router])

  if (!list) {
    return (
      <PageContainer title="List not found">
        <Alert variant="destructive">
          <AlertDescription>
            The requested list was not found.
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
    </div>
  )

  // Check if we have any active filters (search or actual filters)
  const hasFilters = !!searchString
  const isFiltered = hasFilters
  const isEmpty = data?.count === 0 && !isFiltered

  return (
    <PageContainer title={list.label} header={header} breadcrumbs={breadcrumbs}>
      <div className="space-y-4">
        {/* Filter Bar - includes search, filters, and create button */}
        <FilterBar list={list} />

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

        {/* Data table */}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load items: {error}
            </AlertDescription>
          </Alert>
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
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}