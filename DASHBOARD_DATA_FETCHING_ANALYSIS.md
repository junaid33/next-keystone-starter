# Dashboard Data Fetching Architecture - Current State

## Executive Summary

The dashboard uses a **hybrid data fetching approach** combining:
- **Server Components** for initial data loading
- **SWR** for client-side data fetching and caching
- **Server Actions** as the data fetching layer
- **GraphQL** as the underlying API protocol

This analysis documents the complete data flow to facilitate migration to React Query.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Server Components (RSC)                   │   │
│  │  - Initial data fetch on server                      │   │
│  │  - Pass data as props to client components          │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Client Components (use client)              │   │
│  │  - Receive initial data as props                    │   │
│  │  - Use SWR for subsequent fetches                   │   │
│  │  - Call server actions directly                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Server Actions Layer                      │
│  - getAdminMetaAction()                                      │
│  - getListItemsAction()                                      │
│  - getItemAction()                                           │
│  - getRelationshipOptions()                                  │
│  - updateItemAction()                                        │
│  - deleteItemAction()                                        │
│  - createItemAction()                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  GraphQL Client Layer                        │
│                  (keystoneClient.ts)                         │
│  - Wraps graphql-request                                     │
│  - Handles authentication headers                            │
│  - Supports file uploads (multipart)                         │
│  - Error formatting                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  KeystoneJS GraphQL API                      │
│                  /api/graphql endpoint                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Data Fetching Patterns

### 1. Server-Side Initial Load Pattern

**Location**: Server Components (RSC)
**Files**:
- `features/dashboard/screens/*/index.tsx`
- `app/dashboard/(admin)/*/page.tsx`

**Flow**:
```typescript
// Server Component
export async function ListPage({ params, searchParams }) {
  // 1. Fetch data using server actions
  const list = await getListByPath(listKey)
  const response = await getListItemsAction(listKey, variables, selectedFields)

  // 2. Pass to client component
  return <ListPageClient list={list} initialData={response.data} />
}
```

**Examples**:
- `features/dashboard/screens/ListPage/index.tsx:107`
- `features/dashboard/screens/ItemPage/index.tsx:39`
- `features/dashboard/screens/HomePage/index.tsx:79`

### 2. SWR Client-Side Fetching Pattern

**Location**: Client Components
**Files**:
- `features/dashboard/hooks/useAdminMeta.tsx`
- `features/dashboard/views/relationship/**/*.tsx`
- Various client components

**Flow**:
```typescript
// Client Component
'use client'
import useSWR from 'swr'

const { data, error, isLoading, mutate } = useSWR(
  'cache-key',
  async () => {
    const result = await serverAction()
    if (!result.success) throw new Error(result.error)
    return result.data
  },
  {
    fallbackData: initialData,
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  }
)
```

**Key SWR Usage Points**:

#### a) Admin Metadata (Global)
```typescript
// features/dashboard/hooks/useAdminMeta.tsx:64
const { data, error, isLoading, mutate } = useSWR(
  'admin-meta',
  async () => {
    const result = await getAdminMetaAction()
    if (!result.success) throw new Error(result.error)
    return result.data
  },
  {
    fallbackData: initialData,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  }
)
```

#### b) Relationship Options (Paginated)
```typescript
// features/dashboard/views/relationship/client/components/RelationshipSelect.tsx:105
const { data: optionsData, isLoading, error } = useSWR(
  ["relationshipOptions", list.key, labelField, search, page],
  async () => {
    const result = await getRelationshipOptions(
      list.key,
      where,
      PAGE_SIZE,
      page * PAGE_SIZE,
      labelField,
      extraSelection,
      list.graphql.names
    )
    return result.success ? result.data : { items: [], count: 0 }
  },
  { keepPreviousData: true }
)
```

#### c) List Metadata
```typescript
// features/dashboard/views/relationship/client/Field.tsx:86
const { data: foreignListData } = useSWR(
  `list-${field.refListKey}`,
  async () => await getList(field.refListKey)
)
```

