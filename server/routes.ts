import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertEmployeeSchema, 
  insertEquipmentSchema,
  updateEmployeeAssignmentSchema,
  updateEquipmentAssignmentSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  // Employees routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(400).json({ message: "Failed to create employee" });
    }
  });

  app.patch("/api/employees/:id/assignment", async (req, res) => {
    try {
      const assignmentData = updateEmployeeAssignmentSchema.parse(req.body);
      const employee = await storage.updateEmployeeAssignment(req.params.id, assignmentData);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee assignment:", error);
      res.status(400).json({ message: "Failed to update employee assignment" });
    }
  });

  // Direct employee update route (for Chakra UI app)
  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const assignmentData = updateEmployeeAssignmentSchema.parse(req.body);
      const employee = await storage.updateEmployeeAssignment(req.params.id, assignmentData);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(400).json({ message: "Failed to update employee" });
    }
  });

  // Equipment routes
  app.get("/api/equipment", async (req, res) => {
    try {
      const equipment = await storage.getEquipment();
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  app.get("/api/equipment/:id", async (req, res) => {
    try {
      const equipment = await storage.getEquipmentItem(req.params.id);
      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  app.post("/api/equipment", async (req, res) => {
    try {
      const equipmentData = insertEquipmentSchema.parse(req.body);
      const equipment = await storage.createEquipment(equipmentData);
      res.status(201).json(equipment);
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(400).json({ message: "Failed to create equipment" });
    }
  });

  app.patch("/api/equipment/:id/assignment", async (req, res) => {
    try {
      const assignmentData = updateEquipmentAssignmentSchema.parse(req.body);
      const equipment = await storage.updateEquipmentAssignment(req.params.id, assignmentData);
      res.json(equipment);
    } catch (error) {
      console.error("Error updating equipment assignment:", error);
      res.status(400).json({ message: "Failed to update equipment assignment" });
    }
  });

  // Direct equipment update route (for Chakra UI app)
  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      const assignmentData = updateEquipmentAssignmentSchema.parse(req.body);
      const equipment = await storage.updateEquipmentAssignment(req.params.id, assignmentData);
      res.json(equipment);
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(400).json({ message: "Failed to update equipment" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Alerts routes
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/alerts/:id/dismiss", async (req, res) => {
    try {
      await storage.dismissAlert(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error dismissing alert:", error);
      res.status(400).json({ message: "Failed to dismiss alert" });
    }
  });

  // Stats endpoint for dashboard
  app.get("/api/stats", async (req, res) => {
    try {
      const [projects, employees, equipment] = await Promise.all([
        storage.getProjects(),
        storage.getEmployees(),
        storage.getEquipment(),
      ]);

      const stats = {
        totalEmployees: employees.length,
        employeeGrowth: "+2 this week",
        totalEquipment: equipment.length,
        equipmentIssues: equipment.filter(eq => eq.status === "maintenance").length,
        activeProjects: projects.filter(p => p.status === "active").length,
        projectsOnTrack: "All on schedule",
        utilizationRate: Math.round(
          (employees.filter(emp => emp.currentProjectId).length / employees.length) * 100
        ),
        utilizationTrend: "+5% from last month",
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
