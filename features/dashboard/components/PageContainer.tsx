/**
 * PageContainer: the shared top bar, an optional page head, then the page body.
 */

import React, { ReactNode } from 'react'
import { TopBar } from './TopBar'

interface BreadcrumbItem {
  type: 'link' | 'page'
  label: string
  href?: string
}

interface PageContainerProps {
  children: ReactNode
  title?: string
  header?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
}

export function PageContainer({ children, title, header, breadcrumbs, actions }: PageContainerProps) {
  const crumbs = (breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs : [{ type: 'page' as const, label: title || '' }]).map((b) => ({
    label: b.label,
    href: b.type === 'link' ? b.href : undefined,
  }))

  return (
    <div className="flex min-h-full flex-col">
      <TopBar crumbs={crumbs} actions={actions} />
      {header && <div className="px-4 pt-5 md:px-6 md:pt-6">{header}</div>}
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default PageContainer
