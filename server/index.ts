import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
// Set owner email environment variable for development
process.env.OWNER_EMAIL = process.env.OWNER_EMAIL || "admin@demo.com";

import { registerRoutes } from "./routes";
import stripeWebhookRouter from "./routes/stripe_webhooks";
import { setupVite, serveStatic, log } from "./vite";
import stream from "./realtime/stream";
import assignments from "./routes/assignments";
import archive from "./routes/archive";
import billing from "./routes/billing";
import stripeWebhook from "./routes/stripe-webhook";
import limits from "./routes/limits";

const app = express();

// Stripe webhook needs raw body parser before JSON parser
app.use("/api", stripeWebhook);  // NOTE: uses express.raw for signature verification

// Stripe webhook requires raw body, must come before express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Real-time SSE endpoints
app.use("/api", stream);        // GET /api/stream (SSE endpoint)
// DISABLED: app.use("/api", assignments);   // Using main routes assignment endpoints instead
app.use("/api", archive);       // archive/restore/remove + GET /api/history with broadcast

// Billing endpoints
app.use("/api", billing);       // POST /api/billing/checkout, /api/billing/portal
app.use("/api", limits);        // Plan-based feature limits

// Import shared DB instance
import { db, EMPLOYEES_KEY, EQUIPMENT_KEY, PROJECTS_KEY } from "./sharedDb";

// Import storage to check for existing data
import { storage } from "./storage";
import { startTimelinessAddons } from "./services/scheduler_addons";
import { startCronWithTenantChecks } from "./services/cron_feature_checks";
import { startCronPerTenant } from "./services/cron_feature_checks_tenant";

