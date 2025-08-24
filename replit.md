# Overview

OpsSync.ai is a comprehensive repair shop management system designed for professional automotive, equipment, and maintenance operations. The platform provides complete work order tracking, approval workflows, financial controls, and operational efficiency tools built on a modern full-stack web application architecture. Key features include enterprise-grade conflict management, a three-panel assignment layout, JWT authentication with modern professional login interface, an enhanced navigation header, a complete white-label branding system with customer controls, object storage integration, a comprehensive settings system, a professional directory with profile management, complete archive/history tracking with audit trails, and live assignment synchronization. The system integrates comprehensive Stripe billing with tiered pricing, plan-based feature gating, and automated subscription management for white-label add-ons. Enterprise-grade real-time collaboration is supported throughout. The application features a sophisticated, tech-forward design aesthetic with glassmorphism effects, gradient backgrounds, and advanced animations throughout the user interface. The repair shop includes a comprehensive work order activity log with advanced filtering, sorting, and detailed tracking capabilities. Business vision centers on optimizing operational efficiency and resource allocation for construction and demolition projects, with market potential in mid-to-large scale construction firms. Project ambitions include becoming the industry standard for asset tracking and workforce management with full white-label enterprise deployment capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.
**CRITICAL: No pause messages or loading overlays during drag-and-drop operations - user finds these extremely frustrating and time-wasting.**
Focus on efficient, immediate solutions without unnecessary back-and-forth.
**Design Preferences**: Prefers professional, tech-forward, modern visual designs over plain interfaces. Appreciates sophisticated aesthetics with gradients, glassmorphism effects, and advanced animations.

# Recent Changes

**January 17, 2025**: Complete OpsSync.ai rebranding and navigation improvements
- Updated application name throughout codebase from legacy brands (StaffTrak, Asset Tracker Pro) to "OpsSync.ai"
- Changed tagline to "Repair Shop Management" focusing on repair shop operations
- Updated HTML title, meta descriptions, and SEO content for repair shop management
- Modified all brand configuration defaults to OpsSync.ai
- Updated sidebar header, login page, and all user-facing branding elements
- Added "Repair Shop" navigation item to sidebar menu for direct access
- Maintained drag-and-drop functionality on dashboard for repair shop assignments
- Fixed dashboard header to display "OpsSync.ai Dashboard" instead of "StaffTrak Dashboard"
- Dual access method: sidebar navigation + drag-and-drop zone for optimal UX

# System Architecture

## Frontend Architecture
The client is built with React 18, TypeScript, and Chakra UI, using Vite. State management relies on React context (AppProvider) and local state for conflict management. It features a `useConflictPolling` hook and a `ConflictAlert` component. The three-panel drag-and-drop layout utilizes `client/src/dnd/` utilities for reliable assignment persistence. A unified query key architecture (`["/api", "resource"]`) ensures consistent cache invalidation and real-time UI updates.

## Backend Architecture
The server is built with Express.js and TypeScript, following a simplified RESTful API design. It integrates with Replit Database and provides CRUD operations for employees, equipment, projects, and supervisors, with PATCH endpoints for assignments and POST for entity creation. An enhanced `/api/conflicts` endpoint supports detailed conflict detection with 15-second polling.

## Data Storage Solutions
Replit Database serves as the persistent storage, organizing data into collections for employees, equipment, and projects. UUIDs are used for primary keys, and `currentProjectId` for assignment tracking.

## Authentication and Authorization
A JWT-based authentication system is implemented, featuring user registration with white-label brand configuration, secure login with 7-day token expiration, automatic token validation and refresh, in-app brand configuration updates, and protected routes via authentication middleware. A professional header with user info display and logout functionality is accessible on all pages for seamless session management. User management uses bcryptjs for password storage. Role-based authorization supports OWNER/ADMIN/SUPERVISOR/MANAGER/VIEWER roles with tenant-specific feature access control.

## Styling and Theme System
The application employs a professional tech-forward dark theme using Tailwind CSS. The color palette is AI-inspired, featuring a #121212 background, #1E1E2F panels, #4A90E2 primary, #BB86FC accents, and #CF6679 alerts. Design elements include subtle gradients, backdrop blur effects, and custom scrollbars.

