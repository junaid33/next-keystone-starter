import { list, group } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import { 
  checkbox, 
  relationship, 
  text, 
  integer, 
  bigInt,
  float, 
  decimal, 
  select, 
  timestamp, 
  json, 
  password, 
  image,
  multiselect
} from "@keystone-6/core/fields";
import { document } from "@keystone-6/fields-document";

import { isSignedIn, permissions, rules } from "../access";

export const Todo = list({
  access: {
    operation: {
      ...allOperations(isSignedIn),
      create: permissions.canCreateTodos,
    },
    filter: {
      query: rules.canReadTodos,
      update: rules.canManageTodos,
      delete: rules.canManageTodos,
    },
  },
  ui: {
    hideCreate: (args) => !permissions.canCreateTodos(args),
    listView: {
      initialColumns: ["label", "tags", "isComplete", "assignedTo"],
    },
  },
  fields: {
    // Basic fields
    label: text({ validation: { isRequired: true } }),
    description: document({
      formatting: true,
      links: true,
      dividers: true,
      layouts: [
        [1, 1],
        [1, 1, 1],
        [2, 1],
      ],
    }),

    ...group({
      label: "Task Status",
      description: "Track completion and status of the task",
      fields: {
        isComplete: checkbox({ defaultValue: false }),
        status: select({
          type: "string",
          options: [
            { label: "Todo", value: "todo" },
            { label: "In Progress", value: "in_progress" },
            { label: "Done", value: "done" },
            { label: "Blocked", value: "blocked" }
          ],
          defaultValue: "todo"
        }),
        priority: integer({ 
          defaultValue: 1,
          validation: { min: 1, max: 5 },
          label: "Priority (1-5)"
        }),
        tags: multiselect({
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
        }),
      }
    }),

    ...group({
      label: "Planning & Budget",
      description: "Schedule and resource allocation",
      fields: {
        dueDate: timestamp({
          label: "Due Date"
        }),
        weight: float({ 
          defaultValue: 1.0,
          label: "Weight"
        }),
        budget: decimal({ 
          precision: 10,
          scale: 2,
          defaultValue: "0.00",
          label: "Budget"
        }),
      }
    }),

    ...group({
      label: "Advanced Fields",
      description: "Additional data and security settings",
      fields: {
        isPrivate: checkbox({ defaultValue: false }),
        largeNumber: bigInt({
          label: "Large Number Example",
          ui: {
            description: "Example field for testing BigInt values"
          }
        }),
        metadata: json({
          label: "Metadata"
        }),
        secretNote: password({
          label: "Secret Note"
        }),
      }
    }),

    ...group({
      label: "Attachments",
      description: "File attachments for the task",
      fields: {
        coverImage: image({ 
          storage: "my_images",
          label: "Cover Image"
        }),
        todoImages: relationship({
          ref: "TodoImage.todos",
          many: true,
          ui: {
            displayMode: "cards",
            cardFields: ["image", "altText", "imagePath"],
            inlineCreate: { fields: ["image", "altText", "imagePath"] },
            inlineEdit: { fields: ["image", "altText", "imagePath"] },
            inlineConnect: true,
            removeMode: "disconnect",
            linkToItem: false,
          },
        }),
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
    assignedTo: relationship({
      ref: "User.tasks",
      ui: {
        createView: {
          fieldMode: (args) =>
            permissions.canManageAllTodos(args) ? "edit" : "hidden",
        },
        itemView: {
          fieldMode: (args) =>
            permissions.canManageAllTodos(args) ? "edit" : "read",
        },
      },
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          // Default to the currently logged in user on create.
          if (
            operation === "create" &&
            !resolvedData.assignedTo &&
            context.session?.itemId
          ) {
            return { connect: { id: context.session?.itemId } };
          }
          return resolvedData.assignedTo;
        },
      },
    }),
  },
});