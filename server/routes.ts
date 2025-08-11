import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { 
  insertProjectSchema, 
  insertEmployeeSchema, 
  insertEquipmentSchema,
  updateEmployeeAssignmentSchema,
  updateEquipmentAssignmentSchema,
  updateProjectSchema,
  updateEmployeeSchema,
  updateEquipmentSchema
} from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import "./types"; // Import type declarations

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Auth middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, brandConfig } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        brandConfig: brandConfig || {}
      });

      // Generate token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: { id: user.id, username: user.username, brandConfig: user.brandConfig }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: { id: user.id, username: user.username, brandConfig: user.brandConfig }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/validate", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        id: user.id, 
        username: user.username, 
        brandConfig: user.brandConfig 
      });
    } catch (error) {
      console.error("Token validation error:", error);
      res.status(500).json({ message: "Validation failed" });
    }
  });

  app.patch("/api/auth/brand-config", authenticateToken, async (req, res) => {
    try {
      const { brandConfig } = req.body;
      
      const updatedUser = await storage.updateUserBrandConfig(req.user!.id, brandConfig);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        id: updatedUser.id, 
        username: updatedUser.username, 
        brandConfig: updatedUser.brandConfig 
      });
    } catch (error) {
      console.error("Brand config update error:", error);
      res.status(500).json({ message: "Update failed" });
    }
  });
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

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const updateData = updateProjectSchema.parse(req.body);
      const project = await storage.updateProject(req.params.id, updateData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
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

  // Employee profile update route  
  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const updateData = updateEmployeeSchema.parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, updateData);
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
      console.log(`[IDENTITY DEBUG] PATCH request for equipment ${req.params.id} with:`, req.body);
      const assignmentData = updateEquipmentAssignmentSchema.parse(req.body);
      const equipment = await storage.updateEquipmentAssignment(req.params.id, assignmentData);
      console.log(`[IDENTITY DEBUG] Response equipment:`, equipment);
      res.json(equipment);
    } catch (error) {
      console.error("Error updating equipment assignment:", error);
      res.status(400).json({ message: "Failed to update equipment assignment" });
    }
  });

  // Equipment profile update route
  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      const updateData = updateEquipmentSchema.parse(req.body);
      const equipment = await storage.updateEquipment(req.params.id, updateData);
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

  // Object storage routes for logo uploads
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/logo/upload-url", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getLogoUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating logo upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
