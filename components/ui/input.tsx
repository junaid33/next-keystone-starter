import { cn } from "@/lib/utils";
import * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "ks-field file:text-foreground flex h-8 w-full min-w-0 px-2.5 py-1 text-[13px] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 read-only:bg-[var(--ks-surface-2)]",
        type === "search" &&
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
        type === "file" &&
          "text-[var(--ks-dim)] file:text-foreground p-0 pr-3 file:me-3 file:h-full file:border-0 file:border-r file:border-solid file:border-[var(--ks-line)] file:bg-transparent file:px-3 file:font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
