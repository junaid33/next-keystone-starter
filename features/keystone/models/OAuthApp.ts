import { list } from "@keystone-6/core";
import { text, select, json } from "@keystone-6/core/fields";
import { permissions } from "../access";
import { trackingFields } from "./trackingFields";
import { MCP_SCOPES, digestToken, randomToken } from "../mcp-oauth/core";

// Same list as Openfront E-commerce. MCP clients register themselves as public
// (PKCE, no secret) apps through /oauth/register.
export const OAuthApp = list({
  access: {
    operation: {
      query: permissions.canManagePeople,
      create: permissions.canManagePeople,
      update: permissions.canManagePeople,
      delete: permissions.canManagePeople,
    },
  },
  fields: {
    name: text({
      validation: {
        isRequired: true,
      },
    }),
    clientId: text({
      isIndexed: "unique",
      hooks: {
        resolveInput: ({ operation, resolvedData }) => {
          if (operation === "create" && !resolvedData.clientId) {
            return randomToken("mcp_cl_", 18);
          }
          return resolvedData.clientId;
        },
      },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        description: "Auto-generated unique identifier for your application.",
      },
    }),
    clientSecret: text({
      access: {
        read: () => false,
      },
      hooks: {
        resolveInput: ({ resolvedData }) => {
          if (resolvedData.clientSecret) {
            return digestToken(resolvedData.clientSecret, "oauth-client-secret");
          }
          return undefined;
        },
      },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "hidden" },
        description: "Stored only as a digest. Public MCP clients have no secret.",
      },
    }),
    tokenEndpointAuthMethod: select({
      options: [
        { label: "Client secret (POST)", value: "client_secret_post" },
        { label: "Client secret (Basic)", value: "client_secret_basic" },
        { label: "None (public PKCE client)", value: "none" },
      ],
      defaultValue: "client_secret_post",
      ui: {
        description: "How the app authenticates at the token endpoint. MCP clients are public (none).",
      },
    }),
    redirectUris: json({
      defaultValue: [],
      ui: {
        description: "Array of allowed redirect URIs for OAuth callbacks",
      },
    }),
    scopes: json({
      defaultValue: [...MCP_SCOPES],
      ui: {
        description: "Array of allowed OAuth scopes. MCP scopes only narrow the signed-in user's own access.",
      },
    }),
    webhookUrl: text({
      ui: {
        description: "URL to receive webhook notifications",
      },
    }),
    status: select({
      options: [
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Pending", value: "pending" },
      ],
      defaultValue: "active",
    }),
    installUrl: text({
      ui: {
        description: "URL where users can install this app",
      },
    }),
    uninstallUrl: text({
      ui: {
        description: "URL to handle app uninstallation",
      },
    }),
    description: text({
      ui: {
        displayMode: "textarea",
      },
    }),
    metadata: json({
      defaultValue: {},
      ui: {
        description: "Additional app-specific configuration and settings",
      },
    }),
    developerEmail: text(),
    privacyPolicyUrl: text(),
    termsOfServiceUrl: text(),
    supportUrl: text(),
    ...trackingFields,
  },
  ui: {
    labelField: "name",
    listView: {
      initialColumns: ["name", "clientId", "status", "createdAt"],
    },
  },
});
