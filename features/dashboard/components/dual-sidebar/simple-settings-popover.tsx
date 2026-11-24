"use client";

// Own-key settings. Same fields and save as before; trigger is a TUFFUI quiet IconButton,
// the panel uses the dashboard popover, field and pill styles.

import { Settings2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAiConfig } from "../../hooks/use-ai-config";
import { IconButton } from "./tuff-primitives";

interface SimpleSettingsPopoverProps {
  disabled?: boolean;
}

const PROVIDERS = [
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom", label: "Custom" },
];

export function SimpleSettingsPopover({ disabled = false }: SimpleSettingsPopoverProps) {
  const [open, setOpen] = useState(false);
  const { config, setConfig } = useAiConfig();
  const [provider, setProvider] = useState<"openrouter" | "custom">("openrouter");
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [maxTokens, setMaxTokens] = useState("4000");

  // Sync with current config when popover opens
  useEffect(() => {
    if (open) {
      const currentProvider = config.localKeys?.provider as "openrouter" | "custom" | undefined;
      setProvider(currentProvider || "openrouter");
      setCustomEndpoint(config.localKeys?.customEndpoint || "");
      setApiKey(config.localKeys?.apiKey || "");
      setMaxTokens(config.localKeys?.maxTokens || "4000");
    }
  }, [open, config]);

  const handleSave = () => {
    const finalApiKey = apiKey || config.localKeys?.apiKey || "";
    setConfig({
      ...config,
      localKeys: {
        provider,
        customEndpoint,
        apiKey: finalApiKey,
        model: config.localKeys?.model || "openai/gpt-4o-mini",
        maxTokens,
      },
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton icon={Settings2} label="Key settings" disabled={disabled} className="size-7" />
      </PopoverTrigger>
      <PopoverContent className="w-[min(320px,calc(100vw-24px))] p-0" align="end" side="top" sideOffset={8}>
        <div className="flex flex-col gap-3 p-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-provider" className="ks-label">
              Provider
            </Label>
            <Select value={provider} onValueChange={(value: "openrouter" | "custom") => setProvider(value)}>
              <SelectTrigger id="ai-provider" className="h-8 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {provider === "custom" && (
              <Input
                aria-label="Endpoint"
                placeholder="https://api.example.com/v1"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-api-key" className="ks-label">
              API key
            </Label>
            <Input
              id="ai-api-key"
              type="text"
              autoComplete="off"
              placeholder={provider === "custom" ? "Key" : "sk-or-v1-…"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-[12px] text-[var(--ks-label)]">Stored in this browser</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-max-tokens" className="ks-label">
              Max tokens
            </Label>
            <Select value={maxTokens} onValueChange={setMaxTokens}>
              <SelectTrigger id="ai-max-tokens" className="h-8 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2000">2,000</SelectItem>
                <SelectItem value="4000">4,000</SelectItem>
                <SelectItem value="8000">8,000</SelectItem>
                <SelectItem value="16000">16,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end border-t border-[var(--ks-line)] px-3 py-2.5">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!apiKey && !config.localKeys?.apiKey}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
