import * as React from "react"
import { cn } from "@/lib/utils"

interface FieldContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

/** One field: label, control, description and error, stacked tight. */
const FieldContainer = React.forwardRef<HTMLDivElement, FieldContainerProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-field=""
        className={cn("flex min-w-0 flex-col gap-1 [&>[data-slot=label]]:mb-0.5", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FieldContainer.displayName = "FieldContainer"

export { FieldContainer }