// Initialize DB with realistic data from Excel import
async function initData() {
  // Check if we already have projects in PostgreSQL (to avoid overriding user-created data)
  const existingProjects = await storage.getProjects();
  const hasUserProjects = existingProjects && existingProjects.length > 0;
  
  console.log(`💾 initData: Found ${existingProjects.length} existing projects in PostgreSQL database`);
  
  // Check if employees and equipment exist regardless of projects
  const existingEmployees = (await db.get(EMPLOYEES_KEY)) || [];
  const existingEquipment = (await db.get(EQUIPMENT_KEY)) || [];
  const hasEmployeesAndEquipment = existingEmployees.length > 0 && existingEquipment.length > 0;
  
  if (hasUserProjects && hasEmployeesAndEquipment) {
    console.log(`💾 initData: User projects and employees/equipment found, skipping mock data initialization`);
    return;
  }
  
  // Load employees and equipment if missing
  if (!hasEmployeesAndEquipment) {
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      // Load realistic mock data from generated files
      const mockEmployees = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/mock-employees.json'), 'utf-8'));
      const mockEquipment = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/mock-equipment.json'), 'utf-8'));
      const mockProjects = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/mock-projects.json'), 'utf-8'));
      
      // Ensure all projects have required fields for full functionality
      const standardizedProjects = mockProjects.map((project: any) => ({
        ...project,
        percentComplete: project.percentComplete ?? (project.progress || 0),
        percentMode: project.percentMode ?? "auto",
        status: project.status || "Planned",
        projectNumber: project.projectNumber || `GEN-${project.id}`,
        gpsLatitude: project.gpsLatitude || null,
        gpsLongitude: project.gpsLongitude || null,
        description: project.description || null,
        kmzFileUrl: project.kmzFileUrl || null,
        startDate: project.startDate || new Date().toISOString(),
        endDate: project.endDate || null,
        progress: project.progress || project.percentComplete || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      console.log(`✓ Standardized ${standardizedProjects.length} projects with required fields`);

      // Load employees and equipment into PostgreSQL storage for consistency
      console.log(`💾 initData: Loading ${mockEmployees.length} employees into PostgreSQL storage`);
      for (const employee of mockEmployees) {
        await storage.createEmployee(employee);
      }
      
      console.log(`💾 initData: Loading ${mockEquipment.length} equipment into PostgreSQL storage`);
      for (const equipment of mockEquipment) {
        await storage.createEquipment(equipment);
      }
      
      // Also save to shared DB for backward compatibility
      await db.set(EMPLOYEES_KEY, mockEmployees);
      await db.set(EQUIPMENT_KEY, mockEquipment);
      
      console.log(`💾 initData: Skipping mock projects - using PostgreSQL storage only`);
      
      // Verify all projects have required fields
      console.log('✓ Sample project fields verification:');
      const firstProject = standardizedProjects[0];
      console.log(`  - percentComplete: ${firstProject.percentComplete !== undefined ? '✓' : '✗'}`);
      console.log(`  - percentMode: ${firstProject.percentMode ? '✓' : '✗'}`);
      console.log(`  - projectNumber: ${firstProject.projectNumber ? '✓' : '✗'}`);
      
      console.log('✓ Loaded realistic mock data from Excel import');
      console.log(`  - ${mockEmployees.length} employees`);
      console.log(`  - ${mockEquipment.length} equipment items`);
      console.log(`  - ${mockProjects.length} projects`);
    } catch (error) {
      console.log('⚠ Mock data files not found, using basic sample data');
      
      // Basic fallback data loaded into PostgreSQL storage
      const fallbackEmployees = [
        { name: "John Smith", role: "Operator", skills: ["Excavator"], currentProjectId: null, isSupervisor: false },
        { name: "Sarah Johnson", role: "Supervisor", skills: ["Management"], currentProjectId: null, isSupervisor: true }
      ];
      
      const fallbackEquipment = [
        { name: "CAT Excavator", type: "Heavy Equipment", status: "available", currentProjectId: null },
        { name: "Bulldozer", type: "Heavy Equipment", status: "available", currentProjectId: null }
      ];
      
      // Load fallback data into PostgreSQL storage
      console.log(`💾 initData: Loading ${fallbackEmployees.length} fallback employees into PostgreSQL storage`);
      for (const employee of fallbackEmployees) {
        await storage.createEmployee(employee);
      }
      
      console.log(`💾 initData: Loading ${fallbackEquipment.length} fallback equipment into PostgreSQL storage`);
      for (const equipment of fallbackEquipment) {
        await storage.createEquipment(equipment);
      }
      
      // Also save to shared DB for backward compatibility
      await db.set(EMPLOYEES_KEY, fallbackEmployees);
      await db.set(EQUIPMENT_KEY, fallbackEquipment);
      
      console.log(`💾 initData: Skipping fallback projects - using PostgreSQL storage only`);
    }
  }
}

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/** ====== GET endpoints ====== **/

// Employees, equipment, and projects routes moved to routes.ts to use PostgreSQL storage
// app.get("/api/employees", async (req, res) => { ... });
// app.get("/api/equipment", async (req, res) => { ... });
// app.get("/api/projects", async (req, res) => { ... });

/** ====== PATCH endpoints ====== **/

// Assignment routes moved to routes.ts to use PostgreSQL storage
// app.patch("/api/employees/:id/assignment", ...) - now in routes.ts
// app.patch("/api/equipment/:id/assignment", ...) - now in routes.ts

app.patch("/api/projects/:id/supervisor", async (req, res) => {
  const { id: projectId } = req.params;
  const { supervisorId } = req.body;

  const projects = (await db.get(PROJECTS_KEY)) || [];
  
  let found = false;
  const updatedProjects = projects.map((proj: any) => {
    if (proj.id === projectId) {
      found = true;
      return { ...proj, supervisorId };
    }
    return proj;
  });
  
  if (!found) return res.status(404).json({ error: "Project not found" });

  await db.set(PROJECTS_KEY, updatedProjects);
  const updatedProject = updatedProjects.find((p: any) => p.id === projectId);
  res.json(updatedProject);
});

/** ====== Analytics endpoint ====== **/
app.get("/api/analytics", async (req, res) => {
  const employees = (await db.get(EMPLOYEES_KEY)) || [];
  const equipment = (await db.get(EQUIPMENT_KEY)) || [];
  const projects = (await db.get(PROJECTS_KEY)) || [];

  const analytics = {
    totalEmployees: employees.length,
    assignedEmployees: employees.filter((e: any) => e.currentProjectId).length,
    totalSupervisors: employees.filter((e: any) => e.isSupervisor).length,
    totalEquipment: equipment.length,
    assignedEquipment: equipment.filter((e: any) => e.currentProjectId).length,
    operationalEquipment: equipment.filter((e: any) => e.status === 'operational').length,
    activeProjects: projects.filter((p: any) => p.status === 'active').length,
    totalProjects: projects.length,
    averageProjectProgress: projects.reduce((acc: number, p: any) => acc + p.progress, 0) / projects.length || 0,
    projectsBudgetTotal: projects.reduce((acc: number, p: any) => acc + (p.budget || 0), 0)
  };

  res.json(analytics);
});

(async () => {
  // Initialize realistic mock data
  await initData();
  
  // Register all routes (including auth) - this includes the PostgreSQL projects route
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup vite in development and serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve on the specified port
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start enhanced tenant-aware cron system with per-tenant runners
    startCronPerTenant();
  });
})();