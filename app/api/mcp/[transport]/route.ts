import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  Tool,
  TextContent,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { 
  getIntrospectionQuery, 
  buildClientSchema, 
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInputType,
  GraphQLOutputType,
  GraphQLField,
  GraphQLArgument,
  isScalarType,
  isObjectType,
  isNonNullType,
  isListType,
  isInputObjectType,
} from 'graphql';

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'http://localhost:3003/api/graphql';
const HARDCODED_COOKIE = 'keystonejs-session=Fe26.2**15fbde5361b29b276d497363fd5a18836ceca233d3e9aae38f45c9ff74ac98b8*U_v2JeeQuZaHHS8-AwNZrQ*XoCSTlnqqwMniXTiUHSOH2EgIppNawLcb9sGrOJpGGPoQdDu-JVxxdzUW4C-Dj5FpiDRMkArgi5jHEA30e1wsQ*1783272753750*458d272569dfd0c57171dce038f181e7c3571be6e6e54cd88c23af20fa163109*_H0niIBgLFsXywY12JgLdPqmMOZd8MB06Tc7A-IL5uA';

// Types
interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  description?: string;
}

type NestedSelection = Array<[string, NestedSelection | null]>;

// Execute GraphQL query with authentication
async function executeGraphQL(query: string, variables?: any): Promise<any> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': HARDCODED_COOKIE,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL execution failed: ${JSON.stringify(result.errors)}`);
  }
  return result;
}

