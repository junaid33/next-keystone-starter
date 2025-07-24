import { AiChatClient } from './client';

// Server Component - checks ENV keys on server side
export default async function AiChatPage() {
  // Check if OpenRouter API key exists in environment
  const envKeysAvailable = !!process.env.OPENROUTER_API_KEY;

  return <AiChatClient envKeysAvailable={envKeysAvailable} />;
}