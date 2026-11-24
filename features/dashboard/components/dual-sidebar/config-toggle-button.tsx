"use client";

// Key source as a TUFFUI segmented control: the server's OpenRouter key (env) or the user's own (local).
// Same setting as before: config.keyMode, saved by useAiConfig.

import { useAiConfig } from "../../hooks/use-ai-config";
import { Segmented } from "./tuff-primitives";

interface ConfigToggleButtonProps {
  disabled?: boolean;
}

export function ConfigToggleButton({ disabled = false }: ConfigToggleButtonProps) {
  const { config, setConfig } = useAiConfig();

  return (
    <Segmented
      label="Key"
      className="h-7 shrink-0"
      disabled={disabled}
      options={[
        { value: "env", label: "Shared key" },
        { value: "local", label: "Own key" },
      ]}
      value={config.keyMode}
      onValueChange={(keyMode) => setConfig({ ...config, keyMode })}
    />
  );
}
