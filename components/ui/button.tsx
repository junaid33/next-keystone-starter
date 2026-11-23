import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
  Buttons are raised pills. Standalone, a pill carries its own 2px recessed moat; placed inside a
  `.ks-track` it sits flush in the shared well (see app/dashboard/globals.css). Ghost and link stay flat.
*/
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 shrink-0 [&_svg]:shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--ks-surface)] aria-invalid:ring-destructive/30",
  {
    variants: {
      variant: {
        default: "ks-pill",
        destructive: "ks-pill",
        outline: "ks-pill",
        secondary: "ks-pill",
        ghost: "rounded-[7px] text-[var(--ks-dim)] transition-colors hover:bg-[var(--ks-hover)] hover:text-[var(--ks-ink)] data-[state=open]:bg-[var(--ks-hover)] data-[state=open]:text-[var(--ks-ink)]",
        link: "text-[var(--ks-accent-ink)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3 text-[13px]",
        sm: "h-7 px-2.5 text-[12px]",
        lg: "h-9 px-4 text-[13px]",
        icon: "size-8 text-[13px]",
        "icon-sm": "size-7 text-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const pillVariant: Record<string, string | undefined> = {
  default: "primary",
  destructive: "danger-fill",
  outline: undefined,
  secondary: undefined,
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  const v = variant ?? "default"

  return (
    <Comp
      data-slot="button"
      data-variant={pillVariant[v]}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
