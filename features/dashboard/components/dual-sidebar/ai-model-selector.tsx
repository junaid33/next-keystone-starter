"use client";

// Model picker for the user's own OpenRouter key. Trigger is the TUFFUI agent-composer model button,
// the list is the composer's suggestion menu (https://tuffui.com · MIT · Copyright (c) 2026 TUFFUI contributors).

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAiConfig } from "../../hooks/use-ai-config";

const POPULAR_MODELS = [
  { name: "GPT-5", slug: "openai/gpt-5" },
  { name: "GPT-5 Mini", slug: "openai/gpt-5-mini" },
  { name: "GPT-4o Mini", slug: "openai/gpt-4o-mini" },
  { name: "GPT OSS 120B", slug: "openai/gpt-oss-120b" },
  { name: "Claude Sonnet 4", slug: "anthropic/claude-sonnet-4" },
  { name: "Claude 3.7 Sonnet", slug: "anthropic/claude-3.7-sonnet" },
  { name: "Gemini 2.5 Flash", slug: "google/gemini-2.5-flash" },
  { name: "Gemini 2.5 Pro", slug: "google/gemini-2.5-pro" },
];

interface AIModelSelectorProps {
  disabled?: boolean;
}

export function AIModelSelector({ disabled = false }: AIModelSelectorProps) {
  const { config, setConfig } = useAiConfig();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const currentModel = config.keyMode === "local"
    ? config.localKeys?.model || "openai/gpt-4o-mini"
    : null;

  const handleModelChange = (modelSlug: string) => {
    if (config.keyMode !== "local") return;

    setConfig({
      ...config,
      localKeys: {
        provider: config.localKeys?.provider || "openrouter",
        apiKey: config.localKeys?.apiKey || "",
        model: modelSlug,
        maxTokens: config.localKeys?.maxTokens || "4000",
        customEndpoint: config.localKeys?.customEndpoint,
      },
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsDropdownOpen(false);
    }
  };

  return (
    <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Model"
          title={currentModel ?? undefined}
          className="flex h-7 min-w-0 shrink items-center gap-1 rounded-md px-1.5 font-mono text-xs text-muted-foreground transition-[color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 data-[state=open]:text-foreground"
        >
          <span className="truncate">{currentModel}</span>
          <ChevronDown strokeWidth={2.5} className="size-3 shrink-0" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-[1.375rem] p-1.5" align="end" side="top" sideOffset={8}>
        <Input
          aria-label="Model slug"
          placeholder="provider/model"
          value={inputValue}
          onChange={(e) => {
            const value = e.target.value;
            setInputValue(value);
            handleModelChange(value);
          }}
          onKeyDown={handleInputKeyDown}
          className="mb-1.5 h-9 rounded-xl font-mono text-[13px]"
        />
        <ul aria-label="Models" className="max-h-[280px] overflow-y-auto">
          {POPULAR_MODELS.map((model) => (
            <li key={model.slug}>
              <button
                type="button"
                aria-pressed={model.slug === currentModel}
                onClick={() => {
                  handleModelChange(model.slug);
                  setInputValue("");
                  setIsDropdownOpen(false);
                }}
                className="flex w-full items-baseline gap-3 rounded-xl px-3 py-2 text-start text-[0.8125rem] text-[var(--ks-ink)] hover:bg-foreground/[0.07] focus-visible:bg-foreground/[0.07] focus-visible:outline-none aria-pressed:bg-foreground/[0.07]"
              >
                <bdi className="truncate font-mono">{model.slug}</bdi>
                <span className="ms-auto shrink-0 text-xs text-muted-foreground">{model.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