// Get GraphQL schema from introspection
async function getGraphQLSchema(): Promise<GraphQLSchema> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': HARDCODED_COOKIE,
    },
    body: JSON.stringify({ query: getIntrospectionQuery() }),
  });
  
  const result = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL introspection failed: ${JSON.stringify(result.errors)}`);
  }
  
  return buildClientSchema(result.data);
}

// Convert GraphQL type to JSON Schema
function convertTypeToJsonSchema(
  gqlType: GraphQLInputType,
  maxDepth: number = 3,
  currentDepth: number = 1
): JsonSchema {
  if (currentDepth > maxDepth) {
    return { type: 'object', description: 'Max depth reached' };
  }

  if (isNonNullType(gqlType)) {
    const innerSchema = convertTypeToJsonSchema(gqlType.ofType, maxDepth, currentDepth);
    (innerSchema as any).required = true;
    return innerSchema;
  }

  if (isListType(gqlType)) {
    const innerSchema = convertTypeToJsonSchema(gqlType.ofType, maxDepth, currentDepth);
    return { type: 'array', items: innerSchema };
  }

  if (isScalarType(gqlType)) {
    const typeName = gqlType.name.toLowerCase();
    if (typeName === 'string') return { type: 'string' };
    if (typeName === 'int') return { type: 'integer' };
    if (typeName === 'float') return { type: 'number' };
    if (typeName === 'boolean') return { type: 'boolean' };
    if (typeName === 'id') return { type: 'string' };
    return { type: 'string', description: `GraphQL scalar: ${gqlType.name}` };
  }

  if (isInputObjectType(gqlType)) {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    const fields = gqlType.getFields();
    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      if (fieldName.startsWith('__')) continue;

      const fieldSchema = convertTypeToJsonSchema(fieldValue.type, maxDepth, currentDepth + 1);
      const isRequired = (fieldSchema as any).required;
      if (isRequired) {
        delete (fieldSchema as any).required;
        required.push(fieldName);
      }

      properties[fieldName] = fieldSchema;
      properties[fieldName].description = `Field ${fieldName}`;
    }

    const objectSchema: JsonSchema = { type: 'object', properties };
    if (required.length > 0) {
      objectSchema.required = required;
    }

    return objectSchema;
  }

  return { type: 'string', description: `Unknown GraphQL type: ${gqlType.toString()}` };
}

// Build nested field selections
function buildNestedSelection(
  fieldType: GraphQLObjectType,
  maxDepth: number,
  currentDepth: number = 1
): NestedSelection {
  if (currentDepth > maxDepth) return [];
  if (!fieldType.getFields) return [];

  const selections: NestedSelection = [];
  const fields = fieldType.getFields();
  
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    if (fieldName.startsWith('__')) continue;

    let type = fieldValue.type;
    
    if (isScalarType(type)) {
      selections.push([fieldName, null]);
    } else if (isNonNullType(type)) {
      const ofType = type.ofType;
      if (isScalarType(ofType)) {
        selections.push([fieldName, null]);
      } else if (isObjectType(ofType)) {
        const nestedSelections = buildNestedSelection(ofType, maxDepth, currentDepth + 1);
        if (nestedSelections.length > 0) {
          selections.push([fieldName, nestedSelections]);
        }
      }
    } else if (isListType(type)) {
      let innerType = type.ofType;
      while (isNonNullType(innerType) || isListType(innerType)) {
        innerType = innerType.ofType;
      }
      if (isObjectType(innerType)) {
        const nestedSelections = buildNestedSelection(innerType, maxDepth, currentDepth + 1);
        if (nestedSelections.length > 0) {
          selections.push([fieldName, nestedSelections]);
        }
      }
    } else if (isObjectType(type)) {
      const nestedSelections = buildNestedSelection(type, maxDepth, currentDepth + 1);
      if (nestedSelections.length > 0) {
        selections.push([fieldName, nestedSelections]);
      }
    }
  }

  return selections;
}

// Build GraphQL selection string from nested selections
function buildSelectionString(selections: NestedSelection, depth: number = 0): string {
  const indent = '  '.repeat(depth);
  const parts: string[] = [];
  
  for (const [fieldName, nestedSelections] of selections) {
    if (nestedSelections === null) {
      parts.push(`${indent}${fieldName}`);
    } else if (nestedSelections.length > 0) {
      const nestedString = buildSelectionString(nestedSelections, depth + 1);
      parts.push(`${indent}${fieldName} {\n${nestedString}\n${indent}}`);
    }
  }
  
  return parts.join('\n');
}

// Create and configure the MCP server
async function createMCPServer() {
  const server = new Server(
    {
      name: 'graphql-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Get the GraphQL schema
  let schema: GraphQLSchema;
  try {
    schema = await getGraphQLSchema();
    console.log('✅ Successfully introspected GraphQL schema');
  } catch (error) {
    console.error('❌ Failed to introspect GraphQL schema:', error);
    throw error;
  }

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [];

    if (!schema.getQueryType()) {
      return { tools };
    }

    const queryFields = schema.getQueryType()!.getFields();
    
    for (const [queryName, field] of Object.entries(queryFields)) {
      if (queryName.startsWith('__')) continue;

      // Build argument schema
      const argsSchema: JsonSchema = { 
        type: 'object', 
        properties: {}, 
        required: [] 
      };
      
      for (const [argName, arg] of Object.entries(field.args || {})) {
        const typeSchema = convertTypeToJsonSchema(arg.type, 3, 1);
        
        const isRequired = (typeSchema as any).required;
        if (isRequired) {
          delete (typeSchema as any).required;
          if (Array.isArray(argsSchema.required)) {
            argsSchema.required.push(argName);
          }
        }
        
        if (!argsSchema.properties) {
          argsSchema.properties = {};
        }
        argsSchema.properties[argName] = typeSchema;
        argsSchema.properties[argName].description = arg.description || `Argument ${argName}`;
      }

      tools.push({
        name: queryName,
        description: field.description || `GraphQL query: ${queryName}`,
        inputSchema: argsSchema as any,
      });
    }

    console.log(`🎉 Generated ${tools.length} tools from GraphQL schema`);
    return { tools };
  });

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (!schema.getQueryType()) {
        throw new Error('No query type found in schema');
      }

      const queryFields = schema.getQueryType()!.getFields();
      const field = queryFields[name];
      
      if (!field) {
        throw new Error(`Tool ${name} not found`);
      }

      // Get the return type and build selections
      let returnType = field.type;
      while (isNonNullType(returnType) || isListType(returnType)) {
        returnType = returnType.ofType;
      }
      
      let selectionString = '';
      
      if (isObjectType(returnType)) {
        const selections = buildNestedSelection(returnType, 3);
        selectionString = buildSelectionString(selections);
      }
      
      // Build the query
      const argDefs = Object.keys(field.args || {}).map(argName => {
        const arg = field.args![argName];
        return `$${argName}: ${arg.type.toString()}`;
      }).join(', ');
      
      const argUses = Object.keys(field.args || {}).map(argName => 
        `${argName}: $${argName}`
      ).join(', ');
      
      const queryString = `
        query ${name.charAt(0).toUpperCase() + name.slice(1)}${argDefs ? `(${argDefs})` : ''} {
          ${name}${argUses ? `(${argUses})` : ''}${selectionString ? ` {\n${selectionString}\n  }` : ''}
        }
      `.trim();
      
      console.log('Executing query:', queryString);
      
      // Execute the query
      const result = await executeGraphQL(queryString, args);
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error executing ${name}: ${error}`,
        }],
      };
    }
  });

  return server;
}