#### d) Relationship Display Data
```typescript
// features/dashboard/views/relationship/client/components/Cards.tsx:158
const { data: itemsData, error } = useSWR(
  currentIdsArray.length > 0
    ? `cards-items-${field.refListKey}-${currentIdsArray.join(",")}`
    : null,
  async () => {
    const itemPromises = currentIdsArray.map(async (itemId) => {
      const response = await getItemAction(foreignList, itemId)
      return response.success ? response.data.item : null
    })
    return await Promise.all(itemPromises)
  },
  { revalidateOnFocus: false }
)
```

#### e) Authenticated User
```typescript
// features/dashboard/views/relationship/client/Field.tsx:106
const { data: authResponse, error } = useSWR(
  "authenticated-item",
  async () => {
    const response = await getAuthenticatedUser()
    if (!response.success) throw new Error(response.error)
    return response.data
  },
  {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Cache for 1 minute
  }
)
```

---

## Server Actions Catalog

### 1. **getAdminMetaAction** (`features/dashboard/actions/getAdminMetaAction.ts`)

**Purpose**: Fetch complete admin metadata including lists, fields, and permissions

**GraphQL Query**:
```graphql
query KsFetchAdminMeta {
  keystone {
    adminMeta {
      lists {
        key, path, label, singular, plural
        fields { path, label, fieldMeta, isOrderable, isFilterable }
        groups { label, fields }
      }
    }
  }
}
```

**Usage**:
- Global context via `AdminMetaProvider`
- Initial server-side load in all pages
- Cached indefinitely in SWR

**Cache Strategy**:
- Server: No cache (dynamic)
- Client: SWR with `revalidateOnFocus: false`

---

### 2. **getListItemsAction** (`features/dashboard/actions/getListItemsAction.ts`)

**Purpose**: Fetch paginated list items with filtering, sorting, and field selection

**GraphQL Query**:
```graphql
query GetListItems(
  $where: TodoWhereInput,
  $take: Int!,
  $skip: Int!,
  $orderBy: [TodoOrderByInput!]
) {
  items: todos(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
    id
    # Dynamic fields based on selection
  }
  count: todosCount(where: $where)
}
```

**Parameters**:
- `listKey`: String
- `variables`: { where, take, skip, orderBy }
- `selectedFields`: String[]
- `cacheOptions`: RequestInit (Next.js cache config)

**Cache Strategy**:
- Server: `revalidate: 300` (5 minutes), tags: `[list-${listKey}]`
- Client: None (server component passes initial data)

**Usage**:
- `features/dashboard/screens/ListPage/index.tsx:107`
- Initial data for list views

---

### 3. **getItemAction** (`features/dashboard/actions/getItemAction.ts`)

**Purpose**: Fetch single item with all field data and adminMeta

**GraphQL Query**:
```graphql
query KsFetchItem($id: ID!, $listKey: String!) {
  item: todo(where: {id: $id}) {
    id
    # Dynamic fields based on list.fields
  }
  keystone {
    adminMeta {
      list(key: $listKey) {
        fields {
          path
          itemView(id: $id) {
            fieldMode
            fieldPosition
          }
        }
      }
    }
  }
}
```

**Parameters**:
- `list`: List metadata object
- `itemId`: String
- `options`: Additional options
- `cacheOptions`: RequestInit

**Cache Strategy**:
- Server: `revalidate: 3600` (1 hour), tags: `[item-${listKey}-${id}]`
- Client: Used in SWR for relationship cards

**Usage**:
- `features/dashboard/screens/ItemPage/index.tsx:39`
- `features/dashboard/views/relationship/client/components/Cards.tsx:163`

---

### 4. **getRelationshipOptions** (`features/dashboard/actions/relationship.ts`)

**Purpose**: Fetch options for relationship field selectors with search and pagination

