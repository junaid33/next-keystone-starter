'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

// UI Components that would typically be in separate files
import { cn } from '@/lib/utils';

// Types
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// Components

function ChatMessage({ isUser, children }: { isUser?: boolean; children: React.ReactNode }) {
  return (
    <article className={`flex items-start gap-4 text-[15px] leading-relaxed ${isUser ? 'justify-end' : ''}`}>
      <img
        className={cn(
          'rounded-full',
          isUser ? 'order-1' : 'border border-black/[0.08] shadow-sm'
        )}
        src={
          isUser
            ? 'https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/user-02_mlqqqt.png'
            : 'https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/user-01_i5l7tp.png'
        }
        alt={isUser ? 'User profile' : 'Bart logo'}
        width={40}
        height={40}
      />
      <div className={cn(isUser ? 'bg-gray-100 px-4 py-3 rounded-xl' : 'space-y-4')}>
        <div className="flex flex-col gap-3">
          <p className="sr-only">{isUser ? 'You' : 'Bart'} said:</p>
          {children}
        </div>
        {/* Action buttons - commented out for now
        {!isUser && (
          <div className="relative inline-flex bg-white rounded-md border border-black/[0.08] shadow-sm -space-x-px">
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors size-8 flex items-center justify-center rounded-l-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors size-8 flex items-center justify-center border-l border-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors size-8 flex items-center justify-center border-l border-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors size-8 flex items-center justify-center border-l border-gray-200 rounded-r-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        )}
        */}
      </div>
    </article>
  );
}

function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);
    
    try {
      // Build conversation history including the new user message
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content
      }));

      const res = await fetch('/api/completion-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: currentInput,
          messages: conversationHistory 
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Error: ${error.error || error.details || 'Unknown error'}`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Error: No response body',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      let fullResponse = '';
      const decoder = new TextDecoder();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('0:')) {
            const text = line.slice(2);
            if (text.startsWith('"') && text.endsWith('"')) {
              fullResponse += JSON.parse(text);
            }
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessage.id 
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            );
          }
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full bg-white rounded-3xl shadow-sm flex flex-col">
      {/* Header */}
      <div className="py-5 px-4 md:px-6 lg:px-8 bg-white sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <nav className="flex items-center text-sm">
            <span className="text-gray-500">Playground</span>
            <span className="text-gray-300 mx-2">/</span>
            <span className="text-gray-900 font-medium">AI Chat</span>
          </nav>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Code
            </button>
            <button className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto mt-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center my-12">
                <div className="inline-flex items-center bg-white rounded-full border border-gray-200 shadow-sm text-xs font-medium py-2 px-4 text-gray-600 mb-6">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Assistant
                </div>
                <p className="text-gray-500 text-lg">Start a conversation with your AI assistant</p>
              </div>
            ) : (
              <>
                <div className="text-center my-8">
                  <div className="inline-flex items-center bg-white rounded-full border border-gray-200 shadow-sm text-xs font-medium py-1 px-3 text-gray-600">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Today
                  </div>
                </div>
                {messages.map((message) => (
                  <ChatMessage key={message.id} isUser={message.isUser}>
                    {message.isUser ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <>
                        {message.content ? (
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="mb-2 last:mb-0 pl-4">{children}</ul>,
                              ol: ({ children }) => <ol className="mb-2 last:mb-0 pl-4">{children}</ol>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children, ...props }) => {
                                if ((props as any).inline) {
                                  return <code className="bg-white px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
                                }
                                return <pre className="bg-white border border-gray-200 rounded p-3 overflow-x-auto"><code className="text-sm font-mono">{children}</code></pre>;
                              },
                              pre: ({ children }) => <div className="mb-2 last:mb-0">{children}</div>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <span>Thinking...</span>
                          </div>
                        )}
                      </>
                    )}
                  </ChatMessage>
                ))}
              </>
            )}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        </div>

      {/* Input Area */}
      <div className="sticky bottom-0 px-4 md:px-6 lg:px-8 py-4 md:py-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-[20px] border border-gray-200 bg-gray-50 transition-colors focus-within:bg-gray-100 focus-within:border-gray-300">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="flex min-h-[84px] w-full bg-transparent px-4 py-3 text-[15px] leading-relaxed text-gray-900 placeholder:text-gray-500 focus-visible:outline-none resize-none"
              disabled={loading}
              rows={3}
            />
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="flex items-center gap-2">
                <button disabled className="rounded-full w-8 h-8 flex items-center justify-center bg-white border border-gray-200 cursor-not-allowed opacity-50">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <button disabled className="rounded-full w-8 h-8 flex items-center justify-center bg-white border border-gray-200 cursor-not-allowed opacity-50">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button disabled className="rounded-full w-8 h-8 flex items-center justify-center bg-white border border-gray-200 cursor-not-allowed opacity-50">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {/* Extra button - commented out for now
                <button className="rounded-full w-8 h-8 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none">
                    <g clipPath="url(#icon-a)">
                      <path
                        fill="url(#icon-b)"
                        d="m8 .333 2.667 5 5 2.667-5 2.667-2.667 5-2.667-5L.333 8l5-2.667L8 .333Z"
                      />
                    </g>
                    <defs>
                      <linearGradient
                        id="icon-b"
                        x1="8"
                        x2="8"
                        y1=".333"
                        y2="15.667"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#FDE68A" />
                        <stop offset="1" stopColor="#F59E0B" />
                      </linearGradient>
                      <clipPath id="icon-a">
                        <path fill="#fff" d="M0 0h16v16H0z" />
                      </clipPath>
                    </defs>
                  </svg>
                </button>
                */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-t from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-full text-sm font-medium transition-all"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MCPDemoPage() {
  return (
    <div className="h-screen bg-gray-50">
      <Chat />
    </div>
  );
}