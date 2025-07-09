import createMcpRouteHandler from '@vercel/mcp-adapter/next';
import { getIntrospectionQuery, buildClientSchema, printSchema } from 'graphql';
import { z } from 'zod';
import { cookies } from 'next/headers';

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'http://localhost:3003/api/graphql';

// Model names from your Keystone config
const MODEL_NAMES = ['User', 'Role', 'Todo', 'TodoImage'];

// Common field selections for each model type
const MODEL_FIELD_SELECTIONS: Record<string, string> = {
  User: 'id name email role { id name } tasks { id label }',
  Role: 'id name canCreateTodos canManageAllTodos canSeeOtherPeople canEditOtherPeople canManagePeople canManageRoles canAccessDashboard',
  Todo: 'id label isComplete status priority dueDate assignedTo { id name }',
  TodoImage: 'id image { url } caption altText',
};

// Execute GraphQL query
async function executeGraphQL(query: string, variables?: any) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(`GraphQL execution failed: ${error}`);
  }
}

// Helper to convert model name to GraphQL conventions
function toGraphQLName(modelName: string, operation: 'list' | 'single' | 'create' | 'update' | 'delete') {
  const lowerFirst = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);
  const lowerName = lowerFirst(modelName);
  
  switch (operation) {
    case 'list':
      return `${lowerName}s`; // users, roles, todos
    case 'single':
      return lowerName; // user, role, todo
    case 'create':
      return `create${modelName}`; // createUser, createRole
    case 'update':
      return `update${modelName}`; // updateUser, updateRole
    case 'delete':
      return `delete${modelName}`; // deleteUser, deleteRole
  }
}

