# Overview

Asset Tracker Pro is a professional employee and equipment management application designed for construction and demolition industries. It provides drag-and-drop functionality for assigning employees and equipment to projects, real-time conflict detection, and comprehensive asset management. Built as a full-stack web application with a React frontend and Express backend, it features a modern dark-themed UI optimized for operational workflows. Key capabilities include enterprise-grade conflict management with real-time detection and professional alerts, a three-panel layout for streamlined project assignments, JWT authentication, an enhanced navigation header, an advanced white-label system with comprehensive page-level branding support, object storage integration for assets, a comprehensive settings system, a professional directory system with profile management, a guided profile builder wizard, and complete archive/history tracking with audit trails. The application ensures live data creation and an integrated workflow between settings management and the operational dashboard.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client application uses React 18 with TypeScript and Chakra UI for styling. Built with Vite, it features a clean component architecture with state management handled through React context (AppProvider) for core data and local state for conflict management (MainApp). Key components include a `useConflictPolling` hook for real-time conflict detection, a `ConflictAlert` component for displaying alerts, and a three-panel layout for `ProjectList`, `EmployeeList`, and `EquipmentList` with drag-and-drop functionality.

## Backend Architecture
The server runs on Express.js with TypeScript, following a simplified RESTful API design pattern. It integrates with Replit Database for persistent storage. The API provides CRUD read operations for employees, equipment, projects, and supervisors, PATCH endpoints for updating project assignments and supervisor assignments, POST endpoints for entity creation, and an enhanced `/api/conflicts` endpoint for detailed conflict detection (employee, equipment, supervisor, projects without supervisors). There is also an `/api/analytics` endpoint for operational metrics. Real-time conflict detection is handled with 15-second polling intervals, displaying dismissible red alerts.

## Data Storage Solutions
The application uses Replit Database (@replit/database) for simple, persistent storage, with three main data collections: employees, equipment, and projects. Each entity uses UUID primary keys and includes assignment tracking through `currentProjectId` fields. For development, a `MockReplitDB` class simulates the database behavior.

## Authentication and Authorization
The application features a complete JWT-based authentication system including user registration with white-label brand configuration, secure login with 7-day token expiration, automatic token validation and refresh, in-app brand configuration updates, protected routes with authentication middleware, and user management with encrypted password storage using bcryptjs.

## Styling and Theme System
The application implements a comprehensive design system using Tailwind CSS with CSS custom properties for theme variables, supporting both light and dark themes, primarily optimized for dark mode. The system includes semantic color tokens and consistent spacing/typography scales.

## White Label Configuration
The application includes a comprehensive white-label system configurable during account registration and via an enhanced settings modal. This allows clients to configure app name, branding, primary/secondary colors, and company logo URL with real-time theme preview. A professional logo upload system supports drag & drop, file validation, direct upload to object storage with presigned URLs, and real-time logo preview. The dynamic theme system automatically updates the UI based on brand configurations using CSS variables.

### Dynamic CSS Variable Theming
The useBrandTheme hook automatically applies brand configuration to CSS custom properties at runtime, enabling real-time theme updates across the entire application. Key components use CSS variables like --brand-primary, --brand-secondary, and --brand-accent for consistent branding. The AppLayout component fetches brand configuration and applies it globally, while individual components reference these variables for buttons, navigation highlights, and interactive elements.

**Complete UI Component Library:**
- Button component with 5 variants (default, secondary, accent, outline, ghost) using brand colors
- Input component with brand radius and primary focus rings
- Select component with native dropdown styling and brand theming
- Dialog component with branded headers and professional modal design
- Table components (Table, THead, TBody, TR, TH, TD) with branded headers and zebra striping
- All components automatically inherit brand configuration through CSS variables

**Page-Level White Label Integration:**
- Every page includes branded header sections with company logo placeholders
- Dynamic company name integration in page titles and descriptions
- Footer branding with organization name references
- Statistics cards and UI elements using CSS brand color variables
- Professional page layouts optimized for white-label client presentation
- Consistent branding across Dashboard, Employees, Equipment, Analytics, and Settings pages

## Professional Directory System
The application includes a comprehensive directory system for managing employee, equipment, and project profiles with advanced features:

**Directory Features:**
- **Unified Directory View**: Single page with tabs for Employees, Equipment, and Projects
- **Completeness Tracking**: Visual progress bars showing profile completion percentage
- **Context Menu Integration**: Right-click menus with "Open Profile", "Assign...", and "Unassign" actions
- **Dual Navigation**: Double-click to open detailed profiles, right-click for quick actions
- **Real-time Assignment**: Integration with existing project assignment system

