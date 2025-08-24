import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { 
  insertProjectSchema, 
  insertEmployeeSchema, 
  insertEquipmentSchema,
  insertProjectContactSchema,
  updateEmployeeAssignmentSchema,
  updateEquipmentAssignmentSchema,
  updateProjectSchema,
  updateEmployeeSchema,
  updateEquipmentSchema,
  updateBrandConfigSchema,
  insertWorkOrderSchema,
  updateWorkOrderSchema
} from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from 'multer';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { computeStatus } from "./utils/timeliness";
import supervisorRouter from "./routes/supervisor";
import slaRouter from "./routes/sla";
import devRouter from "./routes/dev";
import managerRouter from "./routes/manager";
import managerFriendlyRouter from "./routes/manager_friendly";
import orgAdminRouter from "./routes/org_admin";
import ownerAdminRouter from "./routes/owner_admin";
import analyticsRouter from "./routes/analytics";
import brandingRouter from "./routes/branding";
import billingRouter from "./routes/billing";
import billingPortalRouter from "./routes/billing_portal";
import ownerBrandingAdminRouter from "./routes/owner_branding_admin";
import orgEntitlementsRouter from "./routes/org_entitlements";
import whiteLabelRouter from "./routes/white_label";
import { mockAuth } from "./middleware/authz";
import { features } from "./config/features";
import "./types"; // Import type declarations

