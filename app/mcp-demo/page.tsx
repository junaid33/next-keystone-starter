'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { StickToBottom } from 'use-stick-to-bottom';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

function ChatMessage({ message }: { message: Message }) {
  return (
    <article className={`flex items-start gap-4 text-[15px] leading-relaxed ${message.isUser ? 'justify-end' : ''}`}>
      <div className={`rounded-full w-10 h-10 flex items-center justify-center text-white font-medium text-sm ${
        message.isUser 
          ? 'bg-gradient-to-t from-green-700 to-green-600 order-1' 
          : 'bg-gradient-to-t from-indigo-700 to-indigo-600 border border-gray-200 shadow-sm'
      }`}>
        {message.isUser ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </div>
      <div className="bg-gray-100 px-4 py-3 rounded-xl space-y-4">
        <div className="flex flex-col gap-3">
          <p className="sr-only">{message.isUser ? 'You' : 'AI'} said:</p>
          {message.isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="w-full">
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
            </div>
          )}
        </div>
        {!message.isUser && (
          <div className="relative inline-flex bg-white rounded-md border border-gray-200 shadow-sm">
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors size-8 flex items-center justify-center first:rounded-l-lg last:rounded-r-lg focus-visible:z-10 outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="sr-only">Copy</span>
            </button>
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors size-8 flex items-center justify-center border-l border-gray-200 focus-visible:z-10 outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="sr-only">Like</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function MCPDemoPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

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
      const res = await fetch('/api/completion-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: currentInput }),
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-5">
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

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col bg-white rounded-tl-3xl shadow-sm">
          <StickToBottom 
            className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8"
            resize="smooth"
            initial="instant"
            role="log"
          >
            <StickToBottom.Content className="flex w-full flex-col">
              <div className="py-6">
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
                        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Today
                      </div>
                    </div>
                    <div className="space-y-6">
                      {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                      ))}
                    </div>
                  </>
                )}
                <div className="h-px w-full shrink-0 scroll-mt-4" aria-hidden="true" />
              </div>
            </StickToBottom.Content>
          </StickToBottom>

          {/* Input Area */}
          <div className="px-4 md:px-6 lg:px-8 py-4 md:py-8">
            <div>
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
                    <button className="rounded-full w-8 h-8 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm transition-all">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="sr-only">Attach</span>
                    </button>
                    <button className="rounded-full w-8 h-8 flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm transition-all">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="sr-only">Audio</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !input.trim()}
                      className="bg-gradient-to-t from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1"
                    >
                      {loading ? 'Sending...' : 'Send'}
                      <svg 
                        className="w-3 h-3"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}