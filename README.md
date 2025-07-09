# Next.js + KeystoneJS Starter

A modern full-stack application combining Next.js 15 with KeystoneJS 6, featuring admin dashboard implementation and sophisticated role-based permissions.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjunaid33%2Fnext-keystone-starter%2F&stores=[{"type"%3A"postgres"}])

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/TK5wC1?referralCode=I_tWSs)

## Architecture Overview

This project features a **modern admin architecture** with:

- **Backend**: KeystoneJS 6 providing GraphQL API, authentication, and database operations
- **Frontend**: Custom Next.js admin dashboard with enhanced UI components
- **Image Support**: S3-compatible image storage and management 

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Radix UI** primitives for accessible components
- **Tailwind CSS 4** for styling
- **Remix Icons** (@remixicon/react) for icons
- **SWR** for client-side data fetching
- **TipTap** for rich text editing
- **React Hook Form** for form management
- **Zod** for schema validation

### Backend
- **KeystoneJS 6** for GraphQL API and admin interface
- **Prisma ORM** for database operations
- **GraphQL Yoga** for GraphQL server
- **PostgreSQL** database
- **S3-compatible storage** for image management

### Key Features
- **Role-based access control** with granular permissions
- **Dynamic field controllers** with conditional behavior
- **Rich text editing** with document fields
- **Relationship management** with inline editing capabilities
- **Image upload and management** with S3 storage
- **Inline create/edit components** for seamless UX
- **Advanced filtering system** for all field types
- **Responsive design** with mobile support

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/junaid33/next-keystone-starter
   cd next-keystone-starter
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your database configuration:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   SESSION_SECRET=your-super-secret-session-key-change-this-in-production
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   This will:
   - Build KeystoneJS schema
   - Run database migrations
   - Start Next.js development server with Turbopack

4. **Access the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
   - GraphQL API: [http://localhost:3000/api/graphql](http://localhost:3000/api/graphql)

## Development Commands

- `npm run dev` - Build Keystone + migrate + start Next.js dev server
- `npm run build` - Build Keystone + migrate + build Next.js for production
- `npm run migrate:gen` - Generate and apply new database migrations
- `npm run migrate` - Deploy existing migrations to database
- `npm run lint` - Run ESLint

## API Endpoints

### GraphQL API
- **Endpoint**: `/api/graphql`
- **Features**: Full CRUD operations, relationships, authentication
- **Playground**: Available in development mode

## Data Models

### Core Models
- **User** - Authentication and user management
- **Role** - Role-based access control
- **Todo** - Example content model with relationships
- **TodoImage** - Image management for Todo items with S3 storage

### Permission System
Sophisticated role-based permissions including:
- `canAccessDashboard`, `canManagePeople`, `canManageRoles`
- `canCreateTodos`, `canManageAllTodos`
- `canSeeOtherPeople`, `canEditOtherPeople`

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/
│   │   └── graphql.ts     # GraphQL API endpoint
│   └── dashboard/         # Admin dashboard pages
├── features/
│   ├── keystone/          # Backend configuration
│   │   ├── models/        # Keystone list definitions
│   │   ├── access.ts      # Permission logic
│   │   └── mutations/     # Custom GraphQL mutations
│   └── dashboard/         # Admin interface implementation
│       ├── actions/       # Server actions
│       ├── components/    # Reusable UI components
│       ├── screens/       # Page-level components
│       └── views/         # Field type implementations
├── keystone.ts            # KeystoneJS configuration
└── schema.prisma          # Database schema
```

## Development Notes

- **GraphQL endpoint** available at `/api/graphql`
- **Field implementations** follow KeystoneJS controller patterns
- **Permission checks** are integrated throughout the UI layer
- **Server actions** used for data mutations in dashboard components
- **Inline editing** components provide seamless UX for relationship management
- **Image uploads** configured for S3-compatible storage
- **Advanced filtering** supports all field types including documents, JSON, and images

## Deployment

The application can be deployed to any platform supporting Node.js and PostgreSQL:

1. Set up PostgreSQL database
2. Configure environment variables
3. Run `npm run build`
4. Run `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request