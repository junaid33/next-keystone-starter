/**
 * NotFoundPage: unknown list or route inside the dashboard shell.
 */

import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageContainer } from '../../components/PageContainer'

export function NotFoundPage() {
  return (
    <PageContainer
      title="Not found"
      breadcrumbs={[
        { type: 'link', label: 'Overview', href: '/dashboard' },
        { type: 'page', label: 'Not found' },
      ]}
    >
      <div className="mx-auto w-full max-w-[760px] px-4 pt-6 md:px-6 md:pt-10">
        <div className="ks-card">
          <EmptyState title="Page not found" description="404" icons={[Compass]}>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">
                <ArrowLeft />
                Overview
              </Link>
            </Button>
          </EmptyState>
        </div>
      </div>
    </PageContainer>
  )
}

export default NotFoundPage
