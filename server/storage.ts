import { 
  projects, employees, equipment, activities, alerts, users,
  type Project, type InsertProject,
  type Employee, type InsertEmployee, 
  type Equipment, type InsertEquipment,
  type Activity, type InsertActivity,
  type Alert, type InsertAlert,
  type User, type InsertUser,
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
  
  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployeeAssignment(id: string, assignment: UpdateEmployeeAssignment): Promise<Employee>;
  
  // Equipment
  getEquipment(): Promise<Equipment[]>;
  getEquipmentItem(id: string): Promise<Equipment | undefined>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipmentAssignment(id: string, assignment: UpdateEquipmentAssignment): Promise<Equipment>;
  
  // Activities
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Alerts
  getActiveAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  dismissAlert(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private employees: Map<string, Employee>;
  private equipment: Map<string, Equipment>;
  private activities: Activity[];
  private alerts: Map<string, Alert>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.employees = new Map();
    this.equipment = new Map();
    this.activities = [];
    this.alerts = new Map();
    
    // Initialize with some sample data
    this.initializeSampleData();
    this.initializeTestUser().catch(console.error);
  }

  private initializeSampleData() {
    // Create sample projects
    const project1: Project = {
      id: "proj-001",
      name: "Downtown Mall Renovation",
      location: "Seattle, WA",
      status: "active",
      progress: 65,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const project2: Project = {
      id: "proj-002", 
      name: "Residential Complex Demo",
      location: "Portland, OR",
      status: "planning",
      progress: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.projects.set(project1.id, project1);
    this.projects.set(project2.id, project2);
    
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
        currentProjectId: emp.currentProjectId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.employees.set(employee.id, employee);
    });
    
    // Create sample equipment
    const equipmentList = [
      { id: "eq-001", name: "Excavator CAT-320", type: "Heavy Machinery", serialNumber: "EXC-001", status: "available" },
      { id: "eq-002", name: "Pneumatic Drill Set", type: "Power Tools", serialNumber: "PDS-005", status: "maintenance" },
      { id: "eq-003", name: "Bulldozer BD-450", type: "Heavy Machinery", serialNumber: "BD-450", status: "in-use", currentProjectId: "proj-001" },
      { id: "eq-004", name: "Demo Hammer Kit", type: "Demolition", serialNumber: "DHK-100", status: "in-use", currentProjectId: "proj-002" },
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
      status: project.status || "active",
      progress: project.progress || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, newProject);
    return newProject;
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

  async updateEmployeeAssignment(id: string, assignment: UpdateEmployeeAssignment): Promise<Employee> {
    const employee = this.employees.get(id);
    if (!employee) {
      throw new Error(`Employee with id ${id} not found`);
    }
    
    const updatedEmployee: Employee = {
      ...employee,
      currentProjectId: assignment.currentProjectId,
      status: assignment.currentProjectId ? "busy" : "available",
      updatedAt: new Date(),
    };
    
    this.employees.set(id, updatedEmployee);
    
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
      status: equipment.status || "available",
      serialNumber: equipment.serialNumber || null,
      currentProjectId: equipment.currentProjectId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.equipment.set(id, newEquipment);
    return newEquipment;
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
}

export const storage = new MemStorage();
