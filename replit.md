# Overview

Asset Tracker Pro is a professional employee and equipment management application designed for construction and demolition industries. The application provides drag-and-drop functionality for assigning employees and equipment to projects, real-time tracking of assets, and comprehensive dashboard analytics. Built as a full-stack web application with React frontend and Express backend, it features a modern dark-themed UI optimized for operational workflows.

The application now includes two main interfaces:
1. **Dashboard View** - Comprehensive analytics dashboard with stats, project overview, and asset assignment management
2. **Assignments View** - Simplified three-panel layout for focused drag-and-drop assignment workflows inspired by the user's Chakra UI implementation

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client application uses React 18 with TypeScript, built using Vite for development and bundling. The UI is constructed with shadcn/ui components and Radix UI primitives, providing a consistent design system with dark theme support. State management is handled through TanStack Query (React Query) for server state and React context for local state. The drag-and-drop functionality is implemented using react-beautiful-dnd library for intuitive asset assignment workflows.

Routing is handled by Wouter for lightweight client-side navigation. The application follows a component-based architecture with separation of concerns between UI components, business logic hooks, and data fetching utilities.

## Backend Architecture
The server runs on Express.js with TypeScript, following a simplified RESTful API design pattern. The application uses a streamlined architecture with direct API endpoints and Replit Database integration for persistent storage.

### API Endpoints Provided:
- **Persistent Storage**: Replit Database integration for reliable data persistence
- **CRUD Read Operations**: GET endpoints for employees, equipment, and projects
- **Assignment Updates**: PATCH endpoints to update employee/equipment project assignments via drag-and-drop
- **Entity Creation**: POST endpoints to create new employees, equipment, and projects
- **Conflict Detection**: GET /api/conflicts endpoint returning duplicate assignments (extensible for business rules)

Real-time updates are handled through standard HTTP requests with client-side polling via React Query, ensuring immediate UI updates when assignments change.

## Data Storage Solutions
The application uses Replit Database (@replit/database) for simple, persistent storage. The implementation includes three main data collections: employees, equipment, and projects. Each entity uses UUID primary keys and includes assignment tracking through currentProjectId fields.

For development, a MockReplitDB class simulates the Replit Database behavior. In production, simply replace the MockReplitDB with the actual @replit/database import.

## Simple Deployment Process
To deploy this white-label application to a new Replit project:

1. Create a new Node.js Replit project
2. Install dependencies: `npm install express cors body-parser @replit/database`
3. Replace MockReplitDB with actual Replit Database:
   ```javascript
   import { Database } from "@replit/database";
   const db = new Database();
   ```
4. Set Replit to run: `node server/index.js`
5. Update brandConfig for client customization

## Authentication and Authorization
The codebase is prepared for authentication implementation with session-based architecture. The Express server includes cookie parsing middleware and the database configuration suggests session storage capabilities through connect-pg-simple integration.

## Styling and Theme System
The application implements a comprehensive design system using Tailwind CSS with CSS custom properties for theme variables. Supports both light and dark themes with a focus on the dark theme for operational environments. The theme system includes semantic color tokens and consistent spacing/typography scales.

## White Label Configuration
The application includes a comprehensive white-label system that can be customized by modifying the `brandConfig` object in `client/src/App.tsx`. Simple changes to this configuration will rebrand the entire application:

```javascript
const brandConfig = {
  appName: "YourAppName",           // Your company name
  primaryColor: "#yourPrimaryColor", // Main brand color (buttons, accents)
  secondaryColor: "#yourSecondaryColor", // Secondary color (highlights, equipment)
  logoUrl: "https://yourdomain.com/your-logo.svg", // Your company logo URL
};
```

This single configuration automatically updates:
- Header branding and logo
- Application name throughout the UI
- Color scheme for all components
- Theme tokens and semantic colors
- Brand identity across all three panels

# External Dependencies

## Database Integration
- **Neon Database**: Serverless PostgreSQL database service (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database toolkit for schema definition and queries
- **PostgreSQL**: Primary database using connection pooling for scalability

## UI Component Libraries
- **Radix UI**: Comprehensive primitive component library for accessibility and functionality
- **Shadcn/ui**: Pre-built components built on top of Radix UI primitives
- **React Beautiful DnD**: Drag and drop functionality for asset assignment workflows
- **Lucide React**: Icon library providing consistent iconography

## State Management and Data Fetching
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation for forms and API responses

## Development and Build Tools
- **Vite**: Build tool and development server with hot module replacement
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds

## Date and Utility Libraries
- **Date-fns**: Date manipulation and formatting library
- **Class Variance Authority**: Utility for creating variant-based component APIs
- **CLSX**: Conditional className utility

## Development Environment Integration
- **Replit**: Development environment with specific plugins for runtime error handling and cartographer integration for enhanced development experience