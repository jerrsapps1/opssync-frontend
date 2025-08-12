# Overview

Asset Tracker Pro is a professional employee and equipment management application for construction and demolition. It offers drag-and-drop assignment, real-time conflict detection, and comprehensive asset management within a full-stack web application (React frontend, Express backend). Key features include enterprise-grade conflict management, a three-panel layout for assignments, JWT authentication, an enhanced navigation header, an advanced white-label system with page-level branding, object storage integration, a comprehensive settings system, a professional directory with profile management and a guided builder, complete archive/history tracking with audit trails, and live assignment synchronization with enhanced SSE real-time capabilities. The system includes a comprehensive Stripe billing integration with three pricing tiers and plan-based feature gates. The application ensures live data creation and an integrated workflow between settings management and the operational dashboard, with authentic equipment data for realistic testing. It supports enterprise-grade real-time collaboration with event ID tracking and missed event replay.

## Recent Changes (August 2025)
- **Excel Export System**: Completely resolved data consistency and duplication issues in Excel exports
- **Data Architecture**: Implemented shared database module ensuring consistent data across all API routes and exports
- **Export Quality**: All Excel exports now provide complete authentic datasets (46 employees, 25 equipment, 15 projects) with clean formatting
- **Professional Directory**: Directory functionality confirmed working perfectly with comprehensive asset management

# User Preferences

Preferred communication style: Simple, everyday language.
**CRITICAL: No pause messages or loading overlays during drag-and-drop operations - user finds these extremely frustrating and time-wasting.**
Focus on efficient, immediate solutions without unnecessary back-and-forth.

# System Architecture

## Frontend Architecture
The client uses React 18 with TypeScript and Chakra UI, built with Vite. State management is via React context (AppProvider) and local state for conflict management. Features include a `useConflictPolling` hook, `ConflictAlert` component, and a three-panel drag-and-drop layout. The drag-and-drop system uses `client/src/dnd/` utilities for reliable assignment persistence. A unified query key architecture (`["/api", "resource"]`) ensures consistent cache invalidation and real-time UI updates.

## Backend Architecture
The server uses Express.js with TypeScript and a simplified RESTful API design. It integrates with Replit Database. The API provides CRUD operations for employees, equipment, projects, and supervisors, PATCH endpoints for assignments, POST for entity creation, and an enhanced `/api/conflicts` endpoint for detailed conflict detection. Real-time conflict detection uses 15-second polling.

## Data Storage Solutions
Replit Database is used for persistent storage, with collections for employees, equipment, and projects. UUIDs are used for primary keys and `currentProjectId` for assignment tracking.

## Authentication and Authorization
A JWT-based authentication system is implemented, including user registration with white-label brand configuration, secure login with 7-day token expiration, automatic token validation/refresh, in-app brand configuration updates, protected routes with authentication middleware, and user management with bcryptjs encrypted password storage.

## Styling and Theme System
The application uses a professional tech-forward dark theme with Tailwind CSS, featuring a specific AI-inspired color palette (#121212 background, #1E1E2F panels, #4A90E2 primary, #BB86FC accents, #CF6679 alerts). It includes subtle gradients, backdrop blur effects, and custom scrollbars.

## White Label Configuration
A comprehensive white-label system allows configuration of app name, branding, primary/secondary colors, and logo URL with real-time theme preview. A professional logo upload system supports drag & drop, validation, direct upload to object storage, and presigned URLs. Dynamic theming uses CSS variables (e.g., `--brand-primary`).

### Dynamic CSS Variable Theming
The `useBrandTheme` hook applies brand configuration to CSS custom properties at runtime. A complete UI component library (buttons, inputs, selects, dialogs, tables) automatically inherits brand configuration via CSS variables. Page-level integration includes branded headers, dynamic company names, and consistent branding across all operational pages.

## Professional Directory System
A comprehensive directory for employees, equipment, and projects includes:
- **Unified Directory View**: Single page with tabs.
- **Completeness Tracking**: Visual progress bars for profile completion.
- **Context Menu Integration**: Right-click for "Open Profile", "Assign...", "Unassign".
- **Dual Navigation**: Double-click for profiles, right-click for quick actions.
- **Real-time Assignment**: Integration with the project assignment system.

**Profile Builder Wizard:** A guided step-by-step process for completing profiles based on entity type, with progressive form fields and real-time validation.

**Archive & History System:** Soft delete architecture, complete audit trail of entity changes, action logging, recovery capabilities, and a chronological timeline view.

## Enhanced Settings Management System
A comprehensive settings interface with a structured sub-page system.
- **Settings Architecture**: Main settings shell with tabbed navigation (Project, Equipment, Employee Settings).
- **Import/Export Capabilities**: Bulk CSV/Excel import/export for employees and equipment with template support.
- **Enhanced Navigation**: Nested routing, white-label branding integration, and back navigation.
- **Context Menu System**: Right-click context menus and double-click navigation on entity cards.
- **Server Features**: Import/export API routes, project contacts management, notes system, and real-time data validation.

## Navigation System
A global layout system with consistent sidebar navigation across all pages, using React Router DOM. The `AppLayout` component provides a unified shell.

## White Label Configuration System
A dedicated admin section for white label configuration (company name, colors, logo upload) with specific API endpoints (`/api/auth/brand-config` and `/api/logo/upload-url`).

## Natural Language Command Bar System
An advanced natural language interface for plain English commands.
- **OpenAI Integration**: Advanced NLP with fallback to pattern matching.
- **API Consistency**: Uses same PATCH endpoints as drag-and-drop.
- **Intelligent Matching**: Fuzzy search for employees/equipment, project resolution.
- **Real-time Updates**: Automatic query invalidation.
- **Comprehensive Error Handling**: User-friendly validation and toast notifications.
Supported commands include employee/equipment assignments and asset queries.

# External Dependencies

## Database Integration
- **Neon Database**: Serverless PostgreSQL
- **Drizzle ORM**: Type-safe database toolkit
- **PostgreSQL**: Primary database with connection pooling

## UI Component Libraries
- **Radix UI**: Primitive component library
- **Shadcn/ui**: Pre-built components on Radix UI
- **React Beautiful DnD**: Drag and drop functionality
- **Lucide React**: Icon library

## State Management and Data Fetching
- **TanStack Query**: Server state management
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation

## Development and Build Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler

## Date and Utility Libraries
- **Date-fns**: Date manipulation and formatting
- **Class Variance Authority**: Utility for variant-based component APIs
- **CLSX**: Conditional className utility

## Development Environment Integration
- **Replit**: Development environment