**Profile Builder Wizard:**
- **Guided Setup Process**: Step-by-step wizard for completing profile information
- **Entity Selection**: Choose between Employees, Equipment, or Projects
- **Progressive Form Fields**: Context-sensitive fields based on entity type
- **Save & Next Workflow**: Efficient progression through all incomplete profiles
- **Real-time Validation**: Immediate feedback on required fields and data integrity

**Archive & History System:**
- **Soft Delete Architecture**: Archive/restore functionality with data preservation
- **Complete Audit Trail**: Full history tracking of all entity changes
- **Action Logging**: Detailed logs for create, update, archive, restore, and delete operations
- **Recovery Capabilities**: Ability to restore archived entities without data loss
- **Timeline View**: Chronological display of all system activities

## Enhanced Settings Management System
A comprehensive settings interface is provided with a structured sub-page system accessible via header navigation. The system includes:

**Settings Architecture:**
- **Settings Index**: Main settings shell with tabbed navigation and white-label branding
- **Project Settings**: Project details management with contact person functionality
- **Equipment Settings**: Import/export functionality with comprehensive equipment table views
- **Employee Settings**: Import/export functionality with employee management tables
- **Detail Pages**: Dedicated employee and equipment profile pages accessible via double-click or direct navigation

**Import/Export Capabilities:**
- Bulk CSV/Excel import functionality for employees and equipment
- Export capabilities for complete data backups
- Template download support for proper data formatting
- Professional ImportExportPanel component for consistent UI

**Enhanced Navigation:**
- Nested routing structure for organized settings management
- White-label logo and company name integration throughout
- Professional branded headers and navigation elements
- Back navigation support on detail pages

**Context Menu System:**
- Right-click context menus on employee and equipment cards
- Quick access to profile pages and unassign functionality
- Double-click navigation to detail pages
- Professional menu styling with icon indicators

**Server Features:**
- Complete import/export API routes with CSV/Excel support
- Project contacts management with persistent storage
- Notes system for entity annotations
- Template file serving for proper data formatting
- Real-time data validation during imports

## Navigation System
The application features a global layout system with consistent sidebar navigation across all pages. Implemented using React Router DOM with nested routing architecture for clean page transitions. The AppLayout component provides a unified shell with sidebar and header that wraps all application pages. The sidebar includes navigation to Dashboard, Employees, Equipment, Analytics, Settings, and admin sections like White Label Config. The layout maintains the original gray-900 color scheme with proper active link highlighting and seamless navigation between all pages.

## White Label Configuration System
The application includes a comprehensive white label configuration system that allows administrators to customize the branding and appearance. The system provides a dedicated admin section in the sidebar with a "White Label Config" page that enables customization of company name, primary/secondary colors, and logo upload. The configuration uses dedicated API endpoints (/api/auth/brand-config and /api/logo/upload-url) for managing brand settings and logo uploads to object storage.

## Natural Language Command Bar System
The application features an advanced natural language interface that allows users to interact with StaffTrak using plain English commands. The command bar is positioned above the main dashboard and integrates seamlessly with the existing drag-and-drop functionality.

**Key Features:**
- **OpenAI Integration**: Advanced natural language processing with fallback to simple pattern matching
- **API Consistency**: Uses identical PATCH endpoints as drag-and-drop functionality (`/api/employees/:id/assignment` and `/api/equipment/:id/assignment`)
- **Intelligent Matching**: Fuzzy search for employees (by name/role) and equipment (by name/type)
- **Project Resolution**: Converts natural language project names to database IDs
- **Real-time Updates**: Automatic query invalidation keeps UI synchronized
- **Comprehensive Error Handling**: User-friendly validation and toast notifications

**Supported Commands:**
- Employee assignments: "move John Smith to Downtown Mall"
- Equipment assignments: "assign excavator to highway project"  
- Asset queries: "list unassigned" or "show unassigned"

# External Dependencies

## Database Integration
- **Neon Database**: Serverless PostgreSQL database service
- **Drizzle ORM**: Type-safe database toolkit
- **PostgreSQL**: Primary database with connection pooling

## UI Component Libraries
- **Radix UI**: Primitive component library
- **Shadcn/ui**: Pre-built components built on Radix UI
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
- **Class Variance Authority**: Utility for creating variant-based component APIs
- **CLSX**: Conditional className utility

## Development Environment Integration
- **Replit**: Development environment with specific plugins for runtime error handling and cartographer integration.