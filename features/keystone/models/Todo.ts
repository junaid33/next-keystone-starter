import { list } from '@keystone-6/core'
import { allOperations } from '@keystone-6/core/access'
import { checkbox, relationship, text } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'

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
    hideCreate: args => !permissions.canCreateTodos(args),
    listView: {
      initialColumns: ['label', 'isComplete', 'assignedTo'],
    },
  },
  fields: {
    label: text({ validation: { isRequired: true } }),
    isComplete: checkbox({ defaultValue: false }),
    isPrivate: checkbox({ defaultValue: false }),
    assignedTo: relationship({
      ref: 'User.tasks',
      ui: {
        createView: {
          fieldMode: args => (permissions.canManageAllTodos(args) ? 'edit' : 'hidden'),
        },
        itemView: {
          fieldMode: args => (permissions.canManageAllTodos(args) ? 'edit' : 'read'),
        },
      },
      hooks: {
        resolveInput: {
          create({ operation, resolvedData, context }) {
            if (!resolvedData.assignedTo && context.session) {
              return { connect: { id: context.session.itemId } }
            }
            return resolvedData.assignedTo
          },
        },
      },
    }),
  },
});