/**
 * PageSkeleton: shown by the admin route segment while a server page loads.
 */

import { PageContainer } from './PageContainer'

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[6px] bg-[var(--ks-hover)] ${className}`} />
}

const widths = ['w-2/5', 'w-1/3', 'w-1/2', 'w-1/4', 'w-2/5', 'w-1/3', 'w-1/2', 'w-1/4']

export function PageSkeleton() {
  return (
    <PageContainer breadcrumbs={[{ type: 'page', label: '' }]}>
      <div role="status" aria-label="Loading" className="flex flex-col">
        <div className="px-4 pb-1 pt-5 md:px-6 md:pt-6">
          <Bar className="h-6 w-40" />
        </div>
        <div className="flex items-center gap-2 px-4 pb-3 pt-4 md:px-6">
          <Bar className="h-8 flex-1 md:max-w-[420px]" />
          <Bar className="ml-auto h-8 w-24 max-md:hidden" />
        </div>
        <div className="border-y border-[var(--ks-line)] md:mx-6 md:rounded-[12px] md:border md:bg-[var(--ks-surface)] md:shadow-[var(--ks-card-shadow)]">
          {widths.map((w, i) => (
            <div key={i} className="flex h-11 items-center gap-4 border-b border-[var(--ks-line)] px-4 last:border-b-0">
              <Bar className="size-4" />
              <Bar className={`h-3 ${w}`} />
              <Bar className="ml-auto h-3 w-16 max-sm:hidden" />
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}

export default PageSkeleton
