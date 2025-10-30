# Next Keystone Starter - Architecture Guide

## Overview

This document serves as a comprehensive knowledge base for the **next-keystone-starter** architecture. Use this guide whenever you need to build a new "OpenFront" application (e.g., OpenFront Airweave, OpenShip, etc.).

**What is next-keystone-starter?**

A boilerplate/starter template that combines:
- **KeystoneJS 6**: A powerful headless CMS and GraphQL API framework
- **Next.js**: React framework for the frontend
- **Prisma**: Database ORM (managed by Keystone)
- **PostgreSQL**: Primary database
- **ShadCN UI**: Component library for frontend

**Philosophy:**
- Backend-first approach with Keystone
- Auto-generated GraphQL API
- Role-based access control (RBAC)
- Multi-tenant support via organization scoping
- Custom mutations for business logic
- Reusable patterns across all OpenFront apps

---

## Table of Contents

1. [Understanding the Starter Models (TODO Examples)](#understanding-the-starter-models-todo-examples)
2. [Project Structure](#project-structure)
3. [Core Concepts](#core-concepts)
4. [Creating Models (Lists)](#creating-models-lists)
5. [Field Types](#field-types)
6. [Relationships](#relationships)
7. [Access Control](#access-control)
8. [Hooks](#hooks)
9. [Virtual Fields](#virtual-fields)
10. [Custom Mutations](#custom-mutations)
11. [Session Management](#session-management)
12. [Common Patterns](#common-patterns)
13. [Best Practices](#best-practices)

---

## Understanding the Starter Models (TODO Examples)

### ⚠️ IMPORTANT: Read Before You Start

The **next-keystone-starter** comes with example models (`Todo`, `TodoImage`, etc.) that serve as **teaching examples** to demonstrate how to properly implement various Keystone features.

**These models exist to help you understand:**
- How different field types work (`text`, `image`, `relationship`, `select`, etc.)
- How to set up relationships between models
- How to implement access control rules
- How to use hooks for auto-assignment and validation
- How to configure the Admin UI
- How virtual fields work
- How to structure models following best practices

### 📚 Reference Models Included

The starter typically includes these example models:

```typescript
// features/keystone/models/Todo.ts
- Demonstrates: text fields, checkbox, select, relationships, access control
- Shows: Auto-assignment of user on create
- Shows: Filtering todos by owner

// features/keystone/models/TodoImage.ts
- Demonstrates: Image uploads with S3/storage
- Shows: Relationship to parent model (Todo)
- Shows: File field configuration

// features/keystone/models/User.ts
- Demonstrates: Authentication setup
- Shows: Password hashing, role-based permissions
- Shows: Relationships to other models
- ⚠️ KEEP THIS MODEL - It's your auth foundation

// features/keystone/models/Role.ts
- Demonstrates: Permission fields (checkbox patterns)
- Shows: Role-based access control (RBAC)
- ⚠️ KEEP THIS MODEL - It's part of your auth system
```

### 🔍 How to Use These Examples

**BEFORE you start building your actual application:**

1. **Study the TODO models** - Open each file and examine:
   - Field type usage and validation rules
   - Relationship configurations
   - Access control patterns
   - Hook implementations
   - UI configuration options

2. **Run the starter app** - See how these models work in the Admin UI:
   ```bash
   npm run dev
   # Visit http://localhost:3000/dashboard
   # Create todos, upload images, see relationships in action
   ```

3. **Understand the patterns**:
   ```typescript
   // Example: Auto-assign current user (from Todo.ts)
   user: relationship({
     ref: "User.todos",
     hooks: {
       resolveInput: ({ operation, resolvedData, context }) => {
         if (operation === "create" && !resolvedData.user && context.session?.itemId) {
           return { connect: { id: context.session.itemId } };
         }
         return resolvedData.user;
       },
     },
   })

   // Example: Filter by ownership (from Todo.ts access rules)
   filter: {
     query: ({ session }) => {
       if (!session) return false;
       return { user: { id: { equals: session.itemId } } };
     },
   }
   ```

4. **Reference the field types**:
   ```typescript
   // Text field with validation
   title: text({
     validation: { isRequired: true }
   })

   // Checkbox with default
   isComplete: checkbox({
     defaultValue: false
   })

   // Select with options
   priority: select({
     options: [
       { label: "Low", value: "low" },
       { label: "Medium", value: "medium" },
       { label: "High", value: "high" },
     ],
     defaultValue: "medium",
   })

   // Image upload
   image: image({
     storage: "my_images"
   })
   ```

### 🗑️ DELETE Before Building Your App

**CRITICAL: Once you understand the patterns, DELETE the TODO models:**

```bash
# Delete these files before starting your project:
rm features/keystone/models/Todo.ts
rm features/keystone/models/TodoImage.ts
# ... delete any other example models

# KEEP these files:
# ✅ features/keystone/models/User.ts (authentication)
# ✅ features/keystone/models/Role.ts (permissions)
# ✅ features/keystone/models/trackingFields.ts (reusable timestamps)
# ✅ features/keystone/models/fields.ts (permission field definitions)
```

**Update your schema.ts:**

```typescript
// features/keystone/schema.ts
import { User, Role } from './models'
// Remove Todo, TodoImage imports

export const lists = {
  User,
  Role,
  // Remove Todo, TodoImage from here
  // Add your actual models here:
  // Product,
  // Order,
  // etc.
}
```

**Why delete them?**
- Prevents confusion between example and production code
- Keeps your codebase clean
- Avoids accidentally exposing example data in production
- Forces you to implement your own models correctly

### 🎯 Workflow Summary

```
1. Clone next-keystone-starter
   ↓
2. Run it, explore Admin UI with TODO examples
   ↓
3. Study TODO model code (field types, relationships, access control)
   ↓
4. Understand the patterns and best practices
   ↓
5. DELETE all TODO-related models
   ↓
6. Keep User, Role, trackingFields, fields.ts
   ↓
7. Start building YOUR models (Product, Order, etc.)
   ↓
8. Reference this guide + TODO patterns as needed
```

### 💡 Key Takeaway

**The TODO models are your training wheels.** Learn from them, then remove them. Don't try to build your actual application on top of the TODO examples - start fresh with your own domain models.

---

## Project Structure

```
project-root/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Dashboard routes
│   │   ├── layout.tsx
│   │   └── [resource]/page.tsx
│   └── api/
│       └── graphql/route.ts      # GraphQL endpoint
├── features/
│   ├── keystone/                 # Keystone backend
│   │   ├── index.ts              # Main Keystone config
│   │   ├── schema.ts             # Export all lists
│   │   ├── context.ts            # Context helpers
│   │   ├── access.ts             # Access control rules
│   │   ├── models/               # Data models
│   │   │   ├── User.ts
│   │   │   ├── Organization.ts
│   │   │   ├── trackingFields.ts
│   │   │   ├── fields.ts         # Shared field definitions
│   │   │   └── index.ts          # Export all models
│   │   ├── mutations/            # Custom GraphQL mutations
│   │   │   ├── index.ts
│   │   │   └── [feature].ts
│   │   ├── queries/              # Custom GraphQL queries
│   │   ├── utils/                # Utility functions
│   │   └── lib/                  # Business logic
│   ├── dashboard/                # Dashboard components
│   │   ├── components/
│   │   ├── lib/
│   │   └── hooks/
│   └── webhooks/                 # Webhook handling
├── components/                   # Shared UI components
│   └── ui/                       # ShadCN components
├── keystone.ts                   # Entry point
├── .env
└── package.json
```

---

## Core Concepts

### 1. Lists (Models)

In Keystone, **Lists** are equivalent to database tables or models. Each List:
- Defines a database table via Prisma
- Generates CRUD GraphQL operations automatically
- Has its own access control rules
- Can have hooks for business logic

### 2. Fields

**Fields** define the columns/properties of a List. Keystone provides many field types:
- `text`, `integer`, `decimal`, `checkbox`, `select`
- `timestamp`, `json`, `password`
- `relationship` (for foreign keys)
- `file`, `image` (for uploads)
- `virtual` (computed fields)

### 3. Access Control

Keystone has **granular access control** at multiple levels:
- **Operation-level**: Control create, read, update, delete operations
- **Filter-level**: Control which items a user can see/modify
- **Item-level**: Control access to specific items
- **Field-level**: Control which fields are visible/editable

### 4. Hooks

**Hooks** allow you to run custom logic at various points:
- `resolveInput`: Transform input data before saving
- `validateInput`: Validate data
- `beforeOperation`: Run logic before database operation
- `afterOperation`: Run logic after database operation

### 5. Session

Keystone sessions store the currently authenticated user's data:
- Customizable session data
- Accessible in access control rules and hooks
- Can be extended with custom fields (e.g., OAuth scopes)

---

## Creating Models (Lists)

### Basic Model Structure

**File:** `features/keystone/models/Product.ts`

```typescript
import { list } from "@keystone-6/core"
import { text, integer, decimal, relationship } from "@keystone-6/core/fields"
import { isSignedIn, permissions } from "../access"
import { trackingFields } from "./trackingFields"

export const Product = list({
  // Access control
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts,
    }
  },

  // Admin UI configuration
  ui: {
    listView: {
      initialColumns: ["name", "price", "sku", "status"],
    },
  },

  // Fields
  fields: {
    name: text({
      validation: { isRequired: true },
    }),

    sku: text({
      isIndexed: "unique",
      validation: { isRequired: true },
    }),

    price: decimal({
      precision: 10,
      scale: 2,
      validation: { isRequired: true, min: "0" },
    }),

    stock: integer({
      defaultValue: 0,
    }),

    status: select({
      options: [
        { label: "Active", value: "active" },
        { label: "Draft", value: "draft" },
        { label: "Archived", value: "archived" },
      ],
      defaultValue: "draft",
    }),

    description: text({
      ui: { displayMode: "textarea" },
    }),

    // Relationships
    category: relationship({
      ref: "Category.products",
      ui: {
        displayMode: "select",
      },
    }),

    // Timestamps
    ...trackingFields,
  },
})
```

### Exporting Models

**File:** `features/keystone/models/index.ts`

```typescript
export { User } from './User'
export { Organization } from './Organization'
export { Product } from './Product'
export { Category } from './Category'
// ... export all models
```

**File:** `features/keystone/schema.ts`

```typescript
import { User, Organization, Product, Category } from './models'

export const lists = {
  User,
  Organization,
  Product,
  Category,
}
```

---

## Field Types

### Text Fields

```typescript
// Basic text
name: text({ validation: { isRequired: true } })

// Email (with validation)
email: text({
  validation: {
    isRequired: true,
    match: { regex: /^[^@]+@[^@]+$/ }
  },
  isIndexed: "unique",
})

// Textarea
description: text({
  ui: { displayMode: "textarea" },
})

// Not filterable/orderable (for performance)
notes: text({
  isFilterable: false,
  isOrderable: false,
})
```

### Number Fields

```typescript
// Integer
quantity: integer({
  defaultValue: 0,
  validation: { min: 0, max: 9999 },
})

// Decimal (for money, percentages)
price: decimal({
  precision: 10,
  scale: 2,
  validation: { min: "0" },
})

// Float
rating: float({
  validation: { min: 0, max: 5 },
})
```

### Boolean Fields

```typescript
isActive: checkbox({ defaultValue: true })

isFeatured: checkbox({
  defaultValue: false,
  ui: {
    displayMode: "switch", // or "checkbox"
  },
})
```

### Select Fields

```typescript
status: select({
  options: [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ],
  defaultValue: "pending",
  ui: {
    displayMode: "segmented-control", // or "select" or "radio"
  },
})

// Multi-select
tags: select({
  type: "enum",
  options: [...],
  many: true, // Allows multiple selections
})
```

### Timestamp Fields

```typescript
publishedAt: timestamp({
  defaultValue: { kind: "now" },
})

scheduledFor: timestamp({
  db: { isNullable: true },
})
```

### JSON Fields

```typescript
metadata: json({
  defaultValue: {},
})

config: json({
  ui: {
    views: './custom-views/json-editor',
  },
})
```

### Password Fields

```typescript
import { password } from "@keystone-6/core/fields"

password: password({
  validation: { isRequired: true },
  // Automatically hashed by Keystone
})
```

### File & Image Fields

```typescript
import { file, image } from "@keystone-6/core/fields"

avatar: image({
  storage: "my_images", // Defined in keystone config
})

document: file({
  storage: "my_files",
})
```

---

## Relationships

### One-to-Many

**Example:** One User has many Orders

```typescript
// User.ts
export const User = list({
  fields: {
    name: text(),
    orders: relationship({
      ref: "Order.user",
      many: true,
    }),
  },
})

// Order.ts
export const Order = list({
  fields: {
    orderNumber: text(),
    user: relationship({
      ref: "User.orders",
      // No 'many: true' = many-to-one from Order side
    }),
  },
})
```

### Many-to-Many

**Example:** Products and Categories

```typescript
// Product.ts
export const Product = list({
  fields: {
    name: text(),
    categories: relationship({
      ref: "Category.products",
      many: true,
    }),
  },
})

// Category.ts
export const Category = list({
  fields: {
    name: text(),
    products: relationship({
      ref: "Product.categories",
      many: true,
    }),
  },
})
```

### One-to-One

**Example:** User and UserProfile

```typescript
// User.ts
export const User = list({
  fields: {
    email: text(),
    profile: relationship({
      ref: "UserProfile.user",
      // No 'many: true' on either side = one-to-one
    }),
  },
})

// UserProfile.ts
export const UserProfile = list({
  fields: {
    bio: text(),
    user: relationship({
      ref: "User.profile",
    }),
  },
})
```

### Self-Referencing

**Example:** Hierarchical Categories

```typescript
export const Category = list({
  fields: {
    name: text(),
    parent: relationship({
      ref: "Category.children",
    }),
    children: relationship({
      ref: "Category.parent",
      many: true,
    }),
  },
})
```

### Relationship UI Options

```typescript
relationship({
  ref: "Product.category",
  ui: {
    displayMode: "select",     // Dropdown
    // or "cards"               // Card-based UI
    // or "count"               // Just show count

    cardFields: ["name", "sku"],       // Fields to show in card mode
    inlineCreate: { fields: ["name"] }, // Allow inline creation
    inlineEdit: { fields: ["name"] },   // Allow inline editing
    linkToItem: true,                   // Link to item in admin
    inlineConnect: true,                // Allow connecting existing
  },
})
```

---

## Access Control

### Access Control Levels

Keystone provides **4 levels** of access control:

```typescript
export const Product = list({
  access: {
    // 1. Operation-level: High-level permissions
    operation: {
      query: isSignedIn,
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts,
    },

    // 2. Filter-level: Which items can be queried/modified
    filter: {
      query: rules.canReadProducts,
      update: rules.canUpdateProducts,
      delete: rules.canDeleteProducts,
    },

    // 3. Item-level: Access to specific items
    item: {
      update: itemRules.canUpdateProduct,
      delete: itemRules.canDeleteProduct,
    },
  },

  fields: {
    price: decimal({
      // 4. Field-level: Access to specific fields
      access: {
        read: fieldRules.canReadPrice,
        create: fieldRules.canSetPrice,
        update: fieldRules.canUpdatePrice,
      },
    }),
  },
})
```

### Access Functions

**File:** `features/keystone/access.ts`

```typescript
// 1. Simple boolean checks
export const isSignedIn = ({ session }: { session: any }) => {
  return !!session
}

// 2. Permission checks (from role)
export const permissions = {
  canManageProducts: ({ session }: { session: any }) => {
    return !!session?.data.role?.canManageProducts
  },

  canAccessDashboard: ({ session }: { session: any }) => {
    return !!session?.data.role?.canAccessDashboard
  },
}

// 3. Filter rules (return where clause)
export const rules = {
  canReadProducts: ({ session }: { session: any }) => {
    if (!session) return false

    // Admins see all
    if (session.data.role?.canManageProducts) {
      return true // No filter = see all
    }

    // Users see only their own
    return {
      user: { id: { equals: session.itemId } }
    }
  },

  canUpdateProducts: ({ session }: { session: any }) => {
    if (!session) return false

    // Only admins or owners can update
    if (session.data.role?.canManageProducts) return true

    return {
      user: { id: { equals: session.itemId } }
    }
  },
}

// 4. Item-level rules (access to specific item)
export const itemRules = {
  canUpdateProduct: ({ session, item }: { session: any, item: any }) => {
    if (!session) return false

    // Admin can update any
    if (session.data.role?.canManageProducts) return true

    // Owner can update their own
    return item.userId === session.itemId
  },
}

// 5. Field-level rules
export const fieldRules = {
  canReadPrice: ({ session, item }: { session: any, item: any }) => {
    // Everyone can read price
    return true
  },

  canUpdatePrice: ({ session, item }: { session: any, item: any }) => {
    // Only admins can update price
    return !!session?.data.role?.canManageProducts
  },
}
```

### Organization-Scoped Access

**Common Pattern:** Limit data to user's organization

```typescript
export const rules = {
  canReadOrganizationData: ({ session }: { session: any }) => {
    if (!session) return false

    // Get primary organization from session
    const orgId = session.data.primaryOrganizationId

    if (!orgId) return false

    // Filter by organization
    return {
      organization: { id: { equals: orgId } }
    }
  },
}
```

---

## Hooks

### Types of Hooks

1. **resolveInput**: Transform input data before validation
2. **validateInput**: Validate input data
3. **beforeOperation**: Run before database operation
4. **afterOperation**: Run after database operation

### `resolveInput` Hook

**Use Cases:**
- Auto-assign relationships
- Transform data
- Set defaults

```typescript
export const Order = list({
  fields: {
    orderNumber: text(),
    user: relationship({ ref: "User.orders" }),
    status: select({ options: [...] }),
  },

  hooks: {
    resolveInput: {
      // Run on create only
      create: ({ operation, resolvedData, context }) => {
        // Auto-assign current user
        if (!resolvedData.user && context.session?.itemId) {
          return {
            ...resolvedData,
            user: { connect: { id: context.session.itemId } }
          }
        }
        return resolvedData
      },

      // Run on both create and update
      update: ({ operation, resolvedData, context }) => {
        // Update modifiedByEmail
        return {
          ...resolvedData,
          modifiedByEmail: context.session?.email
        }
      },
    },
  },
})
```

### `validateInput` Hook

**Use Cases:**
- Custom validation logic
- Check uniqueness
- Validate relationships

```typescript
export const Product = list({
  hooks: {
    validateInput: async ({ resolvedData, addValidationError, context }) => {
      // Check if SKU already exists (custom logic)
      if (resolvedData.sku) {
        const existing = await context.query.Product.findMany({
          where: { sku: { equals: resolvedData.sku } },
          query: 'id',
        })

        if (existing.length > 0) {
          addValidationError('SKU already exists')
        }
      }

      // Validate price is positive
      if (resolvedData.price && parseFloat(resolvedData.price) < 0) {
        addValidationError('Price must be positive')
      }
    },
  },
})
```

### `beforeOperation` Hook

**Use Cases:**
- Prevent deletion with dependencies
- Log operations
- Send notifications

```typescript
export const Organization = list({
  hooks: {
    beforeOperation: async ({ operation, item, context }) => {
      if (operation === 'delete') {
        // Check if org has users
        const users = await context.query.User.findMany({
          where: { organization: { id: { equals: item.id } } },
          query: 'id',
        })

        if (users.length > 0) {
          throw new Error('Cannot delete organization with users')
        }
      }
    },
  },
})
```

### `afterOperation` Hook

**Use Cases:**
- Send emails
- Create related records
- Sync to external services

```typescript
export const Order = list({
  hooks: {
    afterOperation: async ({ operation, item, context }) => {
      if (operation === 'create') {
        // Send confirmation email
        await sendOrderConfirmationEmail(item.email, item.orderNumber)

        // Create initial order status
        await context.sudo().query.OrderStatus.createOne({
          data: {
            order: { connect: { id: item.id } },
            status: 'pending',
            timestamp: new Date(),
          },
        })
      }
    },
  },
})
```

---

## Virtual Fields

**Virtual fields** are computed fields that don't exist in the database.

### Basic Virtual Field

```typescript
import { virtual } from "@keystone-6/core/fields"
import { graphql } from "@keystone-6/core"

export const Product = list({
  fields: {
    name: text(),
    price: decimal({ precision: 10, scale: 2 }),
    taxRate: decimal({ precision: 5, scale: 2, defaultValue: "0.10" }),

    // Virtual field: price with tax
    priceWithTax: virtual({
      field: graphql.field({
        type: graphql.Float,
        resolve(item: any) {
          const price = parseFloat(item.price || 0)
          const taxRate = parseFloat(item.taxRate || 0)
          return price * (1 + taxRate)
        },
      }),
    }),
  },
})
```

### Virtual Field with Async Logic

```typescript
export const User = list({
  fields: {
    email: text(),
    orders: relationship({ ref: "Order.user", many: true }),

    // Virtual field: total order count
    orderCount: virtual({
      field: graphql.field({
        type: graphql.Int,
        async resolve(item: any, args: any, context: any) {
          const orders = await context.query.Order.findMany({
            where: { user: { id: { equals: item.id } } },
            query: 'id',
          })
          return orders.length
        },
      }),
    }),
  },
})
```

### Virtual Field with Arguments

```typescript
export const Shop = list({
  fields: {
    name: text(),

    // Virtual field with args
    webhooks: virtual({
      field: graphql.field({
        type: graphql.JSON,
        args: {
          filter: graphql.arg({ type: graphql.String }),
        },
        async resolve(item: any, args: any, context: any): Promise<any> {
          const shop = await context.query.Shop.findOne({
            where: { id: item.id },
            query: 'platform { getWebhooksFunction }',
          })

          // Call external API or adapter
          const result = await getWebhooks(shop, args.filter)

          return {
            success: true,
            data: result,
          }
        },
      }),
    }),
  },
})
```

---

## Custom Mutations

Extend Keystone's GraphQL schema with custom business logic.

### Basic Mutation

**File:** `features/keystone/mutations/placeOrder.ts`

```typescript
import { graphql } from "@keystone-6/core"

export const placeOrder = graphql.field({
  type: graphql.object<{ success: boolean, orderId: string }>()({
    name: 'PlaceOrderResult',
    fields: {
      success: graphql.field({ type: graphql.nonNull(graphql.Boolean) }),
      orderId: graphql.field({ type: graphql.String }),
      error: graphql.field({ type: graphql.String }),
    },
  }),

  args: {
    cartId: graphql.arg({ type: graphql.nonNull(graphql.ID) }),
  },

  async resolve(source, args, context) {
    // Check authentication
    if (!context.session) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get cart with items
    const cart = await context.query.Cart.findOne({
      where: { id: args.cartId },
      query: `
        id
        items {
          id
          product { id name price }
          quantity
        }
        user { id email }
      `,
    })

    if (!cart) {
      return { success: false, error: 'Cart not found' }
    }

    // Create order
    const order = await context.sudo().query.Order.createOne({
      data: {
        user: { connect: { id: cart.user.id } },
        status: 'pending',
        items: {
          create: cart.items.map((item: any) => ({
            product: { connect: { id: item.product.id } },
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      query: 'id orderNumber',
    })

    // Clear cart
    await context.sudo().query.Cart.deleteOne({
      where: { id: args.cartId },
    })

    return { success: true, orderId: order.id }
  },
})
```

### Extend GraphQL Schema

**File:** `features/keystone/mutations/index.ts`

```typescript
import { graphql } from "@keystone-6/core"
import { placeOrder } from "./placeOrder"
import { triggerSync } from "./triggerSync"

export const extendGraphqlSchema = graphql.extend((base) => ({
  mutation: {
    placeOrder,
    triggerSync,
  },
  query: {
    // Custom queries go here
  },
}))
```

### Use in Keystone Config

**File:** `features/keystone/index.ts`

```typescript
import { config } from "@keystone-6/core"
import { extendGraphqlSchema } from "./mutations"

export default config({
  // ...
  graphql: {
    extendGraphqlSchema,
  },
})
```

---

## Session Management

### Basic Session Configuration

**File:** `features/keystone/index.ts`

```typescript
import { createAuth } from "@keystone-6/auth"
import { statelessSessions } from "@keystone-6/core/session"

const sessionConfig = {
  maxAge: 60 * 60 * 24 * 30, // 30 days
  secret: process.env.SESSION_SECRET,
}

const { withAuth } = createAuth({
  listKey: "User",
  identityField: "email",
  secretField: "password",

  // Data to include in session
  sessionData: `
    id
    name
    email
    role {
      id
      canAccessDashboard
      canManageProducts
      canManageOrders
    }
  `,
})

export default withAuth(
  config({
    // ...
    session: statelessSessions(sessionConfig),
  })
)
```

### Custom Session Handler (OpenFront Pattern)

Extend session to support **API keys, OAuth tokens, and customer tokens**.

**File:** `features/keystone/index.ts`

```typescript
import Iron from "@hapi/iron"
import * as cookie from "cookie"
import bcryptjs from "bcryptjs"

export function statelessSessions({ secret, maxAge, ... }) {
  return {
    async get({ context }: { context: any }) {
      if (!context?.req) return

      // Check for Bearer token
      const authHeader = context.req.headers.authorization

      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "")

        // 1. Try API key authentication
        if (token.startsWith("of_")) {
          const apiKeys = await context.sudo().query.ApiKey.findMany({
            where: { status: { equals: 'active' } },
            query: 'id user { id } tokenSecret { isSet }',
          })

          for (const apiKey of apiKeys) {
            const fullKey = await context.sudo().db.ApiKey.findOne({
              where: { id: apiKey.id },
            })

            const isValid = await bcryptjs.compare(token, fullKey.tokenSecret)

            if (isValid) {
              return {
                itemId: apiKey.user.id,
                listKey: "User",
                apiKeyScopes: apiKey.scopes || [],
              }
            }
          }
        }

        // 2. Try OAuth token
        const oauthToken = await context.sudo().query.OAuthToken.findOne({
          where: { token },
          query: 'user { id } scopes',
        })

        if (oauthToken) {
          return {
            itemId: oauthToken.user.id,
            listKey: "User",
            oauthScopes: oauthToken.scopes,
          }
        }

        // 3. Try customer token
        if (token.startsWith("ctok_")) {
          const user = await context.sudo().query.User.findOne({
            where: { customerToken: { equals: token } },
            query: 'id',
          })

          if (user) {
            return {
              itemId: user.id,
              listKey: "User",
              customerToken: true,
            }
          }
        }
      }

      // Fall back to session cookie
      const cookies = cookie.parse(context.req.headers.cookie || "")
      const sessionToken = cookies["keystonejs-session"]

      if (!sessionToken) return

      return await Iron.unseal(sessionToken, secret, Iron.defaults)
    },

    async start({ context, data }) { ... },
    async end({ context }) { ... },
  }
}
```

---

## Common Patterns

### 1. Tracking Fields (Created/Updated At)

**File:** `features/keystone/models/trackingFields.ts`

```typescript
import { timestamp } from "@keystone-6/core/fields"

export const trackingFields = {
  createdAt: timestamp({
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: {
      createView: { fieldMode: "hidden" },
      itemView: { fieldMode: "read" },
    },
  }),

  updatedAt: timestamp({
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: {
      createView: { fieldMode: "hidden" },
      itemView: { fieldMode: "read" },
    },
    hooks: {
      resolveInput: ({ operation }) => {
        if (operation === "update") return new Date()
        return undefined
      },
    },
  }),
}
```

**Usage:**

```typescript
export const Product = list({
  fields: {
    name: text(),
    ...trackingFields,
  },
})
```

---

### 2. Created/Modified By (Audit Trail)

```typescript
export const auditFields = {
  createdByEmail: text({
    ui: { createView: { fieldMode: "hidden" } },
  }),

  modifiedByEmail: text({
    ui: { createView: { fieldMode: "hidden" } },
  }),
}

// Hook to auto-populate
export const auditHooks = {
  resolveInput: {
    create: ({ resolvedData, context }) => ({
      ...resolvedData,
      createdByEmail: context.session?.email,
      modifiedByEmail: context.session?.email,
    }),
    update: ({ resolvedData, context }) => ({
      ...resolvedData,
      modifiedByEmail: context.session?.email,
    }),
  },
}
```

---

### 3. Organization Scoping

**Pattern:** Auto-assign organization on create

```typescript
export const Product = list({
  fields: {
    name: text(),
    organization: relationship({ ref: "Organization" }),
  },

  hooks: {
    resolveInput: {
      create: ({ resolvedData, context }) => {
        if (!resolvedData.organization && context.session?.primaryOrganizationId) {
          return {
            ...resolvedData,
            organization: {
              connect: { id: context.session.primaryOrganizationId }
            }
          }
        }
        return resolvedData
      },
    },
  },
})
```

---

### 4. Soft Delete

```typescript
export const Product = list({
  fields: {
    name: text(),
    isDeleted: checkbox({ defaultValue: false }),
    deletedAt: timestamp({ db: { isNullable: true } }),
  },

  access: {
    filter: {
      query: ({ session }) => {
        // Hide deleted items from regular queries
        return { isDeleted: { equals: false } }
      },
    },
  },

  hooks: {
    beforeOperation: async ({ operation, context, item }) => {
      if (operation === 'delete') {
        // Prevent hard delete, do soft delete instead
        await context.sudo().query.Product.updateOne({
          where: { id: item.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        })

        // Cancel the delete operation
        throw new Error('Item soft-deleted')
      }
    },
  },
})
```

---

### 5. Readable IDs (Slugs)

```typescript
import { nanoid } from 'nanoid'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

export const Collection = list({
  fields: {
    name: text({ validation: { isRequired: true } }),
    readableId: text({ isIndexed: "unique" }),
  },

  hooks: {
    resolveInput: {
      create: ({ resolvedData }) => {
        if (!resolvedData.readableId) {
          return {
            ...resolvedData,
            readableId: `${slugify(resolvedData.name)}-${nanoid(8)}`,
          }
        }
        return resolvedData
      },
    },
  },
})
```

---

## Best Practices

### 0. Starting a New Project

- **⚠️ DELETE the TODO models first**: Before building your app, remove `Todo.ts`, `TodoImage.ts`, and any other example models (see [Understanding the Starter Models](#understanding-the-starter-models-todo-examples))
- **Keep User and Role models**: These are your authentication foundation
- **Keep trackingFields.ts and fields.ts**: These are reusable utilities
- **Study before deleting**: Understand the patterns in TODO models, then remove them
- **Start clean**: Build your actual domain models from scratch

### 1. Model Organization

- **One file per model**: `features/keystone/models/Product.ts`
- **Group related models**: Put models in subdirectories if needed
- **Export from index**: Use `features/keystone/models/index.ts`

### 2. Access Control

- **Layer your access control**: Use all 4 levels when needed
- **Start restrictive**: Default to no access, then grant
- **Test thoroughly**: Write tests for access rules
- **Use helpers**: Create reusable access functions

### 3. Hooks

- **Keep hooks simple**: Complex logic should be in utility functions
- **Use sudo() carefully**: Only when bypassing access control is necessary
- **Avoid side effects**: Minimize external calls in hooks
- **Handle errors**: Always catch and handle errors in async hooks

### 4. Relationships

- **Use meaningful names**: `ref: "Product.category"` not `ref: "Category"`
- **Configure UI**: Set `displayMode` for better UX
- **Index foreign keys**: Keystone does this automatically
- **Avoid circular dependencies**: Be careful with self-references

### 5. Performance

- **Add indexes**: Use `isIndexed: true` for frequently queried fields
- **Limit virtual fields**: They can be expensive
- **Use `isFilterable: false`**: For large text fields
- **Paginate large lists**: Use `take` and `skip` in queries

### 6. Security

- **Validate input**: Use `validateInput` hooks
- **Sanitize data**: Never trust user input
- **Use HTTPS**: In production
- **Rotate secrets**: Regularly update SESSION_SECRET
- **Rate limit**: Add rate limiting to GraphQL API

### 7. Database

- **Use migrations**: Always run `keystone dev` to generate migrations
- **Backup regularly**: Especially before schema changes
- **Monitor queries**: Use Prisma query logging
- **Optimize indexes**: Review slow query logs

---

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to database"

- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Run `npm run dev` to apply migrations

#### 2. "Field X does not exist on type Y"

- Run migrations: `npm run dev`
- Check for typos in field names
- Ensure field is exported in schema

#### 3. "Access denied"

- Check access control rules
- Verify session data includes required fields
- Test with `context.sudo()` to bypass access control

#### 4. "Circular dependency detected"

- Check relationship `ref` attributes
- Avoid circular imports in model files
- Use lazy loading for complex relationships

---

## Example: Building a Simple Blog

Let's tie everything together with a complete example.

### Models

```typescript
// User.ts
export const User = list({
  access: { operation: { query: () => true } },
  fields: {
    name: text({ validation: { isRequired: true } }),
    email: text({ isIndexed: "unique", validation: { isRequired: true } }),
    password: password({ validation: { isRequired: true } }),
    posts: relationship({ ref: "Post.author", many: true }),
    ...trackingFields,
  },
})

// Post.ts
export const Post = list({
  access: {
    operation: {
      query: () => true,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      update: rules.canUpdatePost,
      delete: rules.canDeletePost,
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    slug: text({ isIndexed: "unique" }),
    content: text({ ui: { displayMode: "textarea" } }),
    status: select({
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      defaultValue: "draft",
    }),
    publishedAt: timestamp(),
    author: relationship({ ref: "User.posts" }),
    categories: relationship({ ref: "Category.posts", many: true }),
    ...trackingFields,
  },
  hooks: {
    resolveInput: {
      create: ({ resolvedData, context }) => ({
        ...resolvedData,
        author: resolvedData.author || { connect: { id: context.session.itemId } },
        slug: resolvedData.slug || slugify(resolvedData.title),
      }),
    },
  },
})

// Category.ts
export const Category = list({
  access: { operation: { query: () => true } },
  fields: {
    name: text({ validation: { isRequired: true } }),
    slug: text({ isIndexed: "unique" }),
    posts: relationship({ ref: "Post.categories", many: true }),
  },
})
```

### Access Rules

```typescript
export const rules = {
  canUpdatePost: ({ session }: { session: any }) => {
    if (!session) return false
    return {
      author: { id: { equals: session.itemId } }
    }
  },

  canDeletePost: ({ session }: { session: any }) => {
    if (!session) return false
    return {
      author: { id: { equals: session.itemId } }
    }
  },
}
```

### Custom Mutation

```typescript
export const publishPost = graphql.field({
  type: graphql.object<{ success: boolean }>()({
    name: 'PublishPostResult',
    fields: {
      success: graphql.field({ type: graphql.nonNull(graphql.Boolean) }),
    },
  }),
  args: {
    postId: graphql.arg({ type: graphql.nonNull(graphql.ID) }),
  },
  async resolve(source, args, context) {
    await context.query.Post.updateOne({
      where: { id: args.postId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    })
    return { success: true }
  },
})
```

---

## Conclusion

This guide covers the **core patterns and best practices** for building applications with the next-keystone-starter architecture. Use it as a reference whenever you start a new OpenFront project.

**Key Takeaways:**
1. Models (Lists) define your database schema
2. Access control has 4 levels: operation, filter, item, field
3. Hooks enable custom business logic
4. Virtual fields provide computed data
5. Custom mutations extend the GraphQL API
6. Session management can be extended for API keys, OAuth, etc.
7. Common patterns (tracking fields, audit trails, organization scoping) should be reused

**Next Steps:**
1. Clone the next-keystone-starter repo
2. **Study the TODO models** - Understand how they implement various Keystone features
3. **Delete the TODO models** - Remove example models before building your app
4. Keep User, Role, trackingFields, and fields.ts
5. Start with your core models (User is already there, add Organization, etc.)
6. Build incrementally, testing as you go
7. Refer to OpenShip and OpenFront for examples

**Remember:** The TODO models are teaching examples - learn from them, then delete them! 🗑️

Happy building! 🚀
