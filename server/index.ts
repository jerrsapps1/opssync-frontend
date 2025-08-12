import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { registerRoutes } from "./routes";
import importExport from "./routes/importExport";
import projectContacts from "./routes/projectContacts";
import notes from "./routes/notes";
import archive from "./routes/archive";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Feature routes
app.use("/api", importExport);
app.use("/api", projectContacts);
app.use("/api", notes);
app.use("/api", archive);

/** Mock Replit DB for development **/
// For production deployment, replace this with:
// import { Database } from "@replit/database";
// const db = new Database();

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

// Initialize DB with sample data
async function initData() {
  if ((await db.get(EMPLOYEES_KEY)) === null) {
    await db.set(EMPLOYEES_KEY, [
      {
        id: "emp-001",
        name: "John Smith",
        role: "Heavy Equipment Operator",
        skills: ["Excavator", "Bulldozer"],
        currentProjectId: "proj-001",
        avatarUrl: null,
        isSupervisor: false,
      },
      {
        id: "emp-002", 
        name: "Sarah Johnson",
        role: "Site Supervisor",
        skills: ["Project Management", "Safety"],
        currentProjectId: "proj-001",
        avatarUrl: null,
        isSupervisor: true,
      },
      {
        id: "emp-003",
        name: "Mike Wilson",
        role: "Demolition Specialist", 
        skills: ["Controlled Demolition", "Safety"],
        currentProjectId: null,
        avatarUrl: null,
        isSupervisor: false,
      },
      {
        id: "emp-004",
        name: "Lisa Brown",
        role: "Equipment Mechanic",
        skills: ["Maintenance", "Repairs"],
        currentProjectId: "proj-002",
        avatarUrl: null,
        isSupervisor: false,
      },
      {
        id: "emp-005",
        name: "David Garcia",
        role: "Site Engineer",
        skills: ["Surveying", "Planning"],
        currentProjectId: null,
        avatarUrl: null,
        isSupervisor: true,
      }
    ]);
  }
  
  if ((await db.get(EQUIPMENT_KEY)) === null) {
    await db.set(EQUIPMENT_KEY, [
      {
        id: "eq-001",
        name: "Excavator CAT-320",
        type: "Heavy Machinery",
        make: "Caterpillar",
        model: "320",
        assetNumber: "AST-001",
        serialNumber: "EXC-001",
        status: "available",
        currentProjectId: null,
      },
      {
        id: "eq-002",
        name: "Pneumatic Drill Set",
        type: "Power Tools",
        make: "Bosch",
        model: "PD-500",
        assetNumber: "AST-002",
        serialNumber: "PDS-005",
        status: "maintenance",
        currentProjectId: null,
      },
      {
        id: "eq-003",
        name: "Bulldozer BD-450",
        type: "Heavy Machinery",
        make: "Caterpillar",
        model: "D6T",
        assetNumber: "AST-003",
        serialNumber: "BD-450",
        status: "in-use",
        currentProjectId: "proj-001",
      },
      {
        id: "eq-004",
        name: "Demo Hammer Kit",
        type: "Demolition",
        make: "Hilti",
        model: "TE-60",
        assetNumber: "AST-004",
        serialNumber: "DHK-100",
        status: "in-use",
        currentProjectId: "proj-002",
      },
      {
        id: "eq-005",
        name: "Concrete Mixer",
        type: "Heavy Equipment",
        status: "operational",
        currentProjectId: null,
      }
    ]);
  }
  
  if ((await db.get(PROJECTS_KEY)) === null) {
    await db.set(PROJECTS_KEY, [
      {
        id: "proj-001",
        name: "Downtown Mall Renovation",
        status: "active",
        progress: 65,
        startDate: "2024-11-01",
        endDate: "2025-03-15",
        supervisorId: "emp-002",
        budget: 850000,
        location: "Seattle, WA",
      },
      {
        id: "proj-002", 
        name: "Residential Complex Demo",
        status: "planning",
        progress: 15,
        startDate: "2025-02-01",
        endDate: "2025-05-30",
        supervisorId: null,
        budget: 1200000,
        location: "Portland, OR",
      },
      // Constant storage projects
      {
        id: "warehouse",
        name: "Demo Warehouse",
        status: "active",
        progress: 100,
        startDate: "2020-01-01",
        endDate: "2030-12-31",
        supervisorId: null,
        budget: 0,
        location: "Main Storage Facility",
      },
      {
        id: "maintenance",
        name: "Maintenance Shop",
        status: "active",
        progress: 100,
        startDate: "2020-01-01",
        endDate: "2030-12-31",
        supervisorId: null,
        budget: 0,
        location: "Service Center",
      },
      // 15 diverse mock projects
      {
        id: "proj-100",
        name: "Highway Bridge Construction",
        status: "active",
        progress: 45,
        startDate: "2024-12-15",
        endDate: "2025-08-30",
        supervisorId: null,
        budget: 2500000,
        location: "I-5 Corridor, WA",
      },
      {
        id: "proj-101",
        name: "Industrial Warehouse Demo",
        status: "planning",
        progress: 25,
        startDate: "2025-03-01",
        endDate: "2025-06-15",
        supervisorId: null,
        budget: 750000,
        location: "Kent Industrial District",
      },
      {
        id: "proj-102",
        name: "School Building Renovation",
        status: "active",
        progress: 75,
        startDate: "2024-09-01",
        endDate: "2025-04-30",
        supervisorId: null,
        budget: 1800000,
        location: "Bellevue School District",
      },
      {
        id: "proj-103",
        name: "Office Tower Construction",
        status: "active",
        progress: 35,
        startDate: "2024-10-01",
        endDate: "2026-02-28",
        supervisorId: null,
        budget: 15000000,
        location: "Belltown, Seattle",
      },
      {
        id: "proj-104",
        name: "Parking Garage Demo",
        status: "planning",
        progress: 10,
        startDate: "2025-04-15",
        endDate: "2025-07-30",
        supervisorId: null,
        budget: 500000,
        location: "Capitol Hill, Seattle",
      },
      {
        id: "proj-105",
        name: "Subway Station Upgrade",
        status: "active",
        progress: 60,
        startDate: "2024-08-01",
        endDate: "2025-12-31",
        supervisorId: null,
        budget: 8000000,
        location: "University District",
      },
      {
        id: "proj-106",
        name: "Hospital Wing Addition",
        status: "active",
        progress: 55,
        startDate: "2024-11-15",
        endDate: "2026-01-15",
        supervisorId: null,
        budget: 25000000,
        location: "First Hill Medical Center",
      },
      {
        id: "proj-107",
        name: "Waterfront Pier Restoration",
        status: "planning",
        progress: 20,
        startDate: "2025-05-01",
        endDate: "2025-11-30",
        supervisorId: null,
        budget: 3500000,
        location: "Elliott Bay Waterfront",
      },
      {
        id: "proj-108",
        name: "Stadium Renovation",
        status: "active",
        progress: 40,
        startDate: "2024-12-01",
        endDate: "2025-09-15",
        supervisorId: null,
        budget: 50000000,
        location: "SoDo Sports Complex",
      },
      {
        id: "proj-109",
        name: "Shopping Center Demo",
        status: "planning",
        progress: 15,
        startDate: "2025-06-01",
        endDate: "2025-10-31",
        supervisorId: null,
        budget: 2000000,
        location: "Northgate District",
      },
      {
        id: "proj-110",
        name: "Apartment Complex Construction",
        status: "active",
        progress: 30,
        startDate: "2024-09-15",
        endDate: "2026-03-31",
        supervisorId: null,
        budget: 35000000,
        location: "South Lake Union",
      },
      {
        id: "proj-111",
        name: "Factory Demolition",
        status: "planning",
        progress: 5,
        startDate: "2025-07-01",
        endDate: "2025-12-15",
        supervisorId: null,
        budget: 1200000,
        location: "Georgetown Industrial",
      },
      {
        id: "proj-112",
        name: "Community Center Renovation",
        status: "active",
        progress: 80,
        startDate: "2024-07-01",
        endDate: "2025-03-31",
        supervisorId: null,
        budget: 900000,
        location: "Fremont Neighborhood",
      },
      {
        id: "proj-113",
        name: "Library Construction",
        status: "active",
        progress: 50,
        startDate: "2024-10-15",
        endDate: "2025-08-15",
        supervisorId: null,
        budget: 4500000,
        location: "West Seattle",
      },
      {
        id: "proj-114",
        name: "Marina Expansion",
        status: "planning",
        progress: 30,
        startDate: "2025-08-01",
        endDate: "2026-05-31",
        supervisorId: null,
        budget: 6000000,
        location: "Shilshole Bay",
      }
    ]);
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
  const projects = (await db.get(PROJECTS_KEY)) || [];
  res.json(projects);
});