const handler = createMcpRouteHandler(
  async server => {
    console.log('🚀 Initializing Model-Based GraphQL MCP Server...');
    
    // Log cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('🍪 Cookies available:', allCookies);
    console.log('🍪 Cookie count:', allCookies.length);
    
    // Basic utility tools
    server.tool('list_models', 'List all available models in the GraphQL API', {}, async () => {
      return {
        content: [{
          type: 'text',
          text: `Available models:\n${MODEL_NAMES.map(m => `- ${m}`).join('\n')}\n\nYou can use list_<model>, create_<model>, update_<model>, delete_<model> operations for each model.`
        }],
      };
    });

    // Introspection tool for advanced users
    server.tool(
      'introspect_schema',
      'Get the complete GraphQL schema in SDL format (for advanced users)',
      {},
      async () => {
        try {
          const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: getIntrospectionQuery() }),
          });
          
          const result = await response.json();
          if (result.errors) {
            throw new Error(`GraphQL introspection failed: ${JSON.stringify(result.errors)}`);
          }
          
          const schema = buildClientSchema(result.data);
          const schemaSDL = printSchema(schema);
          
          return {
            content: [{ type: 'text', text: `GraphQL Schema:\n\n${schemaSDL}` }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Failed to introspect schema: ${error}` }],
          };
        }
      }
    );

    // Apollo Studio tool
    server.tool(
      'open_apollo_studio',
      'Get the URL to open Apollo Studio Explorer for this GraphQL API',
      {},
      async () => {
        const studioUrl = GRAPHQL_ENDPOINT.replace('/api/graphql', '/api/graphql');
        return {
          content: [{
            type: 'text',
            text: `Open Apollo Studio Explorer at: ${studioUrl}\n\nThis provides a full GraphQL IDE with:\n- Schema documentation\n- Query builder\n- Variable editor\n- Response viewer`
          }],
        };
      }
    );

    // Generate CRUD tools for each model
    for (const modelName of MODEL_NAMES) {
      const lowerModel = modelName.toLowerCase();
      const fields = MODEL_FIELD_SELECTIONS[modelName] || 'id';
      
      // List operation
      server.tool(
        `list_${lowerModel}s`,
        `List all ${modelName} records`,
        {
          where: z.record(z.any()).optional().describe('Filter conditions'),
          take: z.number().optional().describe('Number of records to return'),
          skip: z.number().optional().describe('Number of records to skip'),
        },
        async ({ where = {}, take, skip = 0 }) => {
          const queryName = toGraphQLName(modelName, 'list');
          const query = `
            query List${modelName}s($where: ${modelName}WhereInput!, $take: Int, $skip: Int!) {
              ${queryName}(where: $where, take: $take, skip: $skip) {
                ${fields}
              }
              ${queryName}Count(where: $where)
            }
          `;
          
          try {
            const result = await executeGraphQL(query, { where, take, skip });
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2),
              }],
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `Error listing ${modelName}s: ${error}`,
              }],
            };
          }
        }
      );

      // Create operation
      server.tool(
        `create_${lowerModel}`,
        `Create a new ${modelName} record`,
        {
          data: z.record(z.any()).describe(`${modelName} data to create`),
        },
        async ({ data }) => {
          const mutationName = toGraphQLName(modelName, 'create');
          const mutation = `
            mutation Create${modelName}($data: ${modelName}CreateInput!) {
              ${mutationName}(data: $data) {
                ${fields}
              }
            }
          `;
          
          try {
            const result = await executeGraphQL(mutation, { data });
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2),
              }],
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `Error creating ${modelName}: ${error}`,
              }],
            };
          }
        }
      );

      // Update operation
      server.tool(
        `update_${lowerModel}`,
        `Update an existing ${modelName} record`,
        {
          where: z.object({ id: z.string() }).describe('ID of the record to update'),
          data: z.record(z.any()).describe('Fields to update'),
        },
        async ({ where, data }) => {
          const mutationName = toGraphQLName(modelName, 'update');
          const mutation = `
            mutation Update${modelName}($where: ${modelName}WhereUniqueInput!, $data: ${modelName}UpdateInput!) {
              ${mutationName}(where: $where, data: $data) {
                ${fields}
              }
            }
          `;
          
          try {
            const result = await executeGraphQL(mutation, { where, data });
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2),
              }],
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `Error updating ${modelName}: ${error}`,
              }],
            };
          }
        }
      );

      // Delete operation
      server.tool(
        `delete_${lowerModel}`,
        `Delete a ${modelName} record`,
        {
          where: z.object({ id: z.string() }).describe('ID of the record to delete'),
        },
        async ({ where }) => {
          const mutationName = toGraphQLName(modelName, 'delete');
          const mutation = `
            mutation Delete${modelName}($where: ${modelName}WhereUniqueInput!) {
              ${mutationName}(where: $where) {
                id
              }
            }
          `;
          
          try {
            const result = await executeGraphQL(mutation, { where });
            return {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2),
              }],
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `Error deleting ${modelName}: ${error}`,
              }],
            };
          }
        }
      );
    }

    // Advanced search tool
    server.tool(
      'search_records',
      'Search across models with advanced filtering',
      {
        model: z.enum(['User', 'Role', 'Todo', 'TodoImage']).describe('Model to search'),
        query: z.string().describe('Search query (searches text fields)'),
        filters: z.record(z.any()).optional().describe('Additional filters'),
      },
      async ({ model, query, filters = {} }) => {
        const queryName = toGraphQLName(model, 'list');
        const fields = MODEL_FIELD_SELECTIONS[model] || 'id';
        
        // Build search conditions based on model
        let searchConditions = { ...filters };
        if (query) {
          switch (model) {
            case 'User':
              searchConditions.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ];
              break;
            case 'Role':
              searchConditions.name = { contains: query, mode: 'insensitive' };
              break;
            case 'Todo':
              searchConditions.label = { contains: query, mode: 'insensitive' };
              break;
            case 'TodoImage':
              searchConditions.OR = [
                { caption: { contains: query, mode: 'insensitive' } },
                { altText: { contains: query, mode: 'insensitive' } },
              ];
              break;
          }
        }
        
        const graphqlQuery = `
          query Search${model}($where: ${model}WhereInput!) {
            ${queryName}(where: $where) {
              ${fields}
            }
            ${queryName}Count(where: $where)
          }
        `;
        
        try {
          const result = await executeGraphQL(graphqlQuery, { where: searchConditions });
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error searching ${model}: ${error}`,
            }],
          };
        }
      }
    );

    // Custom query execution for power users
    server.tool(
      'execute_graphql',
      'Execute a custom GraphQL query or mutation (for advanced users)',
      {
        query: z.string().describe('The GraphQL query or mutation to execute'),
        variables: z.record(z.any()).optional().describe('Variables for the query'),
      },
      async ({ query, variables }) => {
        try {
          const result = await executeGraphQL(query, variables);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error executing GraphQL: ${error}`,
            }],
          };
        }
      }
    );

    console.log(`🎉 Model-Based MCP Server initialized with ${MODEL_NAMES.length} models and ${MODEL_NAMES.length * 4 + 4} total tools`);
  },
  {
    capabilities: {},
  },
  {
    streamableHttpEndpoint: '/mcp',
    sseEndpoint: '/sse',
    sseMessageEndpoint: '/message',
    basePath: '/api/mcp',
    redisUrl: process.env.REDIS_URL,
  }
);

export { handler as GET, handler as POST };