// Export the handler
export async function GET() {
  try {
    const server = await createMCPServer();
    
    // For HTTP transport, we'll return a simple response
    return new Response(JSON.stringify({ 
      message: 'GraphQL MCP Server is running',
      transport: 'http'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to start MCP server',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: Request) {
  try {
    // Get the GraphQL schema first
    const schema = await getGraphQLSchema();
    
    // Parse the JSON-RPC request
    const body = await request.json();
    
    // Handle the request based on method
    if (body.method === 'tools/list') {
      // Get tools directly without server.request
      const tools: Tool[] = [];

      if (schema.getQueryType()) {
        const queryFields = schema.getQueryType()!.getFields();
        
        for (const [queryName, field] of Object.entries(queryFields)) {
          if (queryName.startsWith('__')) continue;

          // Build argument schema
          const argsSchema: JsonSchema = { 
            type: 'object', 
            properties: {}, 
            required: [] 
          };
          
          for (const [argName, arg] of Object.entries(field.args || {})) {
            const typeSchema = convertTypeToJsonSchema(arg.type, 3, 1);
            
            const isRequired = (typeSchema as any).required;
            if (isRequired) {
              delete (typeSchema as any).required;
              if (Array.isArray(argsSchema.required)) {
                argsSchema.required.push(argName);
              }
            }
            
            if (!argsSchema.properties) {
              argsSchema.properties = {};
            }
            argsSchema.properties[argName] = typeSchema;
            argsSchema.properties[argName].description = arg.description || `Argument ${argName}`;
          }

          tools.push({
            name: queryName,
            description: field.description || `GraphQL query: ${queryName}`,
            inputSchema: argsSchema as any,
          });
        }
      }
      
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        result: { tools }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (body.method === 'tools/call') {
      // Handle tool call directly
      const { name, arguments: args } = body.params;

      try {
        if (!schema.getQueryType()) {
          throw new Error('No query type found in schema');
        }

        const queryFields = schema.getQueryType()!.getFields();
        const field = queryFields[name];
        
        if (!field) {
          throw new Error(`Tool ${name} not found`);
        }

        // Get the return type and build selections
        let returnType = field.type;
        while (isNonNullType(returnType) || isListType(returnType)) {
          returnType = returnType.ofType;
        }
        
        let selectionString = '';
        
        if (isObjectType(returnType)) {
          const selections = buildNestedSelection(returnType, 3);
          selectionString = buildSelectionString(selections);
        }
        
        // Build the query
        const argDefs = Object.keys(field.args || {}).map(argName => {
          const arg = field.args![argName];
          return `$${argName}: ${arg.type.toString()}`;
        }).join(', ');
        
        const argUses = Object.keys(field.args || {}).map(argName => 
          `${argName}: $${argName}`
        ).join(', ');
        
        const queryString = `
          query ${name.charAt(0).toUpperCase() + name.slice(1)}${argDefs ? `(${argDefs})` : ''} {
            ${name}${argUses ? `(${argUses})` : ''}${selectionString ? ` {\n${selectionString}\n  }` : ''}
          }
        `.trim();
        
        console.log('Executing query:', queryString);
        
        // Execute the query
        const result = await executeGraphQL(queryString, args);
        
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2),
            }],
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            content: [{
              type: 'text',
              text: `Error executing ${name}: ${error}`,
            }],
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        error: { code: -32601, message: 'Method not found' }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: { 
        code: -32603, 
        message: 'Internal error',
        data: error instanceof Error ? error.message : String(error)
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}