// Helper function for status-based conditional logging with enhanced tracking
async function logProjectActivity({
  employeeId,
  employeeName,
  equipmentId,
  equipmentName,
  previousProjectId,
  newProjectId,
  entityType,
  performedBy,
  performedByEmail
}: {
  employeeId?: string;
  employeeName?: string;
  equipmentId?: string;
  equipmentName?: string;
  previousProjectId?: string | null;
  newProjectId?: string | null;
  entityType: "employee" | "equipment";
  performedBy?: string;
  performedByEmail?: string;
}) {
  try {
    const entityId = employeeId || equipmentId;
    const entityName = employeeName || equipmentName;
    
    if (!entityId || !entityName) return;

    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0].slice(0, 5); // HH:MM

    // Get project details for both source and destination
    const [previousProject, newProject] = await Promise.all([
      previousProjectId ? storage.getProject(previousProjectId) : null,
      newProjectId ? storage.getProject(newProjectId) : null
    ]);

    // If both projects exist and this is a direct move between active projects, log as "moved"
    if (previousProject && newProject && 
        previousProject.status === "Active" && newProject.status === "Active") {
      await storage.createProjectActivityLog({
        date,
        time,
        action: "moved",
        entityType,
        entityName,
        entityId,
        projectId: newProjectId!,
        projectName: newProject?.name || 'Unknown Project',
        fromProjectId: previousProjectId || undefined,
        fromProjectName: previousProject?.name || undefined,
        performedBy: performedBy || "Admin User",
        performedByEmail: performedByEmail || undefined
      });
      console.log(`📝 Logged move: ${entityName} moved from ${previousProject.name} to ${newProject.name} (Both Active projects)`);
      return;
    }

    // Log removal from previous project (if it was active)
    if (previousProject && previousProject.status === "Active") {
      await storage.createProjectActivityLog({
        date,
        time,
        action: "removed",
        entityType,
        entityName,
        entityId,
        projectId: previousProjectId!,
        projectName: previousProject.name,
        performedBy: performedBy || "Admin User",
        performedByEmail: performedByEmail || undefined
      });
      console.log(`📝 Logged removal: ${entityName} removed from ${previousProject.name} (Active project)`);
    } else if (previousProject) {
      console.log(`⏸️ Skipped logging removal: ${previousProject.name} is ${previousProject.status} (logging disabled)`);
    }

    // Log assignment to new project (if it's active)
    if (newProject && newProject.status === "Active") {
      await storage.createProjectActivityLog({
        date,
        time,
        action: "assigned",
        entityType,
        entityName,
        entityId,
        projectId: newProjectId!,
        projectName: newProject.name,
        fromProjectId: previousProject && previousProject.status !== "Active" ? previousProjectId || undefined : undefined,
        fromProjectName: previousProject && previousProject.status !== "Active" ? previousProject.name : undefined,
        performedBy: performedBy || "Admin User",
        performedByEmail: performedByEmail || undefined
      });
      console.log(`📝 Logged assignment: ${entityName} assigned to ${newProject.name} (Active project)`);
    } else if (newProject) {
      console.log(`⏸️ Skipped logging assignment: ${newProject.name} is ${newProject.status} (logging disabled)`);
    }
  } catch (error) {
    console.error("Error logging project activity:", error);
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Simple command parser for basic functionality
function parseSimpleCommands(text: string): any[] {
  const lower = text.toLowerCase();
  const actions: any[] = [];

  // Parse "move [employee] to [project]" commands
  const moveMatch = lower.match(/move\s+(.+?)\s+to\s+(.+)/);
  if (moveMatch) {
    actions.push({
      type: "move_employee",
      employee_query: moveMatch[1].trim(),
      project: moveMatch[2].trim()
    });
  }

  // Parse "assign [equipment] to [project]" commands
  const assignMatch = lower.match(/assign\s+(.+?)\s+to\s+(.+)/);
  if (assignMatch) {
    actions.push({
      type: "assign_equipment",
      equipment_query: assignMatch[1].trim(),
      project: assignMatch[2].trim()
    });
  }

  // Parse "list unassigned" or "show unassigned" commands
  if (lower.includes("list unassigned") || lower.includes("show unassigned")) {
    actions.push({
      type: "list_unassigned"
    });
  }

  return actions;
}

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Auth middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // Check authorization header first
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  // For export routes, also check query parameter
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

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

// Import shared DB instance
import { db, EMPLOYEES_KEY, EQUIPMENT_KEY, PROJECTS_KEY } from "./sharedDb";

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
  // Projects Excel export route - MUST come before :id route  
  app.get("/api/projects/export", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      console.log(`🏗️ Projects Excel Export: Found ${projects.length} projects`);
      
      // Transform project data for Excel export
      const exportData = projects.map((proj, index) => ({
        'Row': index + 1,
        'Project Number': proj.projectNumber || '',
        'Name': proj.name,
        'Location': proj.location || '',
        'Status': proj.status || '',
        'Progress %': proj.progress || proj.percentComplete || 0,
        'GPS Latitude': proj.gpsLatitude || '',
        'GPS Longitude': proj.gpsLongitude || '',
        'Description': proj.description || '',
        'Start Date': proj.startDate ? new Date(proj.startDate).toLocaleDateString() : '',
        'End Date': proj.endDate ? new Date(proj.endDate).toLocaleDateString() : '',
        'Created Date': proj.createdAt ? new Date(proj.createdAt).toLocaleDateString() : '',
        'Updated Date': proj.updatedAt ? new Date(proj.updatedAt).toLocaleDateString() : ''
      }));

      console.log(`🏗️ Projects Excel Export: Transformed ${exportData.length} records`);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Create the worksheet data manually as a 2D array to ensure proper structure
      const worksheetData = [
        ['PROJECT DIRECTORY - TOTAL RECORDS: ' + projects.length], // Row 1
        ['Generated on: ' + new Date().toLocaleDateString()], // Row 2
        [], // Row 3 (empty)
        // Row 4 - Headers
        Object.keys(exportData[0])
      ];
      
      // Add all data rows
      exportData.forEach(row => {
        worksheetData.push(Object.values(row).map(v => v?.toString() || ''));
      });
      
      // Create worksheet from the 2D array
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = [
        { wch: 5 },  // Row
        { wch: 15 }, // Project Number
        { wch: 25 }, // Name
        { wch: 20 }, // Location
        { wch: 12 }, // Status
        { wch: 10 }, // Progress %
        { wch: 12 }, // GPS Latitude
        { wch: 12 }, // GPS Longitude
        { wch: 30 }, // Description
        { wch: 12 }, // Start Date
        { wch: 12 }, // End Date
        { wch: 12 }, // Created Date
        { wch: 12 }, // Updated Date
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');

      // Generate Excel file buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set headers for file download
      const timestamp = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Disposition', `attachment; filename="projects-export-${timestamp}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      console.log(`🏗️ Projects Excel Export: Successfully generated file with ${projects.length} projects`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting projects:", error);
      res.status(500).json({ message: "Failed to export projects" });
    }
  });

  // Projects PDF export route - MUST come before :id route  
  app.get("/api/projects/export-pdf", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      
      const doc = new PDFDocument({ margin: 50 });
      const timestamp = new Date().toISOString().split('T')[0];
      
      res.setHeader('Content-Disposition', `attachment; filename="projects-export-${timestamp}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      
      doc.pipe(res);
      
      // Title
      doc.fontSize(18).font('Helvetica-Bold').text('Project Directory', 50, 50);
      doc.fontSize(10).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, 50, 75);
      
      let yPosition = 110;
      
      projects.forEach((proj, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
        
        doc.fontSize(12).font('Helvetica-Bold').text(`${index + 1}. ${proj.name}`, 50, yPosition);
        yPosition += 20;
        
        if (proj.projectNumber) {
          doc.fontSize(10).font('Helvetica').text(`Project Number: ${proj.projectNumber}`, 70, yPosition);
          yPosition += 15;
        }
        
        if (proj.location) {
          doc.text(`Location: ${proj.location}`, 70, yPosition);
          yPosition += 15;
        }
        
        if (proj.status) {
          doc.text(`Status: ${proj.status}`, 70, yPosition);
          yPosition += 15;
        }
        
        if (proj.progress !== undefined) {
          doc.text(`Progress: ${proj.progress}%`, 70, yPosition);
          yPosition += 15;
        }

        if (proj.description) {
          doc.text(`Description: ${proj.description}`, 70, yPosition);
          yPosition += 15;
        }
        
        yPosition += 10;
      });
      
      doc.end();
    } catch (error) {
      console.error("Error exporting projects PDF:", error);
      res.status(500).json({ message: "Failed to export projects PDF" });
    }
  });

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
      // Get project contacts
      const contacts = await storage.getProjectContacts(req.params.id);
      res.json({ ...project, contacts });
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { contacts, ...projectData } = req.body;
      const parsedProjectData = insertProjectSchema.parse(projectData);
      const project = await storage.createProject(parsedProjectData);
      
      // Save contacts if provided
      if (contacts && Array.isArray(contacts) && contacts.length > 0) {
        for (const contact of contacts) {
          if (contact.name && contact.position) { // Only save contacts with required fields
            await storage.createProjectContact({
              projectId: project.id,
              name: contact.name,
              position: contact.position,
              email: contact.email || '',
              mobile: contact.mobile || '',
              company: contact.company || '',
              isPrimary: contact.isPrimary || false
            });
          }
        }
      }
      
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

  // Employee template download route - MUST come before :id route
  app.get("/api/employees/template", async (req, res) => {
    try {
      // Create template data with sample row and headers
      const templateData = [
        {
          'Name': 'John Smith',
          'Role': 'Equipment Operator',
          'Email': 'john.smith@company.com',
          'Phone': '(555) 123-4567',
          'Employment Status': 'active',
          'Years Experience': '5',
          'Equipment Operated': 'Excavator, Bulldozer'
        }
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Create the worksheet data with instructions
      const worksheetData = [
        ['EMPLOYEE IMPORT TEMPLATE'], // Row 1
        ['Instructions: Fill in employee data below. Delete the sample row before importing.'], // Row 2
        ['Required fields: Name, Role. Optional: Email, Phone, Employment Status, Years Experience, Equipment Operated'], // Row 3
        [], // Row 4 (empty)
        // Row 5 - Headers
        Object.keys(templateData[0]),
        // Row 6 - Sample data
        Object.values(templateData[0])
      ];
      
      // Create worksheet from the 2D array
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = [
        { wch: 25 }, // Name
        { wch: 20 }, // Role
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 15 }, // Employment Status
        { wch: 15 }, // Years Experience
        { wch: 30 }, // Equipment Operated
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Template');

      // Generate Excel file buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set headers for file download
      res.setHeader('Content-Disposition', 'attachment; filename="employee-import-template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      console.log(`📋 Employee Template: Generated template file`);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating employee template:", error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  // Employee import route - MUST come before :id route
  app.post("/api/employees/import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log(`📊 Employee Import: Processing ${jsonData.length} rows`);

      let importedCount = 0;
      let errors: string[] = [];

      for (const [index, row] of jsonData.entries()) {
        try {
          // Skip header rows or instruction rows
          if (!row['Name'] || row['Name'].toString().toLowerCase().includes('template') || 
              row['Name'].toString().toLowerCase().includes('instruction')) {
            continue;
          }

          const employeeData = {
            name: row['Name']?.toString().trim(),
            role: row['Role']?.toString().trim(),
            email: row['Email']?.toString().trim() || undefined,
            phone: row['Phone']?.toString().trim() || undefined,
            employmentStatus: row['Employment Status']?.toString().trim() || 'active',
            yearsExperience: parseInt(row['Years Experience']?.toString()) || 0,
            operates: row['Equipment Operated'] ? 
              row['Equipment Operated'].toString().split(',').map(s => s.trim()).filter(s => s) : []
          };

          // Validate required fields
          if (!employeeData.name || !employeeData.role) {
            errors.push(`Row ${index + 1}: Name and Role are required`);
            continue;
          }

          // Create employee through storage
          await storage.createEmployee(employeeData);
          importedCount++;
        } catch (error) {
          console.error(`Error importing row ${index + 1}:`, error);
          errors.push(`Row ${index + 1}: ${error.message || 'Failed to import'}`);
        }
      }

      console.log(`📊 Employee Import: Successfully imported ${importedCount} employees`);
      
      if (errors.length > 0) {
        console.log(`📊 Employee Import: ${errors.length} errors occurred`);
      }

      res.json({
        message: `Successfully imported ${importedCount} employees`,
        imported: importedCount,
        errors: errors
      });
    } catch (error) {
      console.error("Error importing employees:", error);
      res.status(500).json({ message: "Failed to import employees" });
    }
  });

  // Employee Excel export route - MUST come before :id route
  app.get("/api/employees/export", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      console.log(`📊 Employee Excel Export: Found ${employees.length} employees`);
      
      // Transform employee data for Excel export
      const exportData = employees.map((emp, index) => ({
        'Row': index + 1,
        'Name': emp.name,
        'Role': emp.role || '',
        'Email': emp.email || '',
        'Phone': emp.phone || '',
        'Employment Status': emp.employmentStatus || 'active',
        'Years Experience': '',
        'Equipment Operated': '',
        'Current Project': emp.currentProjectId || 'Unassigned',
        'Created Date': emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '',
        'Updated Date': emp.updatedAt ? new Date(emp.updatedAt).toLocaleDateString() : ''
      }));

      console.log(`📊 Employee Excel Export: Transformed ${exportData.length} records`);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Create the worksheet data manually as a 2D array to ensure proper structure
      const worksheetData = [
        ['EMPLOYEE DIRECTORY - TOTAL RECORDS: ' + employees.length], // Row 1
        ['Generated on: ' + new Date().toLocaleDateString()], // Row 2
        [], // Row 3 (empty)
        // Row 4 - Headers
        Object.keys(exportData[0])
      ];
      
      // Add all data rows
      exportData.forEach(row => {
        worksheetData.push(Object.values(row).map(v => v?.toString() || ''));
      });
      
      // Create worksheet from the 2D array
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = [
        { wch: 5 },  // Row
        { wch: 25 }, // Name
        { wch: 20 }, // Role
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 15 }, // Employment Status
        { wch: 10 }, // Years Experience
        { wch: 30 }, // Equipment Operated
        { wch: 20 }, // Current Project
        { wch: 12 }, // Created Date
        { wch: 12 }, // Updated Date
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

      // Generate Excel file buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set headers for file download
      const timestamp = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Disposition', `attachment; filename="employees-export-${timestamp}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      console.log(`📊 Employee Excel Export: Successfully generated file with ${employees.length} employees`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting employees:", error);
      res.status(500).json({ message: "Failed to export employees" });
    }
  });

  // Employee PDF export route - MUST come before :id route
  app.get("/api/employees/export-pdf", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      
      const doc = new PDFDocument({ margin: 50 });
      const timestamp = new Date().toISOString().split('T')[0];
      
      res.setHeader('Content-Disposition', `attachment; filename="employees-export-${timestamp}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      
      doc.pipe(res);
      
      // Title
      doc.fontSize(18).font('Helvetica-Bold').text('Employee Directory', 50, 50);
      doc.fontSize(10).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, 50, 75);
      
      let yPosition = 110;
      
      // Add total count to header
      doc.fontSize(10).font('Helvetica').text(`Total Employees: ${employees.length}`, 50, 90);
      
      employees.forEach((emp, index) => {
        // Calculate space needed for this employee (name + up to 4 details + spacing)
        const spaceNeeded = 20 + (emp.role ? 15 : 0) + (emp.email ? 15 : 0) + (emp.phone ? 15 : 0) + (emp.employmentStatus ? 15 : 0) + 10;
        
        // Check if we need a new page (leaving 50px margin at bottom)
        if (yPosition + spaceNeeded > 742) {
          doc.addPage();
          yPosition = 50;
          // Add page header with total count
          doc.fontSize(10).font('Helvetica').text(`Total Employees: ${employees.length}`, 50, 30);
          yPosition = 60;
        }
        
        doc.fontSize(12).font('Helvetica-Bold').text(`${index + 1}. ${emp.name}`, 50, yPosition);
        yPosition += 20;
        
        if (emp.role) {
          doc.fontSize(10).font('Helvetica').text(`Role: ${emp.role}`, 70, yPosition);
          yPosition += 15;
        }
        
        if (emp.email) {
          doc.text(`Email: ${emp.email}`, 70, yPosition);
          yPosition += 15;
        }
        
        if (emp.phone) {
          doc.text(`Phone: ${emp.phone}`, 70, yPosition);
          yPosition += 15;
        }
        
        if (emp.employmentStatus) {
          doc.text(`Employment Status: ${emp.employmentStatus}`, 70, yPosition);
          yPosition += 15;
        }
        
        if (emp.currentProjectId) {
          doc.text(`Current Project: ${emp.currentProjectId}`, 70, yPosition);
          yPosition += 15;
        }
        
        yPosition += 10;
      });
      
      // Add footer with total count
      doc.fontSize(8).font('Helvetica').text(`Generated ${employees.length} employee records`, 50, doc.page.height - 30);
      
      doc.end();
    } catch (error) {
      console.error("Error exporting employees PDF:", error);
      res.status(500).json({ message: "Failed to export employees PDF" });
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



  // Employee assignment route with conditional logging - MUST be defined before general PATCH route  
  app.patch("/api/employees/:id/assignment", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const { projectId } = req.body || {};
      
      console.log("=== ASSIGNMENT ROUTE DEBUG ===");
      console.log("Employee ID:", id);
      console.log("Project ID:", projectId);
      console.log("Request body:", req.body);
      
      // Employees should not be assigned to special equipment locations
      const isSpecialLocation = projectId === "warehouse" || projectId === "repair-shop";
      if (isSpecialLocation) {
        return res.status(400).json({ 
          error: "Employees cannot be assigned to equipment locations (warehouse/repair-shop)" 
        });
      }
      
      // Get current employee state for logging
      const currentEmployee = await storage.getEmployee(id);
      const previousProjectId = currentEmployee?.currentProjectId;
      
      // Update employee assignment directly via storage
      const updatedEmployee = await storage.updateEmployeeAssignment(id, { projectId });
      
      // Get user information for logging
      const currentUser = await storage.getUser(req.user!.id);
      
      // Status-based conditional logging
      await logProjectActivity({
        employeeId: id,
        employeeName: updatedEmployee.name,
        previousProjectId,
        newProjectId: projectId,
        entityType: "employee",
        performedBy: currentUser?.username || "Unknown User",
        performedByEmail: currentUser?.username
      });
      
      console.log("Assignment complete:", updatedEmployee);
      console.log("=================================");
      
      res.json(updatedEmployee);
    } catch (error:any) {
      console.error("Assignment error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Employee profile update route - MUST come after assignment route
  app.patch("/api/employees/:id", async (req, res) => {
    try {
      console.log(`❌❌❌ GENERAL EMPLOYEE ENDPOINT HIT: /api/employees/${req.params.id}`);
      console.log(`❌❌❌ REQUEST URL: ${req.url} | ORIGINAL URL: ${req.originalUrl} | PATH: ${req.path}`);
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

  // Equipment Excel export route - MUST come before :id route
  app.get("/api/equipment/export", async (req, res) => {
    try {
      const equipment = (await db.get(EQUIPMENT_KEY)) || [];
      console.log(`🚜 Equipment Excel Export: Found ${equipment.length} equipment items`);
      
      // Transform equipment data for Excel export
      const exportData = equipment.map((eq, index) => ({
        'Row': index + 1,
        'Name': eq.name,
        'Type': eq.type || '',
        'Make': eq.make || '',
        'Model': eq.model || '',
        'Asset Number': eq.assetNumber || '',
        'Serial Number': eq.serialNumber || '',
        'Status': eq.status || 'active',
        'Current Project': eq.currentProjectId || 'Unassigned',
        'Created Date': eq.createdAt ? new Date(eq.createdAt).toLocaleDateString() : '',
        'Updated Date': eq.updatedAt ? new Date(eq.updatedAt).toLocaleDateString() : ''
      }));

      console.log(`🚜 Equipment Excel Export: Transformed ${exportData.length} records`);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Create the worksheet data manually as a 2D array to ensure proper structure
      const worksheetData = [
        ['EQUIPMENT DIRECTORY - TOTAL RECORDS: ' + equipment.length], // Row 1
        ['Generated on: ' + new Date().toLocaleDateString()], // Row 2
        [], // Row 3 (empty)
        // Row 4 - Headers
        Object.keys(exportData[0])
      ];
      
      // Add all data rows
      exportData.forEach(row => {
        worksheetData.push(Object.values(row).map(v => v?.toString() || ''));
      });
      
      // Create worksheet from the 2D array
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = [
        { wch: 5 },  // Row
        { wch: 25 }, // Name
        { wch: 15 }, // Type
        { wch: 15 }, // Make
        { wch: 15 }, // Model
        { wch: 15 }, // Asset Number
        { wch: 15 }, // Serial Number
        { wch: 12 }, // Status
        { wch: 20 }, // Current Project
        { wch: 12 }, // Created Date
        { wch: 12 }, // Updated Date
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment');

      // Generate Excel file buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set headers for file download
      const timestamp = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Disposition', `attachment; filename="equipment-export-${timestamp}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      console.log(`🚜 Equipment Excel Export: Successfully generated file with ${equipment.length} equipment items`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting equipment:", error);
      res.status(500).json({ message: "Failed to export equipment" });
    }
  });

  // Equipment PDF export route - MUST come before :id route
  app.get("/api/equipment/export-pdf", async (req, res) => {
    try {
      const equipment = (await db.get(EQUIPMENT_KEY)) || [];
      
      const doc = new PDFDocument({ margin: 50 });
      const timestamp = new Date().toISOString().split('T')[0];
      
      res.setHeader('Content-Disposition', `attachment; filename="equipment-export-${timestamp}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      
      doc.pipe(res);
      
      // Title
      doc.fontSize(18).font('Helvetica-Bold').text('Equipment Directory', 50, 50);
      doc.fontSize(10).font('Helvetica').text(`Generated on ${new Date().toLocaleDateString()}`, 50, 75);
      
      let yPosition = 110;
      
      equipment.forEach((eq, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
        
        doc.fontSize(12).font('Helvetica-Bold').text(`${index + 1}. ${eq.name}`, 50, yPosition);
        yPosition += 20;
        
        if (eq.type) {
          doc.fontSize(10).font('Helvetica').text(`Type: ${eq.type}`, 70, yPosition);
          yPosition += 15;
        }
        
        if (eq.make) {
          doc.text(`Make: ${eq.make}`, 70, yPosition);
          yPosition += 15;
        }
        
        if (eq.model) {
          doc.text(`Model: ${eq.model}`, 70, yPosition);
          yPosition += 15;
        }
        
        if (eq.assetNumber) {
          doc.text(`Asset Number: ${eq.assetNumber}`, 70, yPosition);
          yPosition += 15;
        }
        
        if (eq.serialNumber) {
          doc.text(`Serial Number: ${eq.serialNumber}`, 70, yPosition);
          yPosition += 15;
        }
        
        if (eq.status) {
          doc.text(`Status: ${eq.status}`, 70, yPosition);
          yPosition += 15;
        }
        
        yPosition += 10;
      });
      
      doc.end();
    } catch (error) {
      console.error("Error exporting equipment PDF:", error);
      res.status(500).json({ message: "Failed to export equipment PDF" });
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

  // Equipment assignment route - MUST come before general PATCH route
  app.patch("/api/equipment/:id/assignment", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const { projectId } = req.body || {};
      
      console.log("=== EQUIPMENT ASSIGNMENT ROUTE DEBUG ===");
      console.log("Equipment ID:", id);
      console.log("Project ID:", projectId);
      console.log("Request body:", req.body);
      
      // Handle repair shop location - treat as unassigned but set status to maintenance
      if (projectId === "repair-shop") {
        console.log(`🔧 REPAIR SHOP: Starting assignment for equipment ${id}`);
        
        // Get current equipment state
        const beforeEquipment = await storage.getEquipmentItem(id);
        console.log(`🔧 BEFORE: Equipment status:`, {
          id: beforeEquipment?.id,
          name: beforeEquipment?.name,
          projectId: beforeEquipment?.currentProjectId,
          status: beforeEquipment?.status
        });
        
        // Set to null to keep equipment unassigned, but mark as maintenance status
        const validatedData = updateEquipmentAssignmentSchema.parse({ projectId: null });
        const updated = await storage.updateEquipmentAssignment(id, validatedData);
        
        console.log(`🔧 AFTER updateEquipmentAssignment:`, {
          id: updated.id,
          name: updated.name,
          projectId: updated.currentProjectId,
          status: updated.status
        });
        
        // Also update the equipment status to maintenance
        const maintenanceUpdate = await storage.updateEquipment(id, { status: "maintenance" });
        console.log(`🔧 AFTER updateEquipment (maintenance):`, {
          id: maintenanceUpdate.id,
          name: maintenanceUpdate.name,
          projectId: maintenanceUpdate.currentProjectId,
          status: maintenanceUpdate.status
        });
        
        // Return the equipment with updated status
        const finalEquipment = await storage.getEquipmentItem(id);
        console.log(`🔧 FINAL: Equipment marked for repair shop:`, {
          id: finalEquipment?.id,
          name: finalEquipment?.name,
          projectId: finalEquipment?.currentProjectId,
          status: finalEquipment?.status
        });
        return res.json(finalEquipment);
      }
      
      // Get current equipment state for logging
      const currentEquipment = await storage.getEquipmentItem(id);
      const previousProjectId = currentEquipment?.currentProjectId;
      
      // Use normal storage method
      const validatedData = updateEquipmentAssignmentSchema.parse(req.body);
      const updatedEquipment = await storage.updateEquipmentAssignment(id, validatedData);
      
      // Get user information for logging
      const currentUser = await storage.getUser(req.user!.id);
      
      // Status-based conditional logging
      if (projectId !== "repair-shop") {
        await logProjectActivity({
          equipmentId: id,
          equipmentName: updatedEquipment.name,
          previousProjectId,
          newProjectId: projectId,
          entityType: "equipment",
          performedBy: currentUser?.username || "Unknown User",
          performedByEmail: currentUser?.username
        });
      } else {
        console.log(`🔧 Equipment ${updatedEquipment.name} moved to Repair Shop`);
      }
      
      console.log("Equipment assignment complete:", updatedEquipment);
      console.log("=======================================");
      
      res.json(updatedEquipment);
    } catch (error:any) {
      console.error("Equipment assignment error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Equipment profile update route - MUST come after assignment route
  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      console.log(`General equipment endpoint hit: /api/equipment/${req.params.id}`);
      const updateData = updateEquipmentSchema.parse(req.body);
      const equipment = await storage.updateEquipment(req.params.id, updateData);
      res.json(equipment);
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(400).json({ message: "Failed to update equipment" });
    }
  });

  // Equipment Excel Import/Export routes
  app.post("/api/equipment/import", authenticateToken, upload.single('excel'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let imported = 0;
      let errors = 0;
      const importResults = [];

      for (const row of jsonData as any[]) {
        try {
          // Map Excel columns to equipment fields
          const equipmentData = {
            name: row.Name || row.name || '',
            type: row.Type || row.type || 'Equipment',
            make: row.Make || row.make || null,
            model: row.Model || row.model || null,
            assetNumber: row['Asset Number'] || row.assetNumber || row.asset_number || null,
            serialNumber: row['Serial Number'] || row.serialNumber || row.serial_number || null,
            status: row.Status || row.status || 'available',
          };

          if (!equipmentData.name.trim()) {
            importResults.push({ row: imported + errors + 1, error: 'Name is required' });
            errors++;
            continue;
          }

          await storage.createEquipment(equipmentData);
          importResults.push({ row: imported + errors + 1, success: true });
          imported++;
        } catch (error) {
          importResults.push({ row: imported + errors + 1, error: error instanceof Error ? error.message : 'Unknown error' });
          errors++;
        }
      }

      res.json({
        message: `Import completed: ${imported} successful, ${errors} errors`,
        imported,
        errors,
        results: importResults
      });
    } catch (error) {
      console.error("Error importing equipment:", error);
      res.status(500).json({ message: "Failed to import equipment" });
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
        employeeGrowth: "+5.2%",
        totalEquipment: equipment.length,
        equipmentIssues: equipment.filter(eq => eq.status === 'maintenance' || eq.status === 'broken').length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        projectsOnTrack: "92% on track",
        utilizationRate: Math.round((employees.filter(emp => emp.currentProjectId).length / employees.length) * 100),
        utilizationTrend: "+2.1%",
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

  // Natural language command processing endpoint
  app.post("/api/nl", async (req, res) => {
    const { text } = req.body as { text: string };
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback to simple parser when no API key is provided
      try {
        const actions = parseSimpleCommands(text);
        return res.json({ actions });
      } catch (error) {
        return res.json({ actions: [] });
      }
    }

    try {
      // OpenAI integration when API key is available
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey });

      const completion = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: `You convert short scheduling commands into JSON actions.
Schema:
{
  "actions":[
    {"type":"move_employee","employee_query":"string","project":"string"},
    {"type":"assign_equipment","equipment_query":"string","project":"string"},
    {"type":"list_unassigned","date?":"YYYY-MM-DD"}
  ]
}
Rules:
- Output ONLY JSON. No extra text.
- If unsure, guess sensibly.` },
          { role: "user", content: text ?? "" }
        ],
        temperature: 0
      });

      const out = completion.choices[0]?.message?.content?.trim() || "{}";
      try {
        const json = JSON.parse(out);
        return res.json(json);
      } catch {
        // Fallback to simple parser if OpenAI response is invalid
        const actions = parseSimpleCommands(text);
        return res.json({ actions });
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      // Fallback to simple parser on OpenAI error
      try {
        const actions = parseSimpleCommands(text);
        return res.json({ actions });
      } catch {
        return res.json({ actions: [] });
      }
    }
  });

  // Project activity logs API
  app.get("/api/project-activity-logs", async (req, res) => {
    try {
      const { projectId, startDate, endDate } = req.query;
      
      console.log(`📊 Project Activity Logs API called:`, {
        projectId: projectId as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      
      const logs = await storage.getProjectActivityLogs(
        projectId as string,
        startDate as string, 
        endDate as string
      );
      
      console.log(`📊 Returning ${logs.length} activity logs`);
      res.json(logs);
    } catch (error) {
      console.error("Project activity logs error:", error);
      res.status(500).json({ error: "Failed to get project activity logs" });
    }
  });

  // ============================================================================
  // SUPERVISOR PORTAL ROUTES
  // ============================================================================
  
  // Supervisor overview - projects and timeliness items
  app.get("/api/supervisor/overview", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      const projectsFormatted = projects.map(p => ({
        id: p.id,
        name: p.name,
        startBlocked: p.startBlocked ?? true
      }));

      // For now, return empty items until we implement full database integration
      const items: any[] = [];

      res.json({ projects: projectsFormatted, items });
    } catch (error) {
      console.error("Error fetching supervisor overview:", error);
      res.status(500).json({ message: "Failed to fetch supervisor overview" });
    }
  });

  // Acknowledge/mark done timeliness item
  app.post("/api/supervisor/ack/:itemId", async (req, res) => {
    try {
      // For now, just return success
      res.json({ ok: true });
    } catch (error) {
      console.error("Error acknowledging item:", error);
      res.status(500).json({ message: "Failed to acknowledge item" });
    }
  });

  // Submit pre-start checklist
  app.post("/api/supervisor/projects/:projectId/checklist", async (req, res) => {
    try {
      const { payload, note } = req.body;
      
      // For now, just return success - full implementation would save to checklists table
      console.log("Checklist submitted for project:", req.params.projectId, { payload, note });
      
      res.json({ ok: true });
    } catch (error) {
      console.error("Error submitting checklist:", error);
      res.status(500).json({ message: "Failed to submit checklist" });
    }
  });

  // Create update requirement
  app.post("/api/supervisor/projects/:projectId/require-update", async (req, res) => {
    try {
      const { title, description, dueAt } = req.body;
      
      // For now, just return success - full implementation would save to timeliness_items table
      console.log("Update requirement created for project:", req.params.projectId, { title, description, dueAt });
      
      res.json({ ok: true });
    } catch (error) {
      console.error("Error creating update requirement:", error);
      res.status(500).json({ message: "Failed to create update requirement" });
    }
  });

  // Supervisor Portal & Timeliness
  app.use("/api/supervisor", supervisorRouter);
  
  // Apply mock auth for development
  app.use(mockAuth());

  // Mount routes conditionally based on feature flags
  if (features.SLA) {
    app.use("/api/sla", slaRouter);
  }
  app.use("/api/dev", devRouter);
  
  if (features.MANAGER) {
    app.use("/api/manager", managerRouter);
    app.use("/api/manager", managerFriendlyRouter);
  }
  
  // Organization admin routes (always available for tenant controls)
  app.use("/api/org-admin", orgAdminRouter);
  
  // Owner admin routes (platform-level controls)
  app.use("/api/owner-admin", ownerAdminRouter);

  // MVP Optional Addon Routes
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/branding", brandingRouter);
  app.use("/api/billing", billingRouter);
  app.use("/api/billing", billingPortalRouter);

  // Work Orders API Routes
  app.get("/api/work-orders", authenticateToken, async (req, res) => {
    try {
      const equipmentId = req.query.equipmentId as string | undefined;
      const workOrders = await storage.getWorkOrders(equipmentId);
      res.json(workOrders);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      res.status(500).json({ message: "Failed to fetch work orders" });
    }
  });

  app.get("/api/work-orders/:id", authenticateToken, async (req, res) => {
    try {
      const workOrder = await storage.getWorkOrder(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      console.error("Error fetching work order:", error);
      res.status(500).json({ message: "Failed to fetch work order" });
    }
  });

  app.post("/api/work-orders", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.parse(req.body);
      
      // Check if approval is required based on cost thresholds
      const totalCost = (validatedData.estimatedCost || 0) + 
                       (validatedData.laborCost || 0) + 
                       (validatedData.partsCost || 0) + 
                       (validatedData.externalServiceCost || 0);
      
      const approvalRequired = totalCost > 100000; // $1000 in cents
      
      const workOrderData = {
        ...validatedData,
        approvalRequired,
        status: approvalRequired ? "pending-approval" : "open",
        // Skip createdBy for now to avoid foreign key constraint issues
      };

      const workOrder = await storage.createWorkOrder(workOrderData);
      
      // If approval required, create approval requests
      if (approvalRequired) {
        const thresholds = await storage.getCostApprovalThresholds();
        for (const threshold of thresholds) {
          if (totalCost > threshold.maxAmount) {
            await storage.createWorkOrderApproval({
              workOrderId: workOrder.id,
              approverRole: threshold.role,
              thresholdAmount: threshold.maxAmount,
              requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            });
          }
        }
      }
      
      res.status(201).json(workOrder);
    } catch (error) {
      console.error("Error creating work order:", error);
      res.status(400).json({ message: "Failed to create work order" });
    }
  });

  app.patch("/api/work-orders/:id", authenticateToken, async (req, res) => {
    try {
      const updates = updateWorkOrderSchema.parse(req.body);
      const workOrder = await storage.updateWorkOrder(req.params.id, updates);
      res.json(workOrder);
    } catch (error) {
      console.error("Error updating work order:", error);
      res.status(400).json({ message: "Failed to update work order" });
    }
  });

  // Update work order comments
  app.patch("/api/work-orders/:id/comments", authenticateToken, async (req, res) => {
    try {
      const { comments } = req.body;
      if (typeof comments !== 'string') {
        return res.status(400).json({ message: "Comments must be a string" });
      }
      const workOrder = await storage.updateWorkOrder(req.params.id, { comments });
      res.json(workOrder);
    } catch (error) {
      console.error("Error updating work order comments:", error);
      res.status(400).json({ message: "Failed to update work order comments" });
    }
  });

  // Work Order Comments - for progressive messaging system
  app.get("/api/work-orders/:workOrderId/comments", async (req, res) => {
    console.log("🚀 GET comments route hit! WorkOrderId:", req.params.workOrderId);
    try {
      const comments = await storage.getWorkOrderComments(req.params.workOrderId);
      console.log("🚀 Successfully fetched comments:", comments.length);
      res.json(comments);
    } catch (error: any) {
      console.error("❌ Error fetching work order comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/work-orders/:workOrderId/comments", async (req, res) => {
    console.log("🚀 POST comment route hit! WorkOrderId:", req.params.workOrderId);
    console.log("🚀 Request body:", req.body);
    
    try {
      const commentData = {
        workOrderId: req.params.workOrderId,
        comment: req.body.comment,
        createdBy: "test-user-001",
        createdAt: new Date()
      };
      
      console.log("🚀 Creating comment with data:", commentData);
      
      const newComment = await storage.createWorkOrderComment(commentData);
      console.log("🚀 Successfully created comment:", newComment);
      
      res.json(newComment);
    } catch (error: any) {
      console.error("❌ Error creating work order comment:", error);
      console.error("❌ Error stack:", error?.stack);
      res.status(500).json({ error: "Failed to create comment", details: error?.message });
    }
  });

  app.delete("/api/work-orders/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteWorkOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting work order:", error);
      res.status(500).json({ message: "Failed to delete work order" });
    }
  });

  // Work Order Documents
  app.get("/api/work-orders/:workOrderId/documents", async (req, res) => {
    try {
      const documents = await storage.getWorkOrderDocuments(req.params.workOrderId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching work order documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/work-order-documents/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getWorkOrderDocumentUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post("/api/work-order-documents", async (req, res) => {
    try {
      const validatedData = req.body;
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeWorkOrderDocumentPath(validatedData.objectPath);
      
      const documentData = {
        ...validatedData,
        objectPath: normalizedPath,
        uploadedBy: "test-user-001", // TODO: Get from auth
      };

      const document = await storage.createWorkOrderDocument(documentData);
      res.json(document);
    } catch (error) {
      console.error("Error creating work order document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.get("/work-order-documents/:documentPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const documentPath = `/${req.params.documentPath}`;
      const documentFile = await objectStorageService.getWorkOrderDocumentFile(documentPath);
      objectStorageService.downloadObject(documentFile, res);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  // Work Order Activities
  app.get("/api/work-orders/:workOrderId/activities", async (req, res) => {
    try {
      const activities = await storage.getWorkOrderActivities(req.params.workOrderId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching work order activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // StaffTrak: Branding & White Label controls
  app.use("/api/owner-admin", ownerBrandingAdminRouter);                 // owner toggles
  app.use("/api/org-admin/entitlements", orgEntitlementsRouter);        // org feature status
  app.use("/api/white-label", whiteLabelRouter);                         // org white-label settings

  // Import and register notification routes synchronously
  const { registerNotificationRoutes } = await import("./routes/notification-routes");
  registerNotificationRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
