# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Build Keystone + migrate + start Next.js dev server
- `npm run build` - Build Keystone + migrate + build Next.js for production
- `npm run migrate:gen` - Generate and apply new database migrations
- `npm run migrate` - Deploy existing migrations to database

## Architecture Overview

This is a Next.js 15 + KeystoneJS 6 application with a **dual dashboard architecture**:

- **Backend**: KeystoneJS 6 provides GraphQL API, authentication, and database operations
- **Frontend**: Two parallel admin interfaces sharing the same backend
  - `dashboard/` - Original KeystoneJS implementation (feature-complete)
  - `dashboard2/` - Refactored implementation (work in progress)

## Key Directories

- `features/keystone/` - Backend configuration
  - `models/` - Keystone list definitions (User, Role, Todo)
  - `access.ts` - Role-based permission logic
  - `mutations/` - Custom GraphQL mutations

- `features/dashboard/` - Original admin interface
  - `actions/` - Server actions for data operations
  - `components/` - Reusable UI components
  - `screens/` - Page-level components
  - `views/` - Field type implementations

- `features/dashboard2/` - Refactored admin interface (in development)
  - More modular architecture with improved TypeScript

- `app/` - Next.js App Router with parallel routes for both dashboards

## Data Models & Permissions

**Core Models**: User, Role, Todo with sophisticated relationship handling

**Permission System**: Role-based access control with granular permissions:
- `canAccessDashboard`, `canManagePeople`, `canManageRoles`
- `canCreateTodos`, `canManageAllTodos`
- `canSeeOtherPeople`, `canEditOtherPeople`

## Architecture Patterns

**Field Controller Pattern**: KeystoneJS uses field controllers that handle data serialization, validation, GraphQL selection building, and React rendering.

**Conditional Field Modes**: Fields change behavior based on user permissions, other field values, and create/update context.

**GraphQL Integration**: Dynamic query building from field controllers with SWR for client-side data fetching.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: KeystoneJS 6, Prisma ORM, PostgreSQL
- **UI**: Radix UI primitives, Tailwind CSS, Lucide React icons
- **Data**: GraphQL (GraphQL Yoga), SWR for client state

## Current Development Status - Dashboard2

**Why Dashboard2**: Rebuilding dashboard because original has extensive type errors that break functionality when fixed. Dashboard2 follows KeystoneJS examples more closely using GitHub MCP while preserving the UI work from dashboard1.

**Current Focus**: List page implementation

### Active Issues - List Page Cells
- **Fields not showing**: Many cells display "object, object" instead of proper values
- **Working cells**: Text fields display correctly
- **Broken cell types**:
  - Relationship cells - not rendering relationships properly
  - Password cells - not showing correctly 
  - Document/description cells - not displaying rich content
- **Need to fix**: Cell implementations using KeystoneJS repo examples

### TODO List
- [x] Fix relationship cell implementation to properly display related data
- [x] Fix password cell to show appropriate masked/hidden display (3 asterisks when set)
- [x] Fix document cell to render rich text content properly
- [ ] Review KeystoneJS repo examples for correct cell patterns
- [ ] Compare with dashboard1 views that work correctly
- [ ] Ensure all field types have proper cell implementations

### Fixed Cell Issues
- **Relationship cells**: Now properly display `item.label || item.id` with links, handle null/empty data
- **Password cells**: Show 3 asterisk icons when set, hidden "not set" text when empty (matches KeystoneJS)
- **Document cells**: Extract plain text from Slate document structure, truncate at 100 chars
- **Checkbox cells**: Show actual checkboxes (checked/unchecked) for better visual feedback vs KeystoneJS icon-only approach
- **ListTable rendering**: Fixed to properly use Cell components instead of String() conversion that caused "object, object"

### Fixed Search & UI Issues
- **Search functionality**: Fixed GraphQL errors by using proper field type detection (ID fields use `equals`, text fields use `contains`/`mode`)
- **Page layout**: Added border below breadcrumbs, "Create and manage X" descriptions, removed padding issues
- **Button styling**: Matched dashboard1 responsive design (icons on mobile, text on desktop) 
- **Table layout**: Fixed full-width table display, proper spacing
- **TypeScript errors**: Fixed checkbox filter type definitions

**Reference Files**:
- `/features/dashboard2/views/repomix-keystonejs-views.xml` - KeystoneJS examples
- `/features/dashboard2/views/relationship/` - Current relationship implementation
- `/features/dashboard2/views/password/` - Current password implementation

## Development Notes

- GraphQL endpoint available at `/api/graphql`
- Both dashboards share the same Keystone backend
- Use server actions for data mutations in dashboard components
- Field implementations follow KeystoneJS controller patterns
- Permission checks integrated throughout the UI layer