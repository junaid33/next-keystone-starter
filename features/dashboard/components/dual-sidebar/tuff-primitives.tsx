// Ported from TUFFUI action-button, loader, segmented-control and chat-thread (https://tuffui.com)
// MIT License · Copyright (c) 2026 TUFFUI contributors
// Markup and metrics follow the originals; Phosphor → lucide, motion → CSS, colours → --ks-* tokens.
"use client";

import { useRef } from "react";
import { LoaderCircle, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** TUFFUI IconButton, quiet variant, size sm. */
export function IconButton({
  icon: Icon,
  label,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,scale,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] select-none hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 data-[state=open]:bg-foreground/[0.06] data-[state=open]:text-foreground",
        className
      )}
      {...props}
    >
      <Icon strokeWidth={2.5} className="size-3.5" aria-hidden="true" />
    </button>
  );
}

/** TUFFUI Spinner. With reduced motion it holds still and the label carries the state. */
export function Spinner({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center", className)}>
      <LoaderCircle
        strokeWidth={2.5}
        aria-hidden="true"
        className="size-3.5 shrink-0 animate-spin [animation-duration:700ms] motion-reduce:animate-none"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** TUFFUI Thinking, size md: three dots in a wave. */
export function Thinking({ label = "Thinking", className }: { label?: string; className?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 text-muted-foreground", className)}>
      <span aria-hidden="true" className="flex items-center gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 rounded-full bg-current opacity-30 animate-[ks-think_1s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:opacity-60"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** TUFFUI Segmented, size sm: a recessed track, the checked option raised. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onValueChange,
  disabled,
  className,
}: {
  label: string;
  options: { value: T; label: string; title?: string }[];
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const at = options.findIndex((o) => o.value === value);
    const next = options[(at + step + options.length) % options.length];
    onValueChange(next.value);
    ref.current?.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus();
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex h-8 items-center rounded-full bg-[var(--ks-track)] p-0.5 shadow-[var(--ks-recess)]",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-value={option.value}
            title={option.title}
            tabIndex={active ? 0 : -1}
            disabled={disabled}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "relative h-full rounded-full px-3 text-[0.8125rem] font-medium transition-[color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)] active:scale-[0.97] disabled:opacity-40",
              active ? "ks-raised rounded-full text-[var(--ks-ink)]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** The assistant's mark: TUFFUI chat-thread assistant avatar (tinted circle, filled sparkle). */
export function AgentMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--ks-accent)_15%,transparent)] text-[var(--ks-accent-ink)]",
        className
      )}
    >
      <Sparkles fill="currentColor" strokeWidth={1.5} className="size-3.5" />
    </span>
  );
}
