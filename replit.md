# Overview

Asset Tracker Pro is a professional employee and equipment management application designed for construction and demolition industries. The application provides drag-and-drop functionality for assigning employees and equipment to projects, real-time conflict detection, and comprehensive asset management. Built as a full-stack web application with React frontend and Express backend, it features a modern dark-themed UI optimized for operational workflows.

The application features enterprise-grade conflict management with:
- **Real-time Conflict Detection** - 15-second polling to detect assignment conflicts
- **Professional Alert System** - Dismissible red alert banners highlighting conflicting employees/equipment by name
- **Three-Panel Layout** - Streamlined drag-and-drop interface for project assignments
- **JWT Authentication** - Secure login/logout with token-based authentication
- **Enhanced Navigation Header** - Professional navigation bar with branded buttons and dual settings access
- **Advanced White-Label System** - Complete brand customization with logo upload and comprehensive configuration
- **Object Storage Integration** - Professional file upload system for company logos and assets
- **Enhanced Settings System** - Comprehensive 5-tab settings page for detailed operational management
- **Fully Functional Drag & Drop** - Complete drag and drop system with proper API integration for both employee and equipment assignments
- **Live Data Creation** - Projects, employees, and equipment created in settings automatically appear in dashboard
- **Integrated Workflow** - Seamless connection between settings management and operational dashboard

## Recent Changes (January 2025)
- **Fixed Drag-and-Drop Functionality**: Resolved critical issues with project assignment system
  - Fixed API endpoint routing from `/api/employees/{id}` to `/api/employees/{id}/assignment`
  - Corrected project ID parsing to handle multi-part IDs (proj-001, proj-002, etc.)
  - Proper handling of unassigned state using null instead of string values
  - Both employee and equipment drag-and-drop now work correctly with real-time updates

- **Resolved Equipment Identity Issue**: Fixed critical data consistency problem
  - Identified and resolved multiple conflicting data initialization sources
  - Synchronized equipment profiles across all storage systems (MemStorage, MockReplitDB, ReplitDB backend)
  - Equipment profiles now maintain consistent identities during drag operations
  - Full equipment details (make, model, serial numbers, asset numbers) preserved throughout interface
  - Eliminated profile switching where equipment would appear to change identity during assignments

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client application uses React 18 with TypeScript and Chakra UI component library for professional styling. Built using Vite for development and bundling, it features a clean component architecture with focused separation of concerns. State management is handled through React context for core data (AppProvider) and local state for conflict management (MainApp).

Key architectural components:
- **useConflictPolling Hook** - Reusable hook with configurable polling intervals (default 15 seconds)
- **ConflictAlert Component** - Professional dismissible alert banners with error styling
- **Three-Panel Layout** - ProjectList, EmployeeList, EquipmentList with drag-and-drop functionality
- **Clean Component Hierarchy** - App → AppProvider → Header → MainApp → Content

## Backend Architecture
The server runs on Express.js with TypeScript, following a simplified RESTful API design pattern. The application uses a streamlined architecture with direct API endpoints and Replit Database integration for persistent storage.

### API Endpoints Provided:
- **Persistent Storage**: Replit Database integration for reliable data persistence
- **CRUD Read Operations**: GET endpoints for employees, equipment, projects, supervisors
- **Assignment Updates**: PATCH endpoints to update employee/equipment project assignments via drag-and-drop
- **Entity Creation**: POST endpoints to create new employees, equipment, and projects
- **Enhanced Conflict Detection**: GET /api/conflicts endpoint returning:
  - Employee assignment conflicts
  - Equipment assignment conflicts  
  - Supervisor conflicts (supervising multiple projects)
  - Projects without supervisors
- **Supervisor Management**: PATCH endpoint to assign supervisors to projects
- **Business Analytics**: GET /api/analytics endpoint with operational metrics and KPIs

Real-time conflict detection is handled through custom useConflictPolling hook with 15-second intervals, displaying professional alert banners when assignment conflicts are detected. The system shows conflicting employee and equipment names with dismissible red alerts that reappear on page reload until conflicts are resolved.