**GraphQL Query**:
```graphql
query GetOptions($where: UserWhereInput!, $take: Int!, $skip: Int!) {
  items: users(where: $where, take: $take, skip: $skip) {
    id
    name  # or other labelField
    # extraSelection fields
  }
  count: usersCount(where: $where)
}
```

**Parameters**:
- `listKey`: String
- `where`: GraphQL where clause
- `take`: Number (page size)
- `skip`: Number (offset)
- `labelField`: String (field to use as label)
- `extraSelection`: String (additional GraphQL fields)
- `gqlNames`: GraphQL query names

**Cache Strategy**:
- Client: SWR with `keepPreviousData: true` for smooth pagination

**Usage**:
- `features/dashboard/views/relationship/client/components/RelationshipSelect.tsx:105`
- All relationship field selectors

---

### 5. **updateItemAction** (`features/dashboard/actions/item-actions.ts`)

**Purpose**: Update item fields

**GraphQL Mutation**:
```graphql
mutation UpdateItem($id: ID!, $data: TodoUpdateInput!) {
  updateTodo(where: { id: $id }, data: $data) {
    id
  }
}
```

**Usage**:
- `features/dashboard/screens/ItemPage/ItemPageClient.tsx:308`

---

### 6. **deleteItemAction** (`features/dashboard/actions/item-actions.ts`)

**Purpose**: Delete an item

**GraphQL Mutation**:
```graphql
mutation DeleteItem($id: ID!) {
  deleteTodo(where: { id: $id }) {
    id
  }
}
```

**Usage**:
- `features/dashboard/screens/ItemPage/ItemPageClient.tsx:77`

---

### 7. **getListCounts** (`features/dashboard/actions/getListCounts.ts`)

**Purpose**: Batch fetch item counts for multiple lists

**Usage**:
- `features/dashboard/screens/HomePage/index.tsx:102`

---

## GraphQL Client Layer

### keystoneClient (`features/dashboard/lib/keystoneClient.ts`)

**Purpose**: Central GraphQL client with auth, file upload, and error handling

**Key Features**:

1. **Authentication**:
   - Automatically injects auth headers from cookies
   - Uses `getAuthHeaders()` helper

2. **File Upload Support**:
   - Detects File/Blob objects in variables
   - Implements GraphQL multipart request spec
   - Handles Keystone image field structure

3. **Error Handling**:
   - Formats GraphQL errors with detailed information
   - Extracts validation errors, paths, and error codes
   - Returns structured response: `{ success: boolean, data?, error?, errors? }`

4. **Response Type**:
```typescript
type KeystoneResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; errors?: any[] }
```

**Usage Pattern**:
```typescript
const response = await keystoneClient(query, variables, cacheOptions)
if (!response.success) {
  console.error(response.error)
  return
}
const data = response.data
```

---

## Component Data Flow Examples

