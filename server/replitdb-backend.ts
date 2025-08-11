import express from "express";
import cors from "cors";
import { json } from "body-parser";

const app = express();
app.use(cors());
app.use(json());

const PORT = process.env.PORT || 5000;

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
      },
      {
        id: "emp-002", 
        name: "Sarah Johnson",
        role: "Site Supervisor",
        skills: ["Project Management", "Safety"],
        currentProjectId: "proj-001",
        avatarUrl: null,
      },
      {
        id: "emp-003",
        name: "Mike Wilson",
        role: "Demolition Specialist", 
        skills: ["Controlled Demolition", "Safety"],
        currentProjectId: null,
        avatarUrl: null,
      },
      {
        id: "emp-004",
        name: "Lisa Brown",
        role: "Equipment Mechanic",
        skills: ["Maintenance", "Repairs"],
        currentProjectId: "proj-002",
        avatarUrl: null,
      },
      {
        id: "emp-005",
        name: "David Garcia",
        role: "Site Engineer",
        skills: ["Surveying", "Planning"],
        currentProjectId: null,
        avatarUrl: null,
      }
    ]);
  }
  
  if ((await db.get(EQUIPMENT_KEY)) === null) {
    await db.set(EQUIPMENT_KEY, [
      {
        id: "eq-001",
        name: "Excavator CAT-320",
        type: "Heavy Equipment",
        status: "operational",
        currentProjectId: "proj-001",
      },
      {
        id: "eq-002",
        name: "Bulldozer D6",
        type: "Heavy Equipment", 
        status: "operational",
        currentProjectId: "proj-001",
      },
      {
        id: "eq-003",
        name: "Demolition Hammer",
        type: "Tool",
        status: "operational",
        currentProjectId: null,
      },
      {
        id: "eq-004",
        name: "Dump Truck",
        type: "Heavy Equipment",
        status: "maintenance",
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
        startDate: "2024-01-15",
        endDate: "2024-06-30",
      },
      {
        id: "proj-002", 
        name: "Highway Bridge Construction",
        status: "active",
        progress: 35,
        startDate: "2024-02-01",
        endDate: "2024-08-15",
      },
      {
        id: "proj-003",
        name: "Warehouse Demolition",
        status: "planning",
        progress: 10,
        startDate: "2024-04-01", 
        endDate: "2024-07-31",
      }
    ]);
  }
}

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

/** ====== POST endpoints (Create) ====== **/
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

/** ====== Conflicts endpoint ====== **/
app.get("/api/conflicts", async (req, res) => {
  const employees = (await db.get(EMPLOYEES_KEY)) || [];
  const equipment = (await db.get(EQUIPMENT_KEY)) || [];

  // Check for any potential conflicts
  const empProjectMap: Record<string, string> = {};
  const empConflicts: any[] = [];
  employees.forEach((emp: any) => {
    if (emp.currentProjectId) {
      if (empProjectMap[emp.id]) {
        empConflicts.push(emp);
      } else {
        empProjectMap[emp.id] = emp.currentProjectId;
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

  res.json({ employeeConflicts: empConflicts, equipmentConflicts: eqConflicts });
});

// Initialize data and start server
initData().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend API running on port ${PORT}`);
  });
});

export default app;