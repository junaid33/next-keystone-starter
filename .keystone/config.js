"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// keystone.ts
var keystone_exports = {};
__export(keystone_exports, {
  default: () => keystone_default2
});
module.exports = __toCommonJS(keystone_exports);

// features/keystone/index.ts
var import_auth = require("@keystone-6/auth");
var import_core5 = require("@keystone-6/core");
var import_config = require("dotenv/config");

// features/keystone/models/User.ts
var import_core = require("@keystone-6/core");
var import_access = require("@keystone-6/core/access");
var import_fields = require("@keystone-6/core/fields");

// features/keystone/access.ts
function isSignedIn({ session }) {
  return Boolean(session);
}
var permissions = {
  canCreateTodos: ({ session }) => session?.data.role?.canCreateTodos ?? false,
  canManageAllTodos: ({ session }) => session?.data.role?.canManageAllTodos ?? false,
  canManagePeople: ({ session }) => session?.data.role?.canManagePeople ?? false,
  canManageRoles: ({ session }) => session?.data.role?.canManageRoles ?? false
};
var rules = {
  canReadTodos: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageAllTodos) {
      return {
        OR: [
          { assignedTo: { id: { equals: session.itemId } } },
          { assignedTo: null, isPrivate: { equals: true } },
          { NOT: { isPrivate: { equals: true } } }
        ]
      };
    }
    return { assignedTo: { id: { equals: session.itemId } } };
  },
  canManageTodos: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageAllTodos) return true;
    return { assignedTo: { id: { equals: session.itemId } } };
  },
  canReadPeople: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canSeeOtherPeople) return true;
    return { id: { equals: session.itemId } };
  },
  canUpdatePeople: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canEditOtherPeople) return true;
    return { id: { equals: session.itemId } };
  }
};

// features/keystone/models/User.ts
var User = (0, import_core.list)({
  access: {
    operation: {
      ...(0, import_access.allOperations)(isSignedIn),
      create: (args) => {
        if (process.env.PUBLIC_SIGNUPS_ALLOWED === "true") {
          return true;
        }
        return permissions.canManagePeople(args);
      },
      delete: permissions.canManagePeople
    },
    filter: {
      query: rules.canReadPeople,
      update: rules.canUpdatePeople
    }
  },
  ui: {
    hideCreate: (args) => !permissions.canManagePeople(args),
    hideDelete: (args) => !permissions.canManagePeople(args),
    listView: {
      initialColumns: ["name", "email", "role", "tasks"]
    },
    itemView: {
      defaultFieldMode: ({ session, item }) => {
        if (session?.data.role?.canEditOtherPeople) return "edit";
        if (session?.itemId === item?.id) return "edit";
        return "read";
      }
    }
  },
  fields: {
    name: (0, import_fields.text)({
      validation: {
        isRequired: true
      }
    }),
    email: (0, import_fields.text)({
      isFilterable: false,
      isOrderable: false,
      isIndexed: "unique",
      validation: {
        isRequired: true
      }
    }),
    password: (0, import_fields.password)({
      access: {
        read: import_access.denyAll,
        update: ({ session, item }) => permissions.canManagePeople({ session }) || session?.itemId === item.id
      },
      validation: { isRequired: true }
    }),
    role: (0, import_fields.relationship)({
      ref: "Role.assignedTo",
      access: {
        create: permissions.canManagePeople,
        update: permissions.canManagePeople
      },
      ui: {
        itemView: {
          fieldMode: (args) => permissions.canManagePeople(args) ? "edit" : "read"
        }
      }
    }),
    tasks: (0, import_fields.relationship)({
      ref: "Todo.assignedTo",
      many: true,
      access: {
        create: permissions.canManageAllTodos,
        update: ({ session, item }) => permissions.canManageAllTodos({ session }) || session?.itemId === item.id
      },
      ui: {
        createView: {
          fieldMode: (args) => permissions.canManageAllTodos(args) ? "edit" : "hidden"
        }
        // itemView: { fieldMode: 'read' },
      }
    })
  }
});

