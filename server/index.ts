import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Real-time SSE endpoints
app.use("/api", stream);        // GET /api/stream (SSE endpoint)
// DISABLED: app.use("/api", assignments);   // Using main routes assignment endpoints instead
app.use("/api", archive);       // archive/restore/remove + GET /api/history with broadcast

// Billing endpoints
app.use("/api", billing);       // POST /api/billing/checkout, /api/billing/portal
app.use("/api", limits);        // Plan-based feature limits

/** Mock Replit DB for development **/
class MockReplitDB {
  private data: Record<string, any> = {};

  async get(key: string) {
    return this.data[key] || null;
  }

  async set(key: string, value: any) {
    this.data[key] = value;
  }
}

const db = new MockReplitDB();

/** Utility helpers **/
const EMPLOYEES_KEY = "employees";
const EQUIPMENT_KEY = "equipment";
const PROJECTS_KEY = "projects";

// Initialize DB with realistic data from Excel import
async function initData() {
  if ((await db.get(EMPLOYEES_KEY)) === null) {
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

      await db.set(EMPLOYEES_KEY, mockEmployees);
      await db.set(EQUIPMENT_KEY, mockEquipment);
      await db.set(PROJECTS_KEY, standardizedProjects);
      
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
      
      // Basic fallback data
      await db.set(EMPLOYEES_KEY, [
        { id: "emp-001", name: "John Smith", role: "Operator", skills: ["Excavator"], currentProjectId: null, isSupervisor: false },
        { id: "emp-002", name: "Sarah Johnson", role: "Supervisor", skills: ["Management"], currentProjectId: null, isSupervisor: true }
      ]);
      
      await db.set(EQUIPMENT_KEY, [
        { id: "eq-001", name: "CAT Excavator", type: "Heavy Equipment", status: "available", currentProjectId: null },
        { id: "eq-002", name: "Bulldozer", type: "Heavy Equipment", status: "available", currentProjectId: null }
      ]);
      
      await db.set(PROJECTS_KEY, [
        { 
          id: "proj-001", 
          projectNumber: "SAMPLE-001",
          name: "Sample Project", 
          location: "Seattle",
          status: "active", 
          progress: 50, 
          percentComplete: 50,
          percentMode: "auto",
          budget: 100000,
          gpsLatitude: null,
          gpsLongitude: null,
          description: null,
          kmzFileUrl: null,
          startDate: new Date().toISOString(),
          endDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
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

app.get("/api/employees", async (req, res) => {
  const employees = (await db.get(EMPLOYEES_KEY)) || [];
  res.json(employees);
});

app.get("/api/equipment", async (req, res) => {
  const equipment = (await db.get(EQUIPMENT_KEY)) || [];
  res.json(equipment);
});

app.get("/api/projects", async (req, res) => {
  let projects = (await db.get(PROJECTS_KEY)) || [];
  
  // Ensure all projects have required fields for full functionality
  const standardizedProjects = projects.map((project: any) => ({
    ...project,
    percentComplete: project.percentComplete ?? (project.progress || 0),
    percentMode: project.percentMode ?? "auto",
    projectNumber: project.projectNumber || `GEN-${project.id}`,
    status: project.status || "Planned"
  }));
  
  // Update database with standardized projects if changes were made
  const hasChanges = standardizedProjects.some((project: any, index: number) => 
    project.percentComplete !== projects[index]?.percentComplete ||
    project.percentMode !== projects[index]?.percentMode
  );
  
  if (hasChanges) {
    await db.set(PROJECTS_KEY, standardizedProjects);
    console.log(`✓ Migrated ${standardizedProjects.length} projects to include required fields`);
  }
  
  res.json(standardizedProjects);
});

/** ====== PATCH endpoints ====== **/

app.patch("/api/employees/:id/assignment", async (req, res) => {
  try {
    const { id } = req.params;
    const { projectId } = req.body;

    console.log(`\n=== EMPLOYEE ASSIGNMENT DEBUG ===`);
    console.log(`Employee ID: ${id}`);
    console.log(`Project ID: ${projectId}`);
    console.log(`Request body:`, JSON.stringify(req.body));

    const employees = (await db.get(EMPLOYEES_KEY)) || [];
    console.log(`Found ${employees.length} employees in database`);
    
    let found = false;
    const updatedEmployees = employees.map((emp: any) => {
      if (emp.id === id) {
        found = true;
        console.log(`Found employee: ${emp.name}, updating currentProjectId from ${emp.currentProjectId} to ${projectId}`);
        return { ...emp, currentProjectId: projectId, updatedAt: new Date().toISOString() };
      }
      return emp;
    });
    
    if (!found) {
      console.log(`Employee ${id} not found`);
      return res.status(404).json({ error: "Employee not found" });
    }

    await db.set(EMPLOYEES_KEY, updatedEmployees);
    const updatedEmployee = updatedEmployees.find((e: any) => e.id === id);
    console.log(`Assignment complete:`, updatedEmployee);
    console.log(`=================================\n`);
    
    res.json(updatedEmployee);
  } catch (error) {
    console.error("Error in employee assignment:", error);
    res.status(500).json({ error: "Failed to update employee assignment", message: error.message });
  }
});

app.patch("/api/equipment/:id/assignment", async (req, res) => {
  const { id } = req.params;
  const { projectId } = req.body;

  const equipment = (await db.get(EQUIPMENT_KEY)) || [];
  
  let found = false;
  const updatedEquipment = equipment.map((eq: any) => {
    if (eq.id === id) {
      found = true;
      return { ...eq, currentProjectId: projectId };
    }
    return eq;
  });
  
  if (!found) return res.status(404).json({ error: "Equipment not found" });

  await db.set(EQUIPMENT_KEY, updatedEquipment);
  const updatedItem = updatedEquipment.find((e: any) => e.id === id);
  res.json(updatedItem);
});

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
  
  // Register all routes (including auth)
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
  });
})();