# Next.js + KeystoneJS Starter

A modern full-stack application combining Next.js 15 with KeystoneJS 6, featuring dual admin dashboard implementations and a sophisticated role-based permission system.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjunaid33%2Fnext-keystone-starter&env=DATABASE_URL,SESSION_SECRET&envDescription=DATABASE%20URL%20should%20be%20a%20postgres%20string%20and%20SESSION_SECRET%20is%20a%2064%20long%20random%20string)

## Architecture Overview

This project features a **dual dashboard architecture** with:

- **Backend**: KeystoneJS 6 providing GraphQL API, authentication, and database operations
- **Frontend**: Two parallel admin interfaces sharing the same backend
  - `dashboard/` - Original KeystoneJS implementation 

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Radix UI** primitives for accessible components
- **Tailwind CSS 4** for styling
- **Lucide React** for icons
- **SWR** for client-side data fetching
- **TipTap** for rich text editing

### Backend
- **KeystoneJS 6** for GraphQL API and admin interface
- **Prisma ORM** for database operations
- **GraphQL Yoga** for GraphQL server
- **PostgreSQL** database

### Key Features
- Role-based access control with granular permissions
- Dynamic field controllers with conditional behavior
- Rich text editing with document fields
- Relationship management between models
- Responsive design with mobile support

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
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

## Data Models

### Core Models
- **User** - Authentication and user management
- **Role** - Role-based access control
- **Todo** - Example content model with relationships

### Permission System
Sophisticated role-based permissions including:
- `canAccessDashboard`, `canManagePeople`, `canManageRoles`
- `canCreateTodos`, `canManageAllTodos`
- `canSeeOtherPeople`, `canEditOtherPeople`

## Project Structure

```
├── app/                    # Next.js App Router
├── features/
│   ├── keystone/          # Backend configuration
│   │   ├── models/        # Keystone list definitions
│   │   ├── access.ts      # Permission logic
│   │   └── mutations/     # Custom GraphQL mutations
│   ├── dashboard/         # Original admin interface
│   │   ├── actions/       # Server actions
│   │   ├── components/    # Reusable UI components
│   │   ├── screens/       # Page-level components
│   │   └── views/         # Field type implementations
├── keystone.ts            # KeystoneJS configuration
└── schema.prisma          # Database schema
```

## Development Notes

- GraphQL endpoint available at `/api/graphql`
- Both dashboards share the same Keystone backend
- Field implementations follow KeystoneJS controller patterns
- Permission checks are integrated throughout the UI layer
- Uses server actions for data mutations in dashboard components

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