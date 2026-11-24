// Ported from TUFFUI tool-call-block (https://tuffui.com) · MIT License · Copyright (c) 2026 TUFFUI contributors
// Markup and metrics follow the original; Phosphor → lucide, motion → CSS, colours → --ks-* tokens.
"use client";

import { useEffect, useId, useState } from "react";
import { Check, ChevronRight, Clock, Copy, LoaderCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolCallStatus = "pending" | "running" | "success" | "error";

export type ToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: ToolCallStatus;
  result?: string | Record<string, unknown>;
  error?: string;
};

const labels = {
  status: { pending: "Queued", running: "Running", success: "Done", error: "Failed" } as Record<ToolCallStatus, string>,
  arguments: "Arguments",
  result: "Result",
  failed: "Tool call failed",
};

const statuses = {
  pending: { icon: Clock, className: "bg-foreground/[0.06] text-muted-foreground" },
  running: {
    icon: LoaderCircle,
    className: "bg-[color-mix(in_oklab,var(--ks-accent)_15%,transparent)] text-[var(--ks-accent-ink)]",
  },
  success: {
    icon: Check,
    className: "bg-[color-mix(in_oklab,var(--ks-green)_15%,transparent)] text-[var(--ks-green)]",
  },
  error: {
    icon: X,
    className: "bg-[color-mix(in_oklab,var(--ks-red)_15%,transparent)] text-[var(--ks-red)]",
  },
} as const;

export function ToolCallBlock({ data, className }: { data: ToolCall; className?: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const status = statuses[data.status];
  const Icon = status.icon;
  const running = data.status === "running";

  return (
    <section
      data-tool-call=""
      className={cn(
        "@container w-full max-w-xl overflow-hidden rounded-[1.125rem] bg-[var(--ks-track)] p-1 shadow-[var(--ks-recess)]",
        className
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-[0.875rem] py-1.5 ps-1.5 pe-2.5 text-start text-sm transition-[background-color,scale] duration-150 ease-out hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)] active:scale-[0.99]"
      >
        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", status.className)}>
          <Icon
            strokeWidth={2.5}
            className={cn("size-3.5", running && "animate-spin motion-reduce:animate-none")}
            aria-hidden="true"
          />
        </span>
        <span dir="ltr" className="shrink-0 font-mono text-[0.8125rem] font-medium text-[var(--ks-ink)]">
          {data.name}
        </span>
        <span dir="ltr" className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
          {summarize(data.args)}
        </span>
        <span className="sr-only">{labels.status[data.status]}</span>
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
          {running ? <Elapsed key={data.id} /> : null}
        </span>
        <ChevronRight
          strokeWidth={2.5}
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
            open && "rotate-90"
          )}
        />
      </button>
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
        inert={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-1 flex flex-col gap-3 rounded-[0.875rem] bg-[var(--ks-surface)] p-3 shadow-[var(--ks-raised-shadow)]">
            <Section title={labels.arguments} copy={JSON.stringify(data.args, null, 2)}>
              <Json value={data.args} />
            </Section>
            {data.status === "error" ? (
              <div className="flex items-start gap-2 rounded-xl bg-[color-mix(in_oklab,var(--ks-red)_10%,transparent)] py-2 ps-3 pe-2 text-[0.8125rem] text-[var(--ks-red)]">
                <X strokeWidth={2.5} className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <p className="min-w-0 flex-1 font-mono text-xs leading-5 break-words">
                  <bdi>{data.error ?? labels.failed}</bdi>
                </p>
              </div>
            ) : data.status === "success" && data.result !== undefined ? (
              <Section
                title={labels.result}
                copy={typeof data.result === "string" ? data.result : JSON.stringify(data.result, null, 2)}
              >
                <div className="max-h-40 overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
                  {typeof data.result === "string" ? (
                    <p dir="ltr" className="text-start font-mono text-xs leading-5 whitespace-pre-wrap break-words">
                      {data.result}
                    </p>
                  ) : (
                    <Json value={data.result} />
                  )}
                </div>
              </Section>
            ) : null}
          </div>
        </div>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {`${data.name}: ${labels.status[data.status]}`}
      </p>
    </section>
  );
}

function Section({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="ps-1 text-[0.8125rem] text-muted-foreground">{title}</span>
        <button
          type="button"
          aria-label={copied ? `${title} copied` : `Copy ${title.toLowerCase()}`}
          title={copied ? `${title} copied` : `Copy ${title.toLowerCase()}`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(copy);
              setCopied(true);
            } catch {}
          }}
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)] active:scale-[0.97]",
            copied && "text-[var(--ks-green)] hover:text-[var(--ks-green)]"
          )}
        >
          {copied ? <Check strokeWidth={2.5} className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <div className="rounded-xl bg-foreground/[0.04] px-3 py-2.5">{children}</div>
    </div>
  );
}

const tokenPattern = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g;

function Json({ value }: { value: unknown }) {
  const text = JSON.stringify(value, null, 2) ?? "";
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const [token, str, colon, literal] = match;
    const className = colon
      ? "text-muted-foreground"
      : str
        ? "text-[var(--ks-green)]"
        : literal
          ? "text-[var(--ks-accent-ink)]"
          : "text-[var(--ks-amber)]";
    parts.push(
      <span key={index} className={className}>
        {colon ? str : token}
      </span>
    );
    if (colon) parts.push(colon);
    last = index + token.length;
  }
  parts.push(text.slice(last));
  return (
    <pre dir="ltr" className="font-mono text-xs leading-5 break-words whitespace-pre-wrap text-[var(--ks-ink)]">
      {parts}
    </pre>
  );
}

/** Counts up from mount; remounted (via key) each time a call starts running. */
function Elapsed() {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const timer = setInterval(() => setMs(performance.now() - start), 100);
    return () => clearInterval(timer);
  }, []);
  return <>{formatMs(ms)}</>;
}

function summarize(args: Record<string, unknown>) {
  const first = Object.values(args ?? {}).find((v) => typeof v === "string" || typeof v === "number");
  return first === undefined ? "" : String(first);
}

function formatMs(ms: number) {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}
