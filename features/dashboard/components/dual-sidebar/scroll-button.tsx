"use client"

// TUFFUI chat-thread "Jump to latest" pill (https://tuffui.com · MIT · Copyright (c) 2026 TUFFUI contributors),
// restyled to --ks-* tokens. Scrolling still comes from use-stick-to-bottom.

import { ArrowDown } from "lucide-react"
import { useStickToBottomContext } from "use-stick-to-bottom"
import { cn } from "@/lib/utils"

function ScrollButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  return (
    <button
      type="button"
      onClick={() => scrollToBottom()}
      aria-hidden={isAtBottom || undefined}
      tabIndex={isAtBottom ? -1 : 0}
      className={cn(
        "ks-raised absolute bottom-3 left-1/2 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 text-[0.8125rem] font-medium text-[var(--ks-ink)] transition-[opacity,translate,scale] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[var(--ks-raised-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)] active:scale-[0.97] motion-reduce:transition-none",
        isAtBottom ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100",
        className
      )}
      {...props}
    >
      <ArrowDown strokeWidth={2.5} className="size-3.5" aria-hidden="true" />
      Jump to latest
    </button>
  )
}

export { ScrollButton }
