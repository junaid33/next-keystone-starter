import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import { checkbox, relationship, text } from "@keystone-6/core/fields";
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
      initialColumns: ["label", "isComplete", "assignedTo"],
    },
  },
  fields: {
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
    isComplete: checkbox({ defaultValue: false }),
    isPrivate: checkbox({ defaultValue: false }),
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