// Individual entity endpoints for detail pages
app.get("/api/employees/:id", async (req, res) => {
  const employees = (await db.get(EMPLOYEES_KEY)) || [];
  const employee = employees.find((emp: any) => emp.id === req.params.id);
  if (!employee) return res.status(404).json({ error: "Employee not found" });
  res.json(employee);
});

app.get("/api/equipment/:id", async (req, res) => {
  const equipment = (await db.get(EQUIPMENT_KEY)) || [];
  const item = equipment.find((eq: any) => eq.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Equipment not found" });
  res.json(item);
});

// Template file serving
app.get("/templates/:filename", (req, res) => {
  const path = require("path");
  const fs = require("fs");
  const filePath = path.join(process.cwd(), "templates", req.params.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Template not found" });
  }
  
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=${req.params.filename}`);
  res.sendFile(filePath);
});

/** ====== PATCH endpoints ====== **/
app.patch("/api/employees/:id", async (req, res) => {
  const employees = (await db.get(EMPLOYEES_KEY)) || [];
  const id = req.params.id;
  const update = req.body;

  let found = false;
  const updatedEmployees = employees.map((emp: any) => {
    if (emp.id === id) {
      found = true;
      return { ...emp, ...update };
    }
    return emp;
  });
  
  if (!found) return res.status(404).json({ error: "Employee not found" });

  await db.set(EMPLOYEES_KEY, updatedEmployees);
  const updatedEmployee = updatedEmployees.find((emp: any) => emp.id === id);
  res.json(updatedEmployee);
});

app.patch("/api/equipment/:id", async (req, res) => {
  const equipment = (await db.get(EQUIPMENT_KEY)) || [];
  const id = req.params.id;
  const update = req.body;

  let found = false;
  const updatedEquipment = equipment.map((eq: any) => {
    if (eq.id === id) {
      found = true;
      return { ...eq, ...update };
    }
    return eq;
  });
  
  if (!found) return res.status(404).json({ error: "Equipment not found" });

  await db.set(EQUIPMENT_KEY, updatedEquipment);
  const updatedItem = updatedEquipment.find((eq: any) => eq.id === id);
  res.json(updatedItem);
});

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** ====== POST endpoints (Create) ====== **/
app.post("/api/employees", async (req, res) => {
  const employees = (await db.get(EMPLOYEES_KEY)) || [];
  const newEmp = {
    id: uuidv4(),
    name: req.body.name || "Unnamed Employee",
    role: req.body.role || "Worker",
    skills: req.body.skills || [],
    currentProjectId: null,
    avatarUrl: req.body.avatarUrl || null,
  };
  employees.push(newEmp);
  await db.set(EMPLOYEES_KEY, employees);
  res.status(201).json(newEmp);
});

app.post("/api/equipment", async (req, res) => {
  const equipment = (await db.get(EQUIPMENT_KEY)) || [];
  const newEq = {
    id: uuidv4(),
    name: req.body.name || "Unnamed Equipment",
    type: req.body.type || "Tool",
    status: req.body.status || "operational",
    currentProjectId: null,
  };
  equipment.push(newEq);
  await db.set(EQUIPMENT_KEY, equipment);
  res.status(201).json(newEq);
});

app.post("/api/projects", async (req, res) => {
  const projects = (await db.get(PROJECTS_KEY)) || [];
  const newProj = {
    id: uuidv4(),
    name: req.body.name || "New Project",
    status: req.body.status || "planning",
    progress: req.body.progress || 0,
    startDate: req.body.startDate || new Date().toISOString().split('T')[0],
    endDate: req.body.endDate || null,
  };
  projects.push(newProj);
  await db.set(PROJECTS_KEY, projects);
  res.status(201).json(newProj);
});

/** ====== Enhanced Conflicts endpoint ====== **/
app.get("/api/conflicts", async (req, res) => {
  const employees = (await db.get(EMPLOYEES_KEY)) || [];
  const equipment = (await db.get(EQUIPMENT_KEY)) || [];
  const projects = (await db.get(PROJECTS_KEY)) || [];

  const empProjectMap: Record<string, string> = {};
  const empConflicts: any[] = [];
  const supervisorConflicts: any[] = [];
  
  employees.forEach((emp: any) => {
    if (emp.currentProjectId) {
      if (empProjectMap[emp.id]) {
        empConflicts.push(emp);
      } else {
        empProjectMap[emp.id] = emp.currentProjectId;
      }
    }
    
    // Check supervisor conflicts (supervisor assigned to multiple projects)
    if (emp.isSupervisor) {
      const projectsSupervised = projects.filter((p: any) => p.supervisorId === emp.id);
      if (projectsSupervised.length > 1) {
        supervisorConflicts.push({
          supervisor: emp,
          projects: projectsSupervised
        });
      }
    }
  });

  const eqProjectMap: Record<string, string> = {};
  const eqConflicts: any[] = [];
  equipment.forEach((eq: any) => {
    if (eq.currentProjectId) {
      if (eqProjectMap[eq.id]) {
        eqConflicts.push(eq);
      } else {
        eqProjectMap[eq.id] = eq.currentProjectId;
      }
    }
  });

  // Check for projects without supervisors
  const projectsWithoutSupervisors = projects.filter((p: any) => 
    p.status === 'active' && !p.supervisorId
  );

  res.json({ 
    employeeConflicts: empConflicts, 
    equipmentConflicts: eqConflicts,
    supervisorConflicts: supervisorConflicts,
    projectsWithoutSupervisors: projectsWithoutSupervisors
  });
});

/** ====== Supervisor Management endpoints ====== **/
app.get("/api/supervisors", async (req, res) => {
  const employees = (await db.get(EMPLOYEES_KEY)) || [];
  const supervisors = employees.filter((emp: any) => emp.isSupervisor);
  res.json(supervisors);
});

app.patch("/api/projects/:id/supervisor", async (req, res) => {
  const projects = (await db.get(PROJECTS_KEY)) || [];
  const projectId = req.params.id;
  const { supervisorId } = req.body;

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
  // Initialize sample data
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