// features/keystone/models/Role.ts
var import_core2 = require("@keystone-6/core");
var import_access3 = require("@keystone-6/core/access");
var import_fields2 = require("@keystone-6/core/fields");
var Role = (0, import_core2.list)({
  access: {
    operation: {
      ...(0, import_access3.allOperations)(permissions.canManageRoles),
      query: isSignedIn
    }
  },
  ui: {
    hideCreate: (args) => !permissions.canManageRoles(args),
    hideDelete: (args) => !permissions.canManageRoles(args),
    listView: {
      initialColumns: ["name", "assignedTo"]
    },
    itemView: {
      defaultFieldMode: (args) => permissions.canManageRoles(args) ? "edit" : "read"
    }
  },
  fields: {
    name: (0, import_fields2.text)({ validation: { isRequired: true } }),
    canCreateTodos: (0, import_fields2.checkbox)({ defaultValue: false }),
    canManageAllTodos: (0, import_fields2.checkbox)({ defaultValue: false }),
    canSeeOtherPeople: (0, import_fields2.checkbox)({ defaultValue: false }),
    canEditOtherPeople: (0, import_fields2.checkbox)({ defaultValue: false }),
    canManagePeople: (0, import_fields2.checkbox)({ defaultValue: false }),
    canManageRoles: (0, import_fields2.checkbox)({ defaultValue: false }),
    canAccessDashboard: (0, import_fields2.checkbox)({ defaultValue: false }),
    assignedTo: (0, import_fields2.relationship)({
      ref: "User.role",
      many: true,
      ui: {
        itemView: { fieldMode: "read" }
      }
    })
  }
});

// features/keystone/models/Todo.ts
var import_core3 = require("@keystone-6/core");
var import_access5 = require("@keystone-6/core/access");
var import_fields3 = require("@keystone-6/core/fields");
var import_fields_document = require("@keystone-6/fields-document");
var Todo = (0, import_core3.list)({
  access: {
    operation: {
      ...(0, import_access5.allOperations)(isSignedIn),
      create: permissions.canCreateTodos
    },
    filter: {
      query: rules.canReadTodos,
      update: rules.canManageTodos,
      delete: rules.canManageTodos
    }
  },
  ui: {
    hideCreate: (args) => !permissions.canCreateTodos(args),
    listView: {
      initialColumns: ["label", "tags", "isComplete", "assignedTo"]
    }
  },
  fields: {
    // Basic fields
    label: (0, import_fields3.text)({ validation: { isRequired: true } }),
    description: (0, import_fields_document.document)({
      formatting: true,
      links: true,
      dividers: true,
      layouts: [
        [1, 1],
        [1, 1, 1],
        [2, 1]
      ]
    }),
    ...(0, import_core3.group)({
      label: "Task Status",
      description: "Track completion and status of the task",
      fields: {
        isComplete: (0, import_fields3.checkbox)({ defaultValue: false }),
        status: (0, import_fields3.select)({
          type: "string",
          options: [
            { label: "Todo", value: "todo" },
            { label: "In Progress", value: "in_progress" },
            { label: "Done", value: "done" },
            { label: "Blocked", value: "blocked" }
          ],
          defaultValue: "todo"
        }),
        priority: (0, import_fields3.integer)({
          defaultValue: 1,
          validation: { min: 1, max: 5 },
          label: "Priority (1-5)"
        }),
        tags: (0, import_fields3.multiselect)({
          type: "string",
          options: [
            { label: "Frontend", value: "frontend" },
            { label: "Backend", value: "backend" },
            { label: "Database", value: "database" },
            { label: "Testing", value: "testing" },
            { label: "Documentation", value: "documentation" },
            { label: "Bug Fix", value: "bug_fix" },
            { label: "Feature", value: "feature" },
            { label: "Urgent", value: "urgent" },
            { label: "Nice to Have", value: "nice_to_have" }
          ],
          defaultValue: [],
          label: "Tags"
        })
      }
    }),
    ...(0, import_core3.group)({
      label: "Planning & Budget",
      description: "Schedule and resource allocation",
      fields: {
        dueDate: (0, import_fields3.timestamp)({
          label: "Due Date"
        }),
        weight: (0, import_fields3.float)({
          defaultValue: 1,
          label: "Weight"
        }),
        budget: (0, import_fields3.decimal)({
          precision: 10,
          scale: 2,
          defaultValue: "0.00",
          label: "Budget"
        })
      }
    }),
    ...(0, import_core3.group)({
      label: "Advanced Fields",
      description: "Additional data and security settings",
      fields: {
        isPrivate: (0, import_fields3.checkbox)({ defaultValue: false }),
        largeNumber: (0, import_fields3.bigInt)({
          label: "Large Number Example",
          ui: {
            description: "Example field for testing BigInt values"
          }
        }),
        metadata: (0, import_fields3.json)({
          label: "Metadata"
        }),
        secretNote: (0, import_fields3.password)({
          label: "Secret Note"
        })
      }
    }),
    ...(0, import_core3.group)({
      label: "Attachments",
      description: "File attachments for the task",
      fields: {
        coverImage: (0, import_fields3.image)({
          storage: "my_images",
          label: "Cover Image"
        }),
        todoImages: (0, import_fields3.relationship)({
          ref: "TodoImage.todos",
          many: true,
          ui: {
            displayMode: "cards",
            cardFields: ["image", "altText", "imagePath"],
            inlineCreate: { fields: ["image", "altText", "imagePath"] },
            inlineEdit: { fields: ["image", "altText", "imagePath"] },
            inlineConnect: true,
            removeMode: "disconnect",
            linkToItem: false
          }
        })
      }
    }),
    // Virtual field - requires graphql import for proper setup
    // Let's comment this out for now to avoid complexity
    // displayName: virtual({
    //   field: graphql.field({
    //     type: graphql.String,
    //     resolve: (item: any) => `${item.label} (${item.status || 'unknown'})`
    //   })
    // }),
    // Relationship field
    assignedTo: (0, import_fields3.relationship)({
      ref: "User.tasks",
      ui: {
        createView: {
          fieldMode: (args) => permissions.canManageAllTodos(args) ? "edit" : "hidden"
        },
        itemView: {
          fieldMode: (args) => permissions.canManageAllTodos(args) ? "edit" : "read"
        }
      },
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          if (operation === "create" && !resolvedData.assignedTo && context.session?.itemId) {
            return { connect: { id: context.session?.itemId } };
          }
          return resolvedData.assignedTo;
        }
      }
    })
  }
});