## Data Storage Solutions
The application uses Replit Database (@replit/database) for simple, persistent storage. The implementation includes three main data collections: employees, equipment, and projects. Each entity uses UUID primary keys and includes assignment tracking through currentProjectId fields.

For development, a MockReplitDB class simulates the Replit Database behavior. In production, simply replace the MockReplitDB with the actual @replit/database import.

## Deployment Instructions
To deploy this white-label TrackPro system:

**Backend Setup:**
1. Create a new Node.js Replit project
2. Use the provided Express + Replit Database backend code
3. Dependencies automatically installed: `express`, `cors`, `body-parser`, `@replit/database`
4. Run with: `npm run dev` or `node server/index.js`

**Frontend Integration:**
1. Replace existing App.jsx with the complete implementation
2. System includes: Dark theme, white-label branding, drag & drop UI, conflict polling
3. Customize brandConfig for instant client rebranding

**Usage:**
- Drag employees and equipment between projects
- Red alert banners appear for assignment conflicts
- 15-second automatic conflict detection
- Dismissible alerts (reappear on reload until resolved)

## Authentication and Authorization
The application features a complete JWT-based authentication system with:
- **User Registration** - Account creation with white-label brand configuration during setup
- **Secure Login** - JWT token authentication with 7-day expiration
- **Token Validation** - Automatic token validation and refresh functionality
- **Settings Management** - In-app brand configuration updates via settings modal
- **Protected Routes** - Authentication middleware for secure API endpoints
- **User Storage** - Complete user management with encrypted password storage using bcryptjs

## Styling and Theme System
The application implements a comprehensive design system using Tailwind CSS with CSS custom properties for theme variables. Supports both light and dark themes with a focus on the dark theme for operational environments. The theme system includes semantic color tokens and consistent spacing/typography scales.

## White Label Configuration
The application includes a comprehensive white-label system with multiple configuration methods:

### 1. Account Registration Setup
During user registration, clients can configure their brand settings:
- App name and branding
- Primary and secondary colors
- Company logo URL
- Real-time theme preview

### 2. Enhanced Settings Modal Access
Professional brand configuration accessible via:
- Navigation header "Brand Config" button
- Hamburger menu "Brand Settings" option
- Tabbed interface with four sections:
  - Brand Identity: App name, tagline configuration
  - Company Info: Company details, industry, website
  - Colors & Theme: Primary/secondary colors with live preview
  - Logo & Assets: Professional logo upload with object storage

### 3. Professional Logo Upload System
Advanced file upload capabilities:
- Drag & drop interface with progress indicators
- File validation (5MB max, image formats only)
- Direct upload to object storage with presigned URLs
- Automatic URL conversion for seamless integration
- Real-time logo preview in settings

### 4. Dual Settings Navigation
Professional navigation system with:
- Header navigation buttons (Dashboard, Settings, Brand Config)
- Active state indicators for current page
- Hamburger menu with additional options
- System Settings page with four management sections

### 5. Dynamic Theme System
The brand configuration automatically updates:
- Header branding and logo display
- Application name throughout the UI
- Color scheme for all components
- Theme tokens and semantic colors
- Real-time CSS custom property updates

## Enhanced Settings Management System
The application features a comprehensive settings interface with dual access methods:

### 1. Enhanced Settings Page (5-Tab System)
Professional tabbed settings interface accessible via header navigation:
- **Project Details** - Complete project information management with forms for editing project specifics
- **Team Management** - Employee profile management with contact details and role assignments  
- **Equipment Settings** - Equipment configuration, maintenance tracking, and condition management
- **Company Contacts** - Key personnel, vendor contacts, and emergency contact directory
- **Project Contacts** - Project-specific contact management organized by project

### 2. Refined Drag & Drop System
Improved drag and drop functionality with:
- **Consistent ID Architecture** - Standardized employee/equipment draggable IDs for reliable operations
- **Direct Project Assignment** - Drag items directly onto projects in the left panel for instant assignment
- **Dedicated Unassigned Zone** - Special drop zone for removing project assignments
- **Enhanced Visual Feedback** - Clear hover states and drag indicators during operations
- **Error Handling** - Console logging and try-catch blocks for debugging drag operations

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