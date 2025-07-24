'use client';

import { useState, useRef, useEffect, useId } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { RefreshCcwIcon, AlertTriangleIcon } from 'lucide-react';

// UI Components that would typically be in separate files
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Types
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// AI Chat Configuration Types
interface AiChatConfig {
  enabled: boolean;
  onboarded: boolean;
  keyMode: 'env' | 'local';
  localKeys?: {
    apiKey: string;
    model: string;
    maxTokens: string;
  };
}

// LocalStorage Manager
class AiChatStorage {
  static getConfig(): AiChatConfig {
    const enabled = localStorage.getItem('aiChatEnabled') === 'true';
    const onboarded = localStorage.getItem('aiChatOnboarded') === 'true';
    const keyMode = (localStorage.getItem('aiKeyMode') as 'env' | 'local') || 'env';
    
    const localKeys = keyMode === 'local' ? {
      apiKey: localStorage.getItem('openRouterApiKey') || '',
      model: localStorage.getItem('openRouterModel') || 'openai/gpt-4o',
      maxTokens: localStorage.getItem('openRouterMaxTokens') || '4000'
    } : undefined;

    return { enabled, onboarded, keyMode, localKeys };
  }

  static saveConfig(config: Partial<AiChatConfig>) {
    if (config.enabled !== undefined) {
      localStorage.setItem('aiChatEnabled', config.enabled.toString());
    }
    if (config.onboarded !== undefined) {
      localStorage.setItem('aiChatOnboarded', config.onboarded.toString());
    }
    if (config.keyMode !== undefined) {
      localStorage.setItem('aiKeyMode', config.keyMode);
    }
    if (config.localKeys) {
      localStorage.setItem('openRouterApiKey', config.localKeys.apiKey);
      localStorage.setItem('openRouterModel', config.localKeys.model);
      localStorage.setItem('openRouterMaxTokens', config.localKeys.maxTokens);
    }
  }

  static clearConfig() {
    localStorage.removeItem('aiChatEnabled');
    localStorage.removeItem('aiChatOnboarded');
    localStorage.removeItem('aiKeyMode');
    localStorage.removeItem('openRouterApiKey');
    localStorage.removeItem('openRouterModel');
    localStorage.removeItem('openRouterMaxTokens');
  }
}

const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
);

const Select = ({ 
  value, 
  onValueChange, 
  children, 
  className = '', 
  ...props 
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'>) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className={cn(
      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </select>
);

const Label = ({ className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
);


// AI Chat Configuration Dialog
function AiChatOnboarding({ 
  open, 
  onComplete,
  envKeysAvailable 
}: {
  open: boolean;
  onComplete: (config: { enabled: boolean; keyMode: 'env' | 'local'; localKeys?: { apiKey: string; model: string; maxTokens: string } }) => void;
  envKeysAvailable: boolean;
}) {
  const id = useId();
  const [keyMode, setKeyMode] = useState<'env' | 'local'>(envKeysAvailable ? 'env' : 'local');
  const [localKeys, setLocalKeys] = useState({
    apiKey: '',
    model: 'openai/gpt-4o',
    maxTokens: '4000'
  });
  const [confirmationText, setConfirmationText] = useState('');

  const handleSubmit = () => {
    if (confirmationText !== 'I understand the risks') return;
    
    const config = {
      enabled: true,
      keyMode,
      localKeys: keyMode === 'local' ? localKeys : undefined
    };
    onComplete(config);
  };

  const canSubmit = () => {
    if (keyMode === 'local' && !localKeys.apiKey) return false;
    return confirmationText === 'I understand the risks';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button 
          onClick={() => onComplete({ enabled: false, keyMode: 'env' })}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <div className="mb-2 flex flex-col gap-2">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <RefreshCcwIcon className="opacity-80" size={16} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-left mb-2">Configure your AI assistant</h2>
              <p className="text-gray-600 text-left text-sm">
                Welcome to your AI assistant. You can use this assistant to interact with your data, create new items, delete items, update items.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="gap-2 space-y-2">
              {/* Shared Keys Radio Card */}
              <div className={`border-input has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent relative flex w-full items-center gap-2 rounded-md border px-4 py-3 shadow-xs outline-none ${
                !envKeysAvailable ? 'opacity-50' : ''
              }`}>
                <input
                  type="radio"
                  name="keyMode"
                  value="env"
                  checked={keyMode === 'env'}
                  onChange={() => envKeysAvailable && setKeyMode('env')}
                  disabled={!envKeysAvailable}
                  id={`${id}-env`}
                  aria-describedby={`${id}-env-description`}
                  className="order-1 after:absolute after:inset-0"
                />
                <div className="grid grow gap-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${id}-env`}>Shared Keys</Label>
                    {!envKeysAvailable && (
                      <AlertTriangleIcon className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <p
                    id={`${id}-env-description`}
                    className="text-muted-foreground text-xs"
                  >
                    {envKeysAvailable 
                      ? 'Use organization-managed API keys' 
                      : 'Admin user needs to add ENV values to use shared keys'
                    }
                  </p>
                </div>
              </div>

              {/* Personal Keys Radio Card */}
              <div className="border-input has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent relative flex w-full items-center gap-2 rounded-md border px-4 py-3 shadow-xs outline-none">
                <input
                  type="radio"
                  name="keyMode"
                  value="local"
                  checked={keyMode === 'local'}
                  onChange={() => setKeyMode('local')}
                  id={`${id}-local`}
                  aria-describedby={`${id}-local-description`}
                  className="order-1 after:absolute after:inset-0"
                />
                <div className="grid grow gap-1">
                  <Label htmlFor={`${id}-local`}>Personal Keys</Label>
                  <p
                    id={`${id}-local-description`}
                    className="text-muted-foreground text-xs"
                  >
                    Configure your own OpenRouter API keys
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Keys Configuration - Separate Card */}
            {keyMode === 'local' && (
              <div className="border rounded-md p-4 space-y-4">
                <div>
                  <Label htmlFor="apiKey" className="text-sm font-medium">OpenRouter API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={localKeys.apiKey}
                    onChange={(e) => setLocalKeys({...localKeys, apiKey: e.target.value})}
                    placeholder="sk-or-..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="model" className="text-sm font-medium">Model</Label>
                  <Select 
                    value={localKeys.model} 
                    onValueChange={(value) => setLocalKeys({...localKeys, model: value})}
                    className="mt-1"
                  >
                    <option value="openai/gpt-4o">GPT-4O (OpenAI)</option>
                    <option value="openai/gpt-4o-mini">GPT-4O Mini (OpenAI)</option>
                    <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                    <option value="anthropic/claude-3-haiku">Claude 3 Haiku (Anthropic)</option>
                    <option value="google/gemini-pro">Gemini Pro (Google)</option>
                  </Select>
                </div>
              </div>
            )}

            {/* Danger Zone - Warning Card */}
            <div className="border border-destructive/50 bg-destructive/5 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="font-medium text-sm text-destructive mb-2">Be very careful when using this AI assistant</h3>
                  <p className="text-xs text-destructive/90">
                    It can do everything you can do since it uses the same session. We highly recommend you back up your database daily if you're using the AI assistant.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Input - Outside the warning card */}
            <div className="space-y-2">
              <Label htmlFor="confirmation" className="text-sm font-medium text-gray-900">
                Type "I understand the risks" to continue:
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="I understand the risks"
                className=""
              />
            </div>

            <div className="grid gap-2">
              <Button 
                onClick={handleSubmit}
                variant="destructive"
                className="w-full"
                disabled={!canSubmit()}
              >
                I understand the consequences, turn on AI Chat
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onComplete({ enabled: false, keyMode: 'env' })}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Local Keys Modal
const LocalKeysModal = ({ 
  open, 
  onOpenChange, 
  initialKeys, 
  onSave 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKeys?: {
    apiKey: string;
    model: string;
    maxTokens: string;
  };
  onSave: (keys: { apiKey: string; model: string; maxTokens: string }) => void;
}) => {
  const [apiKey, setApiKey] = useState(initialKeys?.apiKey || '');
  const [model, setModel] = useState(initialKeys?.model || 'openai/gpt-4o');
  const [maxTokens, setMaxTokens] = useState(initialKeys?.maxTokens || '4000');

  const handleSave = () => {
    onSave({ apiKey, model, maxTokens });
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Configure API Keys</h2>
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="apiKey">OpenRouter API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
            />
          </div>
          <div>
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <option value="openai/gpt-4o">GPT-4O (OpenAI)</option>
              <option value="openai/gpt-4o-mini">GPT-4O Mini (OpenAI)</option>
              <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
              <option value="anthropic/claude-3-haiku">Claude 3 Haiku (Anthropic)</option>
              <option value="google/gemini-pro">Gemini Pro (Google)</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              placeholder="4000"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!apiKey}>
            Save Keys
          </Button>
        </div>
      </div>
    </div>
  );
};

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
      </div>
    </article>
  );
}

function Chat({ envKeysAvailable }: { envKeysAvailable: boolean }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiChatConfig | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLocalKeysModal, setShowLocalKeysModal] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load AI config on component mount
  useEffect(() => {
    const config = AiChatStorage.getConfig();
    setAiConfig(config);
    
    // Show onboarding if not onboarded
    if (!config.onboarded) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle onboarding completion
  const handleOnboardingComplete = (config: { enabled: boolean; keyMode: 'env' | 'local'; localKeys?: { apiKey: string; model: string; maxTokens: string } }) => {
    const newConfig: AiChatConfig = {
      enabled: config.enabled,
      onboarded: true,
      keyMode: config.keyMode,
      localKeys: config.localKeys
    };
    
    AiChatStorage.saveConfig(newConfig);
    setAiConfig(newConfig);
    setShowOnboarding(false);
  };

  const handleLocalKeysSave = (keys: { apiKey: string; model: string; maxTokens: string }) => {
    const newConfig: AiChatConfig = {
      enabled: true,
      onboarded: true,
      keyMode: 'local',
      localKeys: keys
    };
    
    AiChatStorage.saveConfig(newConfig);
    setAiConfig(newConfig);
  };

  const handleSettingsAction = (action: string) => {
    setShowSettingsDropdown(false);
    
    switch (action) {
      case 'reconfigure':
        if (aiConfig?.keyMode === 'local') {
          setShowLocalKeysModal(true);
        }
        break;
      case 'restart':
        const clearedConfig = { ...AiChatStorage.getConfig(), onboarded: false };
        AiChatStorage.saveConfig(clearedConfig);
        setAiConfig(clearedConfig);
        setShowOnboarding(true);
        break;
      case 'disable':
        AiChatStorage.clearConfig();
        setAiConfig(AiChatStorage.getConfig());
        break;
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || !aiConfig?.enabled) return;
    
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

      // Prepare API configuration
      let apiConfig = {};
      if (aiConfig?.keyMode === 'local' && aiConfig.localKeys) {
        apiConfig = {
          useLocalKeys: true,
          apiKey: aiConfig.localKeys.apiKey,
          model: aiConfig.localKeys.model,
          maxTokens: parseInt(aiConfig.localKeys.maxTokens)
        };
      }

      const res = await fetch('/api/completion-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: currentInput,
          messages: conversationHistory,
          ...apiConfig
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

  const isAiChatReady = aiConfig?.enabled && aiConfig?.onboarded;

  return (
    <>
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
              {isAiChatReady && (
                <div className="relative">
                  <button
                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    ⚙️
                  </button>
                  
                  {showSettingsDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleSettingsAction('reconfigure')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {aiConfig?.keyMode === 'local' ? 'Update API Keys' : 'Settings'}
                        </button>
                        <button
                          onClick={() => handleSettingsAction('restart')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Restart Setup
                        </button>
                        <button
                          onClick={() => handleSettingsAction('disable')}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Disable AI Chat
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
        {isAiChatReady && (
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
        )}
      </div>
      
      <AiChatOnboarding 
        open={showOnboarding} 
        onComplete={handleOnboardingComplete}
        envKeysAvailable={envKeysAvailable}
      />
      
      <LocalKeysModal
        open={showLocalKeysModal}
        onOpenChange={setShowLocalKeysModal}
        initialKeys={aiConfig?.localKeys}
        onSave={handleLocalKeysSave}
      />
    </>
  );
}

interface AiChatClientProps {
  envKeysAvailable: boolean;
}

export function AiChatClient({ envKeysAvailable }: AiChatClientProps) {
  return (
    <div className="h-screen bg-gray-50">
      <Chat envKeysAvailable={envKeysAvailable} />
    </div>
  );
}