/**
 * ErrorBoundary component - Error handling for Dashboard 2
 * Provides graceful error recovery with ShadCN styling
 */

'use client'

import { safeErrorSummary } from '@/features/dashboard/lib/security';
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCw } from 'lucide-react'

// notFound() and redirect() signal Next through errors tagged with a digest. They are control
// flow, not failures, and must reach Next's own boundaries (public, documented digests).
function isNextRouterError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest
  return typeof digest === 'string' && (digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_HTTP_ERROR_FALLBACK'))
}

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isNextRouterError(error)) return
    console.error('Dashboard ErrorBoundary caught an error:', safeErrorSummary(error))
  }

  render() {
    // notFound() and redirect() are control flow, not failures: hand them back to Next so an unknown
    // dashboard URL shows the 404 page instead of "Something went wrong".
    if (this.state.hasError && this.state.error && isNextRouterError(this.state.error)) {
      throw this.state.error
    }
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh w-full items-center justify-center bg-[var(--ks-page)] p-4">
          <div className="ks-card w-full max-w-[360px] p-5">
            <div className="flex items-center gap-2.5">
              <span className="ks-dot" data-tone="red" aria-hidden="true" />
              <h1 className="text-[14px] font-semibold text-[var(--ks-ink)]">Something went wrong</h1>
            </div>
            <div className="ks-track mt-5 flex w-full">
              <Button size="sm" variant="outline" className="h-8 flex-1" onClick={() => window.location.reload()}>
                <RotateCw />
                Reload
              </Button>
              <Button size="sm" className="h-8 flex-1" onClick={() => this.setState({ hasError: false, error: undefined })}>
                Try again
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}