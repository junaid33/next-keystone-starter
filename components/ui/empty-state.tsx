import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  title: string
  description?: string
  icons?: LucideIcon[]
  action?: {
    label: string
    onClick: () => void
  }
  children?: React.ReactNode
  className?: string
}

/** Centred empty state: one raised icon tile, a label, an optional line and action. */
export function EmptyState({ title, description, icons = [], action, children, className }: EmptyStateProps) {
  const Icon = icons[0]
  return (
    <div className={cn("flex w-full flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}>
      {Icon && (
        <div className="ks-raised grid size-10 place-items-center rounded-[10px]">
          <Icon className="size-4 text-[var(--ks-dim)]" />
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[13px] font-medium text-[var(--ks-ink)]">{title}</h2>
        {description && <p className="whitespace-pre-line text-[12px] text-[var(--ks-dim)]">{description}</p>}
      </div>
      {(action || children) && (
        <div className="ks-track">
          {action && (
            <Button size="sm" variant="outline" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