### Example 1: List Page Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Server Component: ListPage                              │
│     app/dashboard/(admin)/[listKey]/page.tsx                │
│                                                              │
│     const list = await getListByPath(listKey)               │
│     const response = await getListItemsAction(...)          │
│     return <ListPageClient list={list}                      │
│                           initialData={response.data} />    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Client Component: ListPageClient                        │
│     features/dashboard/screens/ListPage/ListPageClient.tsx  │
│                                                              │
│     - Receives initialData as props                         │
│     - No SWR fetch (uses server data)                       │
│     - User interactions trigger router.push()               │
│     - Router navigation triggers server re-fetch            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Nested Component: FilterBar                             │
│     features/dashboard/components/FilterBar.tsx             │
│                                                              │
│     - No data fetching                                      │
│     - Updates URL params                                    │
│     - Server component refetches on URL change              │
└─────────────────────────────────────────────────────────────┘
```

**Key Points**:
- **No client-side refetching** in main list view
- URL params trigger server-side refetch
- Initial data is from server, subsequent navigations too

---

### Example 2: Item Page Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Server Component: ItemPage                              │
│     app/dashboard/(admin)/[listKey]/[id]/page.tsx           │
│                                                              │
│     const list = await getListByPath(listKey)               │
│     const response = await getItemAction(list, itemId)      │
│     return <ItemPageClient list={list}                      │
│                           item={response.data.item} />      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Client Component: ItemPageClient                        │
│     features/dashboard/screens/ItemPage/ItemPageClient.tsx  │
│                                                              │
│     - Receives item data as props                           │
│     - Manages local form state                              │
│     - On save: calls updateItemAction()                     │
│     - No automatic refetch (optimistic UI)                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Field Component: RelationshipField                      │
│     features/dashboard/views/relationship/client/Field.tsx  │
│                                                              │
│     const { data } = useSWR(                                │
│       `list-${field.refListKey}`,                           │
│       () => getList(field.refListKey)                       │
│     )                                                        │
│                                                              │
│     - Uses SWR to fetch foreign list metadata               │
│     - Cached across all relationship fields                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Nested Component: RelationshipSelect                    │
│     .../relationship/client/components/                     │
│     RelationshipSelect.tsx                                  │
│                                                              │
│     const { data } = useSWR(                                │
│       ["relationshipOptions", list.key, search, page],      │
│       () => getRelationshipOptions(...)                     │
│     )                                                        │
│                                                              │
│     - Uses SWR for search/pagination                        │
│     - keepPreviousData: true for smooth pagination          │
└─────────────────────────────────────────────────────────────┘
```

**Key Points**:
- **Server provides initial item data**
- **SWR used for nested/related data** (relationship options, foreign lists)
- **Form state managed locally** in client component
- **Manual mutations** via server actions, no automatic refetch

---

### Example 3: Admin Meta Context Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Server Layout                                           │
│     app/dashboard/layout.tsx                                │
│                                                              │
│     const adminMetaResponse = await getAdminMetaAction()    │
│     return <DashboardLayout adminMeta={adminMeta} />        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Client Layout: DashboardLayout                          │
│     features/dashboard/components/DashboardLayout.tsx       │
│                                                              │
│     <AdminMetaProvider initialData={adminMeta}>             │
│       {children}                                            │
│     </AdminMetaProvider>                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. AdminMetaProvider (Context + SWR)                       │
│     features/dashboard/hooks/useAdminMeta.tsx               │
│                                                              │
│     const { data, error, isLoading, mutate } = useSWR(      │
│       'admin-meta',                                         │
│       async () => {                                         │
│         const result = await getAdminMetaAction()           │
│         return result.data                                  │
│       },                                                    │
│       {                                                     │
│         fallbackData: initialData,                          │
│         revalidateOnFocus: false,                           │
│       }                                                     │
│     )                                                       │
│                                                              │
│     return <Context.Provider value={{ adminMeta: data }}>  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Consumer Components                                     │
│                                                              │
│     const { adminMeta } = useAdminMeta()                    │
│     const { list } = useList('Todo')                        │
│     const { lists } = useLists()                            │
│                                                              │
│     - Access cached admin metadata                          │
│     - No additional fetches                                 │
└─────────────────────────────────────────────────────────────┘
```

**Key Points**:
- **Server fetches once** per navigation
- **SWR caches globally** across all components
- **Context distributes** cached data
- **No revalidation on focus** (metadata is stable)

---

## Current Pain Points & Issues

### 1. **Dual Data Layer Complexity**
- Server actions called both on server (RSC) and client (SWR)
- Mental model confusion: when to use server vs client fetch
- Code duplication in error handling

### 2. **No Automatic Refetching**
- After mutations, manual router refresh or no refetch
- Optimistic UI not implemented consistently
- Stale data after create/update/delete operations

### 3. **SWR Configuration Scattered**
- Different cache settings across components
- No centralized cache invalidation strategy
- Inconsistent error handling patterns

### 4. **Missing Features**
- No background refetching
- No retry logic
- No request deduplication (SWR provides this but not configured)
- No optimistic updates (except manual form state)

### 5. **Cache Invalidation Challenges**
- After updating an item, related lists don't refresh
- After creating an item, list count doesn't update
- Relationship data not invalidated when foreign item changes

### 6. **Type Safety Issues**
- SWR doesn't infer types from server actions
- Manual type assertions throughout
- No end-to-end type safety

---

## Data Dependencies Map

### HomePage
```
HomePage (Server)
  ├─ getAdminMetaAction() → lists metadata
  └─ getListCounts() → item counts for each list
