"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!rounded-[12px] group-[.toaster]:!border-0 group-[.toaster]:!bg-[var(--ks-surface)] group-[.toaster]:!text-[var(--ks-ink)] group-[.toaster]:!shadow-[var(--ks-pop-shadow)] group-[.toaster]:!text-[13px] group-[.toaster]:!py-3",
          description: "group-[.toast]:!text-[var(--ks-dim)] group-[.toast]:!text-[12px]",
          actionButton:
            "group-[.toast]:!rounded-[7px] group-[.toast]:!bg-[var(--ks-track)] group-[.toast]:!text-[var(--ks-ink)] group-[.toast]:!text-[12px]",
          cancelButton:
            "group-[.toast]:!rounded-[7px] group-[.toast]:!bg-[var(--ks-track)] group-[.toast]:!text-[var(--ks-dim)] group-[.toast]:!text-[12px]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