// features/keystone/models/TodoImage.ts
var import_core4 = require("@keystone-6/core");
var import_fields4 = require("@keystone-6/core/fields");
var TodoImage = (0, import_core4.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canCreateTodos,
      update: permissions.canCreateTodos,
      delete: permissions.canCreateTodos
    }
  },
  fields: {
    image: (0, import_fields4.image)({ storage: "my_images" }),
    imagePath: (0, import_fields4.text)(),
    altText: (0, import_fields4.text)(),
    todos: (0, import_fields4.relationship)({ ref: "Todo.todoImages", many: true }),
    metadata: (0, import_fields4.json)()
  },
  ui: {
    listView: {
      initialColumns: ["image", "imagePath", "altText", "todos"]
    }
  }
});

// features/keystone/models/index.ts
var models = {
  User,
  Role,
  Todo,
  TodoImage
};

// features/keystone/index.ts
var import_session = require("@keystone-6/core/session");

// features/keystone/mutations/index.ts
var import_schema = require("@graphql-tools/schema");

// features/keystone/mutations/redirectToInit.ts
async function redirectToInit(root, args, context) {
  const userCount = await context.sudo().query.User.count({});
  if (userCount === 0) {
    return true;
  }
  return false;
}
var redirectToInit_default = redirectToInit;

// features/keystone/mutations/index.ts
var graphql = String.raw;
function extendGraphqlSchema(baseSchema) {
  return (0, import_schema.mergeSchemas)({
    schemas: [baseSchema],
    typeDefs: graphql`
      type Query {
        redirectToInit: Boolean
      }
    `,
    resolvers: {
      Query: {
        redirectToInit: redirectToInit_default
      }
    }
  });
}

// features/keystone/lib/mail.ts
var import_nodemailer = require("nodemailer");
function getBaseUrlForEmails() {
  if (process.env.SMTP_STORE_LINK) {
    return process.env.SMTP_STORE_LINK;
  }
  console.warn("SMTP_STORE_LINK not set. Please add SMTP_STORE_LINK to your environment variables for email links to work properly.");
  return "";
}
var transport = (0, import_nodemailer.createTransport)({
  // @ts-ignore
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
function passwordResetEmail({ url }) {
  const backgroundColor = "#f9f9f9";
  const textColor = "#444444";
  const mainBackgroundColor = "#ffffff";
  const buttonBackgroundColor = "#346df1";
  const buttonBorderColor = "#346df1";
  const buttonTextColor = "#ffffff";
  return `
    <body style="background: ${backgroundColor};">
      <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: ${mainBackgroundColor}; max-width: 600px; margin: auto; border-radius: 10px;">
        <tr>
          <td align="center" style="padding: 10px 0px 0px 0px; font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
            Please click below to reset your password
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 5px;" bgcolor="${buttonBackgroundColor}"><a href="${url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${buttonTextColor}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${buttonBorderColor}; display: inline-block; font-weight: bold;">Reset Password</a></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
            If you did not request this email you can safely ignore it.
          </td>
        </tr>
      </table>
    </body>
  `;
}
async function sendPasswordResetEmail(resetToken, to, baseUrl) {
  const frontendUrl = baseUrl || getBaseUrlForEmails();
  const info = await transport.sendMail({
    to,
    from: process.env.SMTP_FROM,
    subject: "Your password reset token!",
    html: passwordResetEmail({
      url: `${frontendUrl}/dashboard/reset?token=${resetToken}`
    })
  });
  if (process.env.MAIL_USER?.includes("ethereal.email")) {
    console.log(`\u{1F4E7} Message Sent!  Preview it at ${(0, import_nodemailer.getTestMessageUrl)(info)}`);
  }
}

// features/keystone/index.ts
var databaseURL = process.env.DATABASE_URL || "file:./keystone.db";
var sessionConfig = {
  maxAge: 60 * 60 * 24 * 360,
  // How long they stay signed in?
  secret: process.env.SESSION_SECRET || "this secret should only be used in testing"
};
var {
  S3_BUCKET_NAME: bucketName = "keystone-test",
  S3_REGION: region = "ap-southeast-2",
  S3_ACCESS_KEY_ID: accessKeyId = "keystone",
  S3_SECRET_ACCESS_KEY: secretAccessKey = "keystone",
  S3_ENDPOINT: endpoint = "https://sfo3.digitaloceanspaces.com"
} = process.env;
var { withAuth } = (0, import_auth.createAuth)({
  listKey: "User",
  identityField: "email",
  secretField: "password",
  initFirstItem: {
    fields: ["name", "email", "password"],
    itemData: {
      role: {
        create: {
          name: "Admin",
          canCreateTodos: true,
          canManageAllTodos: true,
          canSeeOtherPeople: true,
          canEditOtherPeople: true,
          canManagePeople: true,
          canManageRoles: true,
          canAccessDashboard: true
        }
      }
    }
  },
  passwordResetLink: {
    async sendToken(args) {
      await sendPasswordResetEmail(args.token, args.identity);
    }
  },
  sessionData: `
    name
    email
    role {
      id
      name
      canCreateTodos
      canManageAllTodos
      canSeeOtherPeople
      canEditOtherPeople
      canManagePeople
      canManageRoles
      canAccessDashboard
    }
  `
});
var keystone_default = withAuth(
  (0, import_core5.config)({
    db: {
      provider: "postgresql",
      url: databaseURL
    },
    lists: models,
    storage: {
      my_images: {
        kind: "s3",
        type: "image",
        bucketName,
        region,
        accessKeyId,
        secretAccessKey,
        endpoint,
        signed: { expiry: 5e3 },
        forcePathStyle: true
      }
    },
    ui: {
      isAccessAllowed: ({ session }) => session?.data.role?.canAccessDashboard ?? false
    },
    session: (0, import_session.statelessSessions)(sessionConfig),
    graphql: {
      extendGraphqlSchema
    }
  })
);

// keystone.ts
var keystone_default2 = keystone_default;
//# sourceMappingURL=config.js.map