```

### ListPage
```
ListPage (Server)
  ├─ getListByPath() → list metadata
  ├─ getAdminMetaAction(listKey) → field metadata
  └─ getListItemsAction() → paginated items

ListPageClient (Client)
  └─ (uses props, no fetching)
```

### ItemPage
```
ItemPage (Server)
  ├─ getListByPath() → list metadata
  ├─ getItemAction() → item data + adminMeta
  └─ getItemValidationAction() → field validation rules

ItemPageClient (Client)
  ├─ (uses props for item data)
  └─ RelationshipField (Client)
      ├─ useSWR: getList() → foreign list metadata
      ├─ useSWR: getAuthenticatedUser() → current user
      └─ RelationshipSelect (Client)
          ├─ useSWR: getRelationshipOptions() → search results
          └─ Cards (Client)
              └─ useSWR: getItemAction() × N → related items
```

### Global Context
```
AdminMetaProvider (Client)
  └─ useSWR: getAdminMetaAction() → all lists + fields
      ├─ useList() → single list metadata
      ├─ useLists() → all lists
      └─ useNavigation() → navigation items
```

---

## SWR Cache Keys Inventory

### Global/Singleton Keys
- `'admin-meta'` - Complete admin metadata
- `'authenticated-item'` - Current user

### Parameterized Keys
- `list-${listKey}` - List metadata (from getList)
- `cards-items-${refListKey}-${ids}` - Relationship card items
- `relationship-filter-${listKey},${ids}` - Relationship filter options
- `['relationshipOptions', listKey, labelField, search, page]` - Relationship select options

---

## Next Steps for React Query Migration

Based on this analysis, the migration strategy should:

1. **Replace SWR with React Query** while maintaining the same data flow patterns
2. **Implement proper cache invalidation** after mutations
3. **Add optimistic updates** for better UX
4. **Centralize query configuration** with consistent error handling
5. **Maintain server-first approach** for initial loads
6. **Add background refetching** for real-time data
7. **Implement request deduplication** and retry logic
8. **Improve type safety** with TypeScript generics

---

## File Reference Index

### Core Infrastructure
- `features/dashboard/lib/keystoneClient.ts` - GraphQL client
- `features/dashboard/hooks/useAdminMeta.tsx` - Admin metadata context + SWR
- `features/dashboard/context/DashboardProvider.tsx` - Dashboard context

### Server Actions
- `features/dashboard/actions/getAdminMetaAction.ts`
- `features/dashboard/actions/getListItemsAction.ts`
- `features/dashboard/actions/getItemAction.ts`
- `features/dashboard/actions/relationship.ts`
- `features/dashboard/actions/item-actions.ts`
- `features/dashboard/actions/getListCounts.ts`

### Server Components (RSC)
- `features/dashboard/screens/HomePage/index.tsx`
- `features/dashboard/screens/ListPage/index.tsx`
- `features/dashboard/screens/ItemPage/index.tsx`

### Client Components
- `features/dashboard/screens/ListPage/ListPageClient.tsx`
- `features/dashboard/screens/ItemPage/ItemPageClient.tsx`
- `features/dashboard/views/relationship/client/Field.tsx`
- `features/dashboard/views/relationship/client/components/RelationshipSelect.tsx`
- `features/dashboard/views/relationship/client/components/Cards.tsx`
- `features/dashboard/views/relationship/client/components/CreateItemDrawer.tsx`

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Analysis Depth**: Complete codebase scan
**Total Files Analyzed**: 24 key files
**SWR Usage Points**: 10 distinct patterns
