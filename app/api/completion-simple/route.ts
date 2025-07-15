import { streamText, experimental_createMCPClient } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';
import { StreamableHTTPClientTransport, StreamableHTTPClientTransportOptions } from '@modelcontextprotocol/sdk/client/streamableHttp';

// Cookie-aware transport that properly handles cookie forwarding
class CookieAwareTransport extends StreamableHTTPClientTransport {
  private cookies: string[] = [];
  private originalFetch: typeof fetch;

  constructor(url: URL, opts?: StreamableHTTPClientTransportOptions, cookies?: string) {
    super(url, opts);
    
    this.originalFetch = global.fetch;
    
    // Set initial cookies if provided
    if (cookies) {
      this.cookies = [cookies];
    }
    
    // Override global fetch to include cookies
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      init = init || {};
      const headers = new Headers(init.headers);
      
      if (this.cookies.length > 0) {
        headers.set('Cookie', this.cookies.join('; '));
      }
      
      init.headers = headers;
      
      const response = await this.originalFetch(input, init);
      
      // Store any new cookies from response
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        const newCookies = setCookieHeader.split(',').map(cookie => cookie.trim());
        this.cookies = [...this.cookies, ...newCookies];
      }
      
      return response;
    };
  }
  
  async close(): Promise<void> {
    // Restore original fetch
    global.fetch = this.originalFetch;
    this.cookies = [];
    await super.close();
  }
}

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export async function POST(req: Request) {
  let mcpClient: any = null;
  
  try {
    const body = await req.json();
    const prompt = body.prompt || body.messages?.[body.messages.length - 1]?.content || '';

    // Get dynamic base URL
    const baseUrl = await getBaseUrl();
    const mcpEndpoint = `${baseUrl}/api/mcp-transport-simple/http`;
    
    const cookie = req.headers.get('cookie') || '';

    // Create MCP client
    const transport = new CookieAwareTransport(
      new URL(mcpEndpoint),
      {},
      cookie
    );
    
    mcpClient = await experimental_createMCPClient({
      transport,
    });
    
    const aiTools = await mcpClient.tools();
    
    const systemInstructions = `You are an AI assistant that queries GraphQL data dynamically.

WORKFLOW for any data request:
1. Use searchModels to find the right model/operation
2. Use getFieldsForType to discover available fields
3. For relationship fields, ALSO use getFieldsForType on the related type to see what fields are available
4. Use queryData with the discovered operation and relevant fields (including sub-selections for relationships)

RELATIONSHIP HANDLING:
- If getFieldsForType shows a relationship field (like "productVariants" on Product), also call getFieldsForType("ProductVariant") 
- Include relationships with sub-selections: fields="id title productVariants { id name price }"
- For single relationships: fields="id name user { email name }"
- For list relationships: fields="id title variants { id name price }"

EXAMPLES:
- "List all todos" → searchModels("todo") → getFieldsForType("Todo") → queryData(operation="todos", fields="id title status")
- "Show all users" → searchModels("user") → getFieldsForType("User") → queryData(operation="users", fields="id name email")
- "Get product variants for products" → searchModels("product") → getFieldsForType("Product") → getFieldsForType("ProductVariant") → queryData(operation="products", fields="id name productVariants { id title price }")

Always complete the full workflow and return actual data, not just schema discovery.`;

    const response = streamText({
      model: openrouter(process.env.OPENROUTER_MODEL ?? (() => {
        throw new Error('OPENROUTER_MODEL is not provided. Please go to openrouter.ai, find a model, copy its key and put it in the env file as OPENROUTER_MODEL variable.');
      })()),
      tools: aiTools,
      prompt,
      system: systemInstructions,
      maxSteps: 10,
      onFinish: async (result) => {
        await mcpClient.close();
      },
      onError: async (error) => {
        await mcpClient.close();
      },
    });

    return response.toDataStreamResponse();
  } catch (error) {
    // Clean up MCP client if it was created
    if (mcpClient) {
      try {
        await mcpClient.close();
      } catch (closeError) {}
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}