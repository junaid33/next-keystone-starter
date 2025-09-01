// Shared LocalStorage Manager for AI Chat Configuration
export interface AiChatConfig {
  enabled: boolean;
  onboarded: boolean;
  keyMode: "env" | "local";
  localKeys?: {
    apiKey: string;
    model: string;
    maxTokens: string;
  };
  chatMode?: "sidebar" | "chatbox";
}

export class AiChatStorage {
  static getConfig(): AiChatConfig {
    const enabled = localStorage.getItem("aiChatEnabled") === "true";
    const onboarded = localStorage.getItem("aiChatOnboarded") === "true";
    const keyMode =
      (localStorage.getItem("aiKeyMode") as "env" | "local") || "env";
    const chatMode =
      (localStorage.getItem("aiChatMode") as "sidebar" | "chatbox") || "chatbox";

    const localKeys =
      keyMode === "local"
        ? {
            apiKey: localStorage.getItem("openRouterApiKey") || "",
            model:
              localStorage.getItem("openRouterModel") || "openai/gpt-4o-mini",
            maxTokens: localStorage.getItem("openRouterMaxTokens") || "4000",
          }
        : undefined;

    return { enabled, onboarded, keyMode, localKeys, chatMode };
  }

  static saveConfig(config: Partial<AiChatConfig>) {
    if (config.enabled !== undefined) {
      localStorage.setItem("aiChatEnabled", config.enabled.toString());
    }
    if (config.onboarded !== undefined) {
      localStorage.setItem("aiChatOnboarded", config.onboarded.toString());
    }
    if (config.keyMode !== undefined) {
      localStorage.setItem("aiKeyMode", config.keyMode);
    }
    if (config.localKeys) {
      localStorage.setItem("openRouterApiKey", config.localKeys.apiKey);
      localStorage.setItem("openRouterModel", config.localKeys.model);
      localStorage.setItem("openRouterMaxTokens", config.localKeys.maxTokens);
    }
  }
}