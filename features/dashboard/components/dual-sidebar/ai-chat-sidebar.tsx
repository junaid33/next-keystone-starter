"use client";

// Layout follows TUFFUI ai-chat, chat-thread, streaming-message and agent-composer
// (https://tuffui.com · MIT License · Copyright (c) 2026 TUFFUI contributors), restyled to the --ks-* tokens.
// Chat behaviour is unchanged: useChat → /api/completion, shared or own OpenRouter key, MCP tool calls, streaming.

import { useLayoutEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { CircleAlert, MessageSquare, X } from "lucide-react";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "./chat-container";
import { ScrollButton } from "./scroll-button";
import { cn } from "@/lib/utils";
import { ModeSplitButton } from "./mode-split-button";
import { useSidebarWithSide } from "@/components/ui/sidebar";
import { useChatMode } from "../DashboardLayout";
import { useAiConfig } from "../../hooks/use-ai-config";
import { safeErrorSummary } from "../../lib/security";
import { UserAvatar } from "../UserProfileClient";
import { AgentMark, IconButton, Spinner, Thinking } from "./tuff-primitives";
import { ToolCallBlock, type ToolCall, type ToolCallStatus } from "./tool-call-block";

const AGENT_NAME = "Assistant";

const CRUD_TOOLS = new Set(["createData", "updateData", "deleteData"]);

function getMessageText(message: UIMessage) {
  return message.parts
    ?.filter((part: any) => part.type === "text")
    .map((part: any) => part.text)
    .join("")
    .trim();
}

function responseHasCrudTool(messages: UIMessage[]) {
  return messages.some((message: any) =>
    message.role === "assistant" &&
    message.parts?.some((part: any) => {
      if (part.type === "dynamic-tool") {
        return CRUD_TOOLS.has(part.toolName);
      }
      if (typeof part.type === "string" && part.type.startsWith("tool-")) {
        return CRUD_TOOLS.has(part.type.slice(5));
      }
      if (part.type === "tool-invocation" && part.toolInvocation?.toolName) {
        return CRUD_TOOLS.has(part.toolInvocation.toolName);
      }
      return false;
    })
  );
}

/** A tool part from the UI message stream, read as a TUFFUI ToolCall. */
function toToolCall(part: any, fallbackId: string): ToolCall | null {
  const name =
    part.type === "dynamic-tool"
      ? part.toolName
      : typeof part.type === "string" && part.type.startsWith("tool-")
        ? part.type.slice(5)
        : null;
  if (!name) return null;
  const state: string = part.state ?? "";
  const outputText = (() => {
    const content = (part.output as any)?.content;
    return Array.isArray(content) && content.every((c: any) => c?.type === "text")
      ? content.map((c: any) => c.text).join("\n")
      : undefined;
  })();
  // A failed run comes back as a normal MCP result: { isError: true } or, from our
  // /api/mcp-transport route, text starting "Error executing <tool>:".
  const mcpError =
    state === "output-available" &&
    ((part.output as any)?.isError === true || !!outputText?.startsWith(`Error executing ${name}:`));
  const status: ToolCallStatus =
    mcpError
      ? "error"
      : state === "output-available"
      ? "success"
      : state === "output-error" || state === "output-denied"
        ? "error"
        : state.startsWith("approval")
          ? "pending"
          : "running";
  const input = part.input && typeof part.input === "object" ? part.input : {};
  let result: ToolCall["result"];
  if (status === "success" && part.output !== undefined) {
    if (outputText !== undefined) {
      result = outputText;
    } else if (typeof part.output === "string") {
      result = part.output;
    } else {
      result = part.output as Record<string, unknown>;
    }
  }
  return {
    id: part.toolCallId ?? fallbackId,
    name,
    args: input as Record<string, unknown>,
    status,
    result,
    error: mcpError ? outputText : part.errorText,
  };
}

/** TUFFUI streaming-message Content metrics, rendered through react-markdown. */
function Markdown({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-3 leading-6 text-pretty break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p: ({ children }) => <p dir="auto">{children}</p>,
          ul: ({ children }) => <ul className="flex list-disc flex-col gap-1 ps-5 marker:text-[var(--ks-label)]">{children}</ul>,
          ol: ({ children }) => <ol className="flex list-decimal flex-col gap-1 ps-5 marker:text-[var(--ks-label)]">{children}</ol>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-[var(--ks-accent-ink)] underline-offset-4 hover:underline">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code dir="ltr" className="rounded-md bg-foreground/[0.07] px-1 py-px font-mono text-[0.75rem] break-all">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-xl bg-foreground/[0.04] px-3 py-2.5 font-mono text-xs leading-5 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-xs [&>code]:break-normal"
            >
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-xl bg-foreground/[0.04]">
              <table className="w-full text-[0.8125rem]">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="px-3 py-1.5 text-start font-medium text-muted-foreground">{children}</th>,
          td: ({ children }) => <td className="border-t border-[var(--ks-line)] px-3 py-1.5">{children}</td>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

/** One turn, TUFFUI chat-thread article markup (default density). */
function Turn({
  role,
  name,
  avatar,
  first,
  children,
}: {
  role: "user" | "assistant";
  name: string;
  avatar: React.ReactNode;
  first: boolean;
  children: React.ReactNode;
}) {
  const user = role === "user";
  return (
    <article aria-label={name} className={cn("group flex gap-2.5", user && "flex-row-reverse", !first && "mt-4")}>
      {avatar}
      <div
        className={cn(
          "flex min-w-0 flex-col gap-1",
          user ? "max-w-[80%] items-end" : "max-w-[92%] flex-1 items-stretch"
        )}
      >
        <p className={cn("flex items-baseline gap-2 text-[0.8125rem]", user && "flex-row-reverse")}>
          <span className="font-medium text-[var(--ks-ink)]">{name}</span>
        </p>
        <div
          className={cn(
            "max-w-full text-sm leading-relaxed text-[var(--ks-ink)]",
            user && "ks-raised rounded-2xl rounded-se-md px-3.5 py-2 whitespace-pre-wrap break-words"
          )}
        >
          {children}
        </div>
      </div>
    </article>
  );
}

export function AiChatSidebar() {
  const { toggleSidebar } = useSidebarWithSide("right");
  const { user } = useChatMode();
  const { config: aiConfig } = useAiConfig();
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/completion",
      credentials: "include",
    }),
    onFinish: ({ messages }) => {
      if (responseHasCrudTool(messages as UIMessage[])) {
        queryClient.invalidateQueries();
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // TUFFUI agent-composer: the box grows with its text up to 180px.
  useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");

    try {
      if (aiConfig.keyMode === "local") {
        if (!aiConfig.localKeys?.apiKey || !aiConfig.localKeys?.model) {
          throw new Error("Local API key and model are required. Please configure them in settings.");
        }

        await sendMessage(
          { text },
          {
            body: {
              useLocalKeys: true,
              apiKey: aiConfig.localKeys.apiKey,
              model: aiConfig.localKeys.model,
              maxTokens: parseInt(aiConfig.localKeys.maxTokens || "4000", 10),
            },
          }
        );

        return;
      }

      await sendMessage(
        { text },
        {
          body: {
            useLocalKeys: false,
          },
        }
      );
    } catch (submitError) {
      setInput(text);
      console.error("Chat submit error:", safeErrorSummary(submitError));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const userName = user?.name || user?.email || "You";
  const userAvatar = <UserAvatar user={{ name: user?.name, email: user?.email }} />;
  const last = messages[messages.length - 1];
  const waitingForReply = isLoading && last?.role === "user";
  const empty = messages.length === 0;

  return (
    <div className="@container flex h-full flex-col bg-[var(--ks-page)] text-[var(--ks-ink)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-3 pt-2 @md:px-5">
        <AgentMark />
        <h2 className="min-w-0 truncate text-[0.9375rem] font-medium">{AGENT_NAME}</h2>
        <div className="ms-auto flex items-center gap-1.5">
          <IconButton icon={X} label="Close" onClick={toggleSidebar} />
        </div>
      </header>

      <ChatContainerRoot className="relative min-h-0 flex-1 overscroll-contain" aria-label="Conversation" aria-busy={isLoading || undefined}>
        <ChatContainerContent className={cn("gap-1.5 px-4 py-5 @md:px-5", empty && "min-h-full justify-center")}>
          {empty ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div
                aria-hidden="true"
                className="mb-4 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-foreground/[0.06] text-muted-foreground"
              >
                <MessageSquare fill="currentColor" strokeWidth={1.5} className="size-5" />
              </div>
              <p className="text-[0.9375rem] font-medium">No messages</p>
            </div>
          ) : (
            messages.map((message, i) => {
              if (message.role === "user") {
                return (
                  <Turn key={message.id} role="user" name={userName} avatar={userAvatar} first={i === 0}>
                    <p dir="auto">{getMessageText(message as UIMessage)}</p>
                  </Turn>
                );
              }

              const parts = (message.parts ?? []) as any[];
              const streamingThis = isLoading && message.id === last?.id;
              const blocks = parts
                .map((part, p) => {
                  if (part.type === "text") {
                    return part.text?.trim() ? <Markdown key={p} text={part.text} /> : null;
                  }
                  const call = toToolCall(part, `${message.id}-${p}`);
                  return call ? <ToolCallBlock key={call.id} data={call} /> : null;
                })
                .filter(Boolean);
              const lastPart = [...parts].reverse().find((part) => part.type !== "step-start");
              const showThinking = streamingThis && (blocks.length === 0 || lastPart?.type !== "text");

              return (
                <Turn key={message.id} role="assistant" name={AGENT_NAME} avatar={<AgentMark />} first={i === 0}>
                  <div className="flex flex-col gap-2">
                    {blocks}
                    {showThinking && <Thinking className="h-6" />}
                  </div>
                </Turn>
              );
            })
          )}

          {waitingForReply && (
            <Turn role="assistant" name={AGENT_NAME} avatar={<AgentMark />} first={false}>
              <Thinking className="h-6" />
            </Turn>
          )}

          {error && (
            <div role="alert" className="mt-3 flex items-center gap-2.5 rounded-2xl bg-[color-mix(in_oklab,var(--ks-red)_10%,transparent)] py-2 ps-3.5 pe-2">
              <CircleAlert className="size-4 shrink-0 text-[var(--ks-red)]" aria-hidden="true" />
              <p className="flex-1 text-[0.8125rem] font-medium text-[var(--ks-red)]">Request failed</p>
            </div>
          )}

          <ChatContainerScrollAnchor />
        </ChatContainerContent>

        {!empty && <ScrollButton />}
      </ChatContainerRoot>

      <div className="relative z-10 shrink-0 px-3 pt-1 pb-3 before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-[var(--ks-page)] before:to-transparent @md:px-5 @md:pb-5">
        <div className="relative rounded-[1.375rem] bg-[var(--ks-track)] p-1.5 shadow-[var(--ks-recess)]">
          <ModeSplitButton disabled={isLoading} />
          <div className="relative rounded-2xl bg-[var(--ks-surface)] shadow-[var(--ks-raised-shadow)]">
            <label htmlFor="assistant-input" className="sr-only">
              Message
            </label>
            <textarea
              ref={textarea}
              id="assistant-input"
              dir="auto"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={empty ? "Ask anything" : "Reply"}
              disabled={isLoading}
              className="block max-h-[180px] min-h-16 w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm leading-6 text-[var(--ks-ink)] outline-none placeholder:text-[var(--ks-label)] disabled:opacity-60"
            />
            <div className="flex items-center gap-2 ps-4 pe-2 pb-2">
              <p className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-xs text-muted-foreground">
                {isLoading && (
                  <>
                    <Spinner label="Assistant working" className="text-[var(--ks-accent-ink)]" />
                    Working
                  </>
                )}
              </p>
              <button
                type="button"
                data-variant="primary"
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="ks-pill h-8 gap-2 rounded-full px-3.5 text-[0.8125rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ks-focus)]"
              >
                Send
                <kbd
                  aria-hidden="true"
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-current/15 px-1 font-sans text-[12px] font-medium opacity-80"
                >
                  ↵
                </kbd>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