## White Label Configuration
A comprehensive white-label system enables configuration of the app name, branding, primary/secondary colors, and logo URL with real-time theme previews. A professional logo upload system supports drag & drop, validation, direct upload to object storage, and presigned URLs. Dynamic theming is achieved using CSS variables (e.g., `--brand-primary`). The `useBrandTheme` hook applies brand configurations to CSS custom properties at runtime, ensuring all UI components (buttons, inputs, selects, dialogs, tables) inherit branding via CSS variables.

## Professional Directory System
A unified directory for employees, equipment, and projects provides a single-page view with tabs, visual progress bars for profile completion, and context menu integration for actions like "Open Profile", "Assign...", "Unassign". Navigation supports double-click for profiles and right-click for quick actions. A Profile Builder Wizard guides users through a step-by-step process for completing profiles.

## Archive & History System
This system features a soft delete architecture, maintaining a complete audit trail of entity changes, action logging, recovery capabilities, and a chronological timeline view for "who did what when" tracking.

## Enhanced Settings Management System
A comprehensive settings interface with a structured sub-page system provides tabbed navigation (Project, Equipment, Employee Settings). It supports bulk CSV/Excel import/export for employees and equipment with template support.

## Navigation System
A global layout system ensures consistent sidebar navigation across all pages, utilizing React Router DOM. The `AppLayout` component provides a unified shell.

## Natural Language Command Bar System
An advanced natural language interface allows for plain English commands. It integrates with OpenAI for advanced NLP, with fallback to pattern matching. It uses the same PATCH endpoints as drag-and-drop for API consistency, features intelligent matching for entities, and provides real-time updates via automatic query invalidation with comprehensive error handling.

## Enterprise Features
The system includes an enhanced tenant-aware cron system for per-tenant background jobs, field-friendly interface terminology replacing jargon, and a customizable terminology framework (`client/src/lib/copy.ts`). It supports enterprise job scheduling, a comprehensive supervisor portal with timeliness management and project blocking, enterprise SLA management with RAG scoring, and an automated escalation system for overdue items. Weekly digest automation sends project status reports. A customer controls MVP enables per-tenant feature management (e.g., Supervisor Portal, Manager Dashboard, SLA management), supported by a comprehensive feature flag architecture and a tenant management database schema (`tenants`, `org_users`, `feature_overrides`, `notification_prefs`).

## Work Order Management System
A comprehensive work order system tracks repair and preventive maintenance with professional activity logging. The repair shop interface includes "Assets Needing Repairs or PM" with individual work order creation capabilities. Features include a sortable/filterable activity log with detailed work order information, timeline tracking, cost management, and technician assignment. **Planned Enhancements**: Work order reopening/editing capabilities, PDF attachment support for financial documentation, job number billing integration, and enhanced financial tracking within the work order wizard.

## MVP Optional Addons System
A comprehensive addon architecture provides enterprise-grade modular functionality with three core addons: Advanced Analytics with project metrics and utilization tracking (`/api/analytics/*`), Branding Settings with real-time theme customization and logo upload (`/api/branding/*`), and Billing Management with full Stripe integration for subscription handling (`/api/billing/*`). The system includes complete Stripe webhook processing (`server/routes/stripe_webhooks.ts`), billing portal integration (`server/routes/billing_portal.ts`), and database tables for branding configurations, billing customers, and subscription management. All addons are accessible through sidebar navigation with mobile-responsive design.

## Apple Wallet Integration Preparation
Apple Pay and Google Pay readiness features have been integrated with domain verification support. The system includes Apple domain association file at `public/.well-known/apple-developer-merchantid-domain-association` for Stripe Apple Pay verification, an owner-controlled WALLETS_INFO feature toggle for showing/hiding wallet messaging in the UI, and complete preparation for enabling wallet payments through Stripe Checkout. The FEATURE_WALLETS_INFO environment variable controls wallet-related messaging display (default: disabled).

## Complete White-Label Branding System
A comprehensive white-label system with enterprise customer controls enables full platform customization. Features include owner-level branding toggles via `/owner/branding` with per-tenant feature management, organization-level white-label settings at `/org/white-label` for custom domains and email configuration, complete database schema with `org_entitlements` and `org_white_label` tables, automated Stripe subscription management for branding add-ons with `STRIPE_PRICE_BRANDING` and `STRIPE_PRICE_WHITE_LABEL` integration, real-time status tracking for DNS and email configuration, and secure role-based access controls with platform owner and organization admin levels. The system supports production deployment with environment variable configuration and graceful error handling for all Stripe operations.

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

## External Services
- **Stripe**: Billing integration
- **OpenAI**: Natural Language Processing for command bar