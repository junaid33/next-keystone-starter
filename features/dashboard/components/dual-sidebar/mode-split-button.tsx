"use client";

// The row above the message box, as in TUFFUI agent-composer: key source on the start side,
// key settings and the model on the end side (own key only).

import { ConfigToggleButton } from "./config-toggle-button";
import { SimpleSettingsPopover } from "./simple-settings-popover";
import { AIModelSelector } from "./ai-model-selector";
import { useAiConfig } from "../../hooks/use-ai-config";

interface ModeSplitButtonProps {
  disabled?: boolean;
}

export function ModeSplitButton({
  disabled = false,
}: ModeSplitButtonProps) {
  const { config: aiConfig } = useAiConfig();
  const isGlobalMode = aiConfig.keyMode === "env";

  return (
    <div className="flex min-w-0 items-center gap-2 px-1 pt-0.5 pb-2">
      <ConfigToggleButton disabled={disabled} />
      {!isGlobalMode && (
        <div className="ms-auto flex min-w-0 items-center gap-1">
          <AIModelSelector disabled={disabled} />
          <SimpleSettingsPopover disabled={disabled} />
        </div>
      )}
    </div>
  );
}
