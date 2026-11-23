import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FieldLabelProps extends React.ComponentProps<typeof Label> {
  children: React.ReactNode
}

const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Label
        ref={ref}
        className={cn("mb-1.5 flex items-center gap-1.5 text-[12px] font-medium leading-4 text-[var(--ks-dim)]", className)}
        {...props}
      >
        {children}
      </Label>
    )
  }
)
FieldLabel.displayName = "FieldLabel"

export { FieldLabel }
