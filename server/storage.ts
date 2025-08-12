import { 
  projects, employees, equipment, activities, alerts, users, projectContacts,
  type Project, type InsertProject, type UpdateProject,
  type Employee, type InsertEmployee, type UpdateEmployee,
  type Equipment, type InsertEquipment, type UpdateEquipment,
  type Activity, type InsertActivity,
  type Alert, type InsertAlert,
  type User, type InsertUser,
  type ProjectContact, type InsertProjectContact,
  type UpdateEmployeeAssignment,
  type UpdateEquipmentAssignment
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBrandConfig(id: string, brandConfig: any): Promise<User>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: UpdateProject): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updates: UpdateEmployee): Promise<Employee>;
  updateEmployeeAssignment(id: string, assignment: UpdateEmployeeAssignment): Promise<Employee>;
  
  // Equipment
  getEquipment(): Promise<Equipment[]>;
  getEquipmentItem(id: string): Promise<Equipment | undefined>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: string, updates: UpdateEquipment): Promise<Equipment>;
  updateEquipmentAssignment(id: string, assignment: UpdateEquipmentAssignment): Promise<Equipment>;
  
  // Activities
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Alerts
  getActiveAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  dismissAlert(id: string): Promise<void>;
  
  // Project Contacts
  getProjectContacts(projectId: string): Promise<ProjectContact[]>;
  createProjectContact(contact: InsertProjectContact): Promise<ProjectContact>;
  updateProjectContact(id: string, updates: Partial<ProjectContact>): Promise<ProjectContact>;
  deleteProjectContact(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private employees: Map<string, Employee>;
  private equipment: Map<string, Equipment>;
  private activities: Activity[];
  private alerts: Map<string, Alert>;
  private projectContacts: Map<string, ProjectContact>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.employees = new Map();
    this.equipment = new Map();
    this.activities = [];
    this.alerts = new Map();
    this.projectContacts = new Map();
    
    // Load data from shared database instead of hardcoded data
    this.loadFromSharedDatabase().catch(console.error);
    this.initializeTestUser().catch(console.error);
  }

  private async loadFromSharedDatabase() {
    const { db, EMPLOYEES_KEY, EQUIPMENT_KEY, PROJECTS_KEY } = await import('./sharedDb');
    
    // Load projects from shared database
    const projects = (await db.get(PROJECTS_KEY)) || [];
    for (const project of projects) {
      this.projects.set(project.id, project);
    }
    
    // Load employees from shared database
    const employees = (await db.get(EMPLOYEES_KEY)) || [];
    for (const employee of employees) {
      this.employees.set(employee.id, employee);
    }
    
    // Load equipment from shared database
    const equipment = (await db.get(EQUIPMENT_KEY)) || [];
    for (const equipmentItem of equipment) {
      this.equipment.set(equipmentItem.id, equipmentItem);
    }
    
    console.log(`✓ Loaded ${projects.length} projects, ${employees.length} employees, ${equipment.length} equipment from shared database`);
  }

  private initializeSampleDataDeprecated() {
    // Create sample projects
    const project1: Project = {
      id: "proj-001",
      projectNumber: "PRJ-2025-001",
      name: "Downtown Mall Renovation",
      location: "Seattle, WA",
      gpsLatitude: "47.6062",
      gpsLongitude: "-122.3321",
      kmzFileUrl: null,
      description: "Large-scale renovation of downtown shopping center with modern infrastructure updates",
      status: "active",
      progress: 65,
      startDate: new Date('2024-11-01'),
      endDate: new Date('2025-03-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const project2: Project = {
      id: "proj-002", 
      projectNumber: "PRJ-2025-002",
      name: "Residential Complex Demo",
      location: "Portland, OR",
      gpsLatitude: "45.5152",
      gpsLongitude: "-122.6784",
      kmzFileUrl: null,
      description: "Controlled demolition of old residential complex for new development",
      status: "planning",
      progress: 15,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-05-30'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.projects.set(project1.id, project1);
    this.projects.set(project2.id, project2);
    
    // Constant storage projects for equipment management
    const warehouse: Project = {
      id: "warehouse",
      projectNumber: "STORE-WH-001",
      name: "Demo Warehouse",
      location: "Main Storage Facility",
      gpsLatitude: null,
      gpsLongitude: null,
      kmzFileUrl: null,
      description: "Equipment storage facility - awaiting project assignment",
      status: "active",
      progress: 100,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2030-12-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const maintenance: Project = {
      id: "maintenance",
      projectNumber: "STORE-MAINT-001",
      name: "Maintenance Shop",
      location: "Service Center",
      gpsLatitude: null,
      gpsLongitude: null,
      kmzFileUrl: null,
      description: "Equipment maintenance, repairs, and retired assets storage",
      status: "active",
      progress: 100,
      startDate: new Date('2020-01-01'),
      endDate: new Date('2030-12-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.projects.set(warehouse.id, warehouse);
    this.projects.set(maintenance.id, maintenance);
    
    // Add 15 diverse mock projects for comprehensive testing
    const mockProjects: Project[] = [
      {
        id: "proj-100",
        projectNumber: "PRJ-2025-100",
        name: "Highway Bridge Construction",
        location: "I-5 Corridor, WA",
        gpsLatitude: "47.2529",
        gpsLongitude: "-122.4443",
        kmzFileUrl: null,
        description: "New concrete bridge construction over highway interchange",
        status: "active",
        progress: 45,
        startDate: new Date('2024-12-15'),
        endDate: new Date('2025-08-30'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-101",
        projectNumber: "PRJ-2025-101",
        name: "Industrial Warehouse Demo",
        location: "Kent Industrial District",
        gpsLatitude: "47.3809",
        gpsLongitude: "-122.2348",
        kmzFileUrl: null,
        description: "Demolition of obsolete industrial warehouse complex",
        status: "planning",
        progress: 25,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-06-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-102",
        projectNumber: "PRJ-2025-102",
        name: "School Building Renovation",
        location: "Bellevue School District",
        gpsLatitude: "47.6101",
        gpsLongitude: "-122.2015",
        kmzFileUrl: null,
        description: "Complete renovation of elementary school facilities",
        status: "active",
        progress: 75,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-04-30'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-103",
        projectNumber: "PRJ-2025-103",
        name: "Office Tower Construction",
        location: "Belltown, Seattle",
        gpsLatitude: "47.6131",
        gpsLongitude: "-122.3414",
        kmzFileUrl: null,
        description: "25-story mixed-use office and retail tower",
        status: "active",
        progress: 35,
        startDate: new Date('2024-10-01'),
        endDate: new Date('2026-02-28'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-104",
        projectNumber: "PRJ-2025-104",
        name: "Parking Garage Demo",
        location: "Capitol Hill, Seattle",
        gpsLatitude: "47.6205",
        gpsLongitude: "-122.3212",
        kmzFileUrl: null,
        description: "Controlled demolition of 6-level parking structure",
        status: "planning",
        progress: 10,
        startDate: new Date('2025-04-15'),
        endDate: new Date('2025-07-30'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-105",
        projectNumber: "PRJ-2025-105",
        name: "Subway Station Upgrade",
        location: "University District",
        gpsLatitude: "47.6587",
        gpsLongitude: "-122.3138",
        kmzFileUrl: null,
        description: "Platform extension and accessibility improvements",
        status: "active",
        progress: 60,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-106",
        projectNumber: "PRJ-2025-106",
        name: "Hospital Wing Addition",
        location: "First Hill Medical Center",
        gpsLatitude: "47.6098",
        gpsLongitude: "-122.3240",
        kmzFileUrl: null,
        description: "New emergency department and surgical wing construction",
        status: "active",
        progress: 55,
        startDate: new Date('2024-11-15'),
        endDate: new Date('2026-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-107",
        projectNumber: "PRJ-2025-107",
        name: "Waterfront Pier Restoration",
        location: "Elliott Bay Waterfront",
        gpsLatitude: "47.6040",
        gpsLongitude: "-122.3470",
        kmzFileUrl: null,
        description: "Historic pier restoration and seismic retrofitting",
        status: "planning",
        progress: 20,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-11-30'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-108",
        projectNumber: "PRJ-2025-108",
        name: "Stadium Renovation",
        location: "SoDo Sports Complex",
        gpsLatitude: "47.5914",
        gpsLongitude: "-122.3284",
        kmzFileUrl: null,
        description: "Major renovation of sports stadium infrastructure",
        status: "active",
        progress: 40,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-09-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-109",
        projectNumber: "PRJ-2025-109",
        name: "Shopping Center Demo",
        location: "Northgate District",
        gpsLatitude: "47.7031",
        gpsLongitude: "-122.3255",
        kmzFileUrl: null,
        description: "Complete demolition of outdated shopping center",
        status: "planning",
        progress: 15,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-10-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-110",
        projectNumber: "PRJ-2025-110",
        name: "Apartment Complex Construction",
        location: "South Lake Union",
        gpsLatitude: "47.6205",
        gpsLongitude: "-122.3370",
        kmzFileUrl: null,
        description: "300-unit luxury apartment complex with amenities",
        status: "active",
        progress: 30,
        startDate: new Date('2024-09-15'),
        endDate: new Date('2026-03-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-111",
        projectNumber: "PRJ-2025-111",
        name: "Factory Demolition",
        location: "Georgetown Industrial",
        gpsLatitude: "47.5441",
        gpsLongitude: "-122.3238",
        kmzFileUrl: null,
        description: "Environmental remediation and factory demolition",
        status: "planning",
        progress: 5,
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-12-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-112",
        projectNumber: "PRJ-2025-112",
        name: "Community Center Renovation",
        location: "Fremont Neighborhood",
        gpsLatitude: "47.6510",
        gpsLongitude: "-122.3501",
        kmzFileUrl: null,
        description: "Complete renovation of community recreation center",
        status: "active",
        progress: 80,
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-03-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-113",
        projectNumber: "PRJ-2025-113",
        name: "Library Construction",
        location: "West Seattle",
        gpsLatitude: "47.5683",
        gpsLongitude: "-122.3828",
        kmzFileUrl: null,
        description: "New public library with modern technology center",
        status: "active",
        progress: 50,
        startDate: new Date('2024-10-15'),
        endDate: new Date('2025-08-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "proj-114",
        projectNumber: "PRJ-2025-114",
        name: "Marina Expansion",
        location: "Shilshole Bay",
        gpsLatitude: "47.6844",
        gpsLongitude: "-122.4036",
        kmzFileUrl: null,
        description: "Expansion of marina facilities and dock infrastructure",
        status: "planning",
        progress: 30,
        startDate: new Date('2025-08-01'),
        endDate: new Date('2026-05-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    
    // Add all mock projects to storage
    mockProjects.forEach(project => {
      this.projects.set(project.id, project);
    });
    
    // Create sample employees
    const employees = [
      { id: "emp-001", name: "John Smith", role: "Heavy Equipment Operator", status: "available", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50" },
      { id: "emp-002", name: "Sarah Williams", role: "Site Supervisor", status: "available", avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50" },
      { id: "emp-003", name: "Mike Johnson", role: "Site Manager", status: "busy", currentProjectId: "proj-001", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50" },
      { id: "emp-004", name: "Lisa Kim", role: "Safety Inspector", status: "busy", currentProjectId: "proj-001", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50" },
      { id: "emp-005", name: "Tom Rodriguez", role: "Demolition Specialist", status: "busy", currentProjectId: "proj-002", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=50&h=50" },
    ];
    
    employees.forEach(emp => {
      const employee: Employee = {
        ...emp,
        email: null,
        phone: null,
        employmentStatus: "active",
        currentProjectId: emp.currentProjectId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.employees.set(employee.id, employee);
    });
    
    // Create sample equipment
    const equipmentList = [
      { id: "eq-001", name: "Excavator CAT-320", type: "Heavy Machinery", make: "Caterpillar", model: "320", assetNumber: "AST-001", serialNumber: "EXC-001", status: "available" },
      { id: "eq-002", name: "Pneumatic Drill Set", type: "Power Tools", make: "Bosch", model: "PD-500", assetNumber: "AST-002", serialNumber: "PDS-005", status: "maintenance" },
      { id: "eq-003", name: "Bulldozer BD-450", type: "Heavy Machinery", make: "Caterpillar", model: "D6T", assetNumber: "AST-003", serialNumber: "BD-450", status: "in-use", currentProjectId: "proj-001" },
      { id: "eq-004", name: "Demo Hammer Kit", type: "Demolition", make: "Hilti", model: "TE-60", assetNumber: "AST-004", serialNumber: "DHK-100", status: "in-use", currentProjectId: "proj-002" },
    ];
    
    equipmentList.forEach(eq => {
      const equipment: Equipment = {
        ...eq,
        currentProjectId: eq.currentProjectId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.equipment.set(equipment.id, equipment);
    });
    
    // Create sample activities
    this.activities = [
      {
        id: "act-001",
        type: "assignment",
        description: "Sarah Williams was assigned to Downtown Mall Renovation",
        entityType: "employee",
        entityId: "emp-002",
        projectId: "proj-001",
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      },
      {
        id: "act-002",
        type: "maintenance",
        description: "Excavator CAT-320 maintenance completed",
        entityType: "equipment",
        entityId: "eq-001",
        projectId: null,
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      },
      {
        id: "act-003",
        type: "project_approved",
        description: "Residential Complex Demo project approved",
        entityType: "project",
        entityId: "proj-002",
        projectId: "proj-002",
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      },
    ];
    
    // Create sample alerts
    const alertsList = [
      { id: "alert-001", title: "Equipment Maintenance Due", message: "3 pieces of equipment require scheduled maintenance", type: "warning", priority: "high" },
      { id: "alert-002", title: "Asset Conflict Detected", message: "John Smith is assigned to overlapping shifts", type: "error", priority: "critical" },
      { id: "alert-003", title: "New Equipment Added", message: "Bulldozer BD-450 is now available for assignment", type: "info", priority: "medium" },
    ];
    
    alertsList.forEach(alert => {
      const alertItem: Alert = {
        ...alert,
        isRead: false,
        isDismissed: false,
        createdAt: new Date(),
      };
      this.alerts.set(alertItem.id, alertItem);
    });
  }

  private async initializeTestUser() {
    try {
      // Create test user for demo purposes
      const hashedPassword = await bcrypt.hash("demo123", 10);
      
      const testUser: User = {
        id: "test-user-001",
        username: "demo",
        password: hashedPassword,
        brandConfig: JSON.stringify({
          appName: "TrackPro Demo",
          primaryColor: "#3B82F6",
          secondaryColor: "#10B981",
          logoUrl: ""
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      this.users.set(testUser.id, testUser);
      console.log("Test user 'demo' created successfully");
    } catch (error) {
      console.error("Failed to create test user:", error);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = Array.from(this.users.values());
    return users.find(user => user.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = randomUUID();
    const newUser: User = {
      ...userData,
      id,
      brandConfig: userData.brandConfig ? JSON.stringify(userData.brandConfig) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUserBrandConfig(id: string, brandConfig: any): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser: User = {
      ...user,
      brandConfig: JSON.stringify(brandConfig),
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = randomUUID();
    const newProject: Project = {
      ...project,
      id,
      gpsLatitude: project.gpsLatitude || null,
      gpsLongitude: project.gpsLongitude || null,
      kmzFileUrl: project.kmzFileUrl || null,
      description: project.description || null,
      status: project.status || "Planned",
      progress: project.progress || 0,
      percentComplete: project.percentComplete || 0,
      percentMode: project.percentMode || "auto",
      startDate: project.startDate || new Date(),
      endDate: project.endDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, newProject);
    
    // Also persist to shared database
    const { db, PROJECTS_KEY } = await import('./sharedDb');
    const existingProjects = (await db.get(PROJECTS_KEY)) || [];
    existingProjects.push(newProject);
    await db.set(PROJECTS_KEY, existingProjects);
    
    return newProject;
  }

  async updateProject(id: string, updates: UpdateProject): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }

    const updatedProject: Project = {
      ...project,
      ...updates,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    
    // Also update in shared database
    const { db, PROJECTS_KEY } = await import('./sharedDb');
    const existingProjects = (await db.get(PROJECTS_KEY)) || [];
    const projectIndex = existingProjects.findIndex((p: Project) => p.id === id);
    if (projectIndex !== -1) {
      existingProjects[projectIndex] = updatedProject;
      await db.set(PROJECTS_KEY, existingProjects);
    }
    
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    // First, unassign all employees and equipment from this project
    for (const employee of this.employees.values()) {
      if (employee.currentProjectId === id) {
        await this.updateEmployeeAssignment(employee.id, { currentProjectId: null });
      }
    }
    
    for (const equipment of this.equipment.values()) {
      if (equipment.currentProjectId === id) {
        await this.updateEquipmentAssignment(equipment.id, { currentProjectId: null });
      }
    }

    this.projects.delete(id);
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const newEmployee: Employee = {
      ...employee,
      id,
      employmentStatus: employee.employmentStatus || "active",
      status: employee.status || "available",
      email: employee.email || null,
      phone: employee.phone || null,
      avatarUrl: employee.avatarUrl || null,
      currentProjectId: employee.currentProjectId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.employees.set(id, newEmployee);
    return newEmployee;
  }

  async updateEmployee(id: string, updates: UpdateEmployee): Promise<Employee> {
    const employee = this.employees.get(id);
    if (!employee) {
      throw new Error(`Employee with id ${id} not found`);
    }

    const updatedEmployee: Employee = {
      ...employee,
      ...updates,
      updatedAt: new Date(),
    };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async updateEmployeeAssignment(id: string, assignment: UpdateEmployeeAssignment): Promise<Employee> {
    console.log("=== STORAGE ASSIGNMENT DEBUG ===");
    console.log("Employee ID:", id);
    console.log("Assignment object:", assignment);
    console.log("Current employees count:", this.employees.size);
    
    const employee = this.employees.get(id);
    if (!employee) {
      console.log("Employee not found in storage");
      throw new Error(`Employee with id ${id} not found`);
    }
    
    console.log("Found employee:", employee.name, "current project:", employee.currentProjectId);
    
    const updatedEmployee: Employee = {
      ...employee,
      currentProjectId: assignment.currentProjectId,
      status: assignment.currentProjectId ? "busy" : "available",
      updatedAt: new Date(),
    };
    
    console.log("Updated employee data:", {
      id: updatedEmployee.id,
      name: updatedEmployee.name,
      currentProjectId: updatedEmployee.currentProjectId,
      status: updatedEmployee.status
    });
    
    this.employees.set(id, updatedEmployee);
    
    // Verify the assignment was saved
    const savedEmployee = this.employees.get(id);
    console.log("Verified saved employee currentProjectId:", savedEmployee?.currentProjectId);
    console.log("=== STORAGE ASSIGNMENT DEBUG END ===");
    
    // Create activity
    const projectName = assignment.currentProjectId 
      ? this.projects.get(assignment.currentProjectId)?.name 
      : null;
    
    const description = assignment.currentProjectId
      ? `${employee.name} was assigned to ${projectName}`
      : `${employee.name} was unassigned from project`;
    
    await this.createActivity({
      type: assignment.currentProjectId ? "assignment" : "unassignment",
      description,
      entityType: "employee",
      entityId: id,
      projectId: assignment.currentProjectId,
    });
    
    return updatedEmployee;
  }

  // Equipment
  async getEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipment.values());
  }

  async getEquipmentItem(id: string): Promise<Equipment | undefined> {
    return this.equipment.get(id);
  }

  async createEquipment(equipment: InsertEquipment): Promise<Equipment> {
    const id = randomUUID();
    const newEquipment: Equipment = {
      ...equipment,
      id,
      make: equipment.make || null,
      model: equipment.model || null,
      assetNumber: equipment.assetNumber || null,
      status: equipment.status || "available",
      serialNumber: equipment.serialNumber || null,
      currentProjectId: equipment.currentProjectId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.equipment.set(id, newEquipment);
    return newEquipment;
  }

  async updateEquipment(id: string, updates: UpdateEquipment): Promise<Equipment> {
    const equipment = this.equipment.get(id);
    if (!equipment) {
      throw new Error(`Equipment with id ${id} not found`);
    }

    const updatedEquipment: Equipment = {
      ...equipment,
      ...updates,
      updatedAt: new Date(),
    };
    this.equipment.set(id, updatedEquipment);
    return updatedEquipment;
  }

  async updateEquipmentAssignment(id: string, assignment: UpdateEquipmentAssignment): Promise<Equipment> {
    const equipment = this.equipment.get(id);
    if (!equipment) {
      throw new Error(`Equipment with id ${id} not found`);
    }
    
    const updatedEquipment: Equipment = {
      ...equipment,
      currentProjectId: assignment.currentProjectId,
      status: assignment.currentProjectId ? "in-use" : "available",
      updatedAt: new Date(),
    };
    
    this.equipment.set(id, updatedEquipment);
    
    // Create activity
    const projectName = assignment.currentProjectId 
      ? this.projects.get(assignment.currentProjectId)?.name 
      : null;
    
    const description = assignment.currentProjectId
      ? `${equipment.name} was assigned to ${projectName}`
      : `${equipment.name} was unassigned from project`;
    
    await this.createActivity({
      type: assignment.currentProjectId ? "assignment" : "unassignment",
      description,
      entityType: "equipment",
      entityId: id,
      projectId: assignment.currentProjectId,
    });
    
    return updatedEquipment;
  }

  // Activities
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return this.activities
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const newActivity: Activity = {
      ...activity,
      id,
      projectId: activity.projectId || null,
      createdAt: new Date(),
    };
    this.activities.push(newActivity);
    return newActivity;
  }

  // Alerts
  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(alert => !alert.isDismissed);
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const newAlert: Alert = {
      ...alert,
      id,
      priority: alert.priority || "medium",
      isRead: alert.isRead || false,
      isDismissed: alert.isDismissed || false,
      createdAt: new Date(),
    };
    this.alerts.set(id, newAlert);
    return newAlert;
  }

  async dismissAlert(id: string): Promise<void> {
    const alert = this.alerts.get(id);
    if (alert) {
      this.alerts.set(id, { ...alert, isDismissed: true });
    }
  }

  // Project Contacts
  async getProjectContacts(projectId: string): Promise<ProjectContact[]> {
    return Array.from(this.projectContacts.values()).filter(contact => contact.projectId === projectId);
  }

  async createProjectContact(contact: InsertProjectContact): Promise<ProjectContact> {
    const id = randomUUID();
    const newContact: ProjectContact = {
      ...contact,
      id,
      isPrimary: contact.isPrimary || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projectContacts.set(id, newContact);
    return newContact;
  }

  async updateProjectContact(id: string, updates: Partial<ProjectContact>): Promise<ProjectContact> {
    const contact = this.projectContacts.get(id);
    if (!contact) {
      throw new Error(`Project contact with id ${id} not found`);
    }

    const updatedContact: ProjectContact = {
      ...contact,
      ...updates,
      updatedAt: new Date(),
    };
    this.projectContacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteProjectContact(id: string): Promise<void> {
    this.projectContacts.delete(id);
  }
}

export const storage = new MemStorage();
