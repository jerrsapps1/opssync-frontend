import { 
  projects, employees, equipment, activities, alerts, users, projectContacts, projectActivityLogs,
  type Project, type InsertProject, type UpdateProject,
  type Employee, type InsertEmployee, type UpdateEmployee,
  type Equipment, type InsertEquipment, type UpdateEquipment,
  type Activity, type InsertActivity,
  type Alert, type InsertAlert,
  type User, type InsertUser,
  type ProjectContact, type InsertProjectContact,
  type UpdateEmployeeAssignment,
  type UpdateEquipmentAssignment,
  type ProjectActivityLog,
  type InsertProjectActivityLog
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { eq, gte, lte, desc } from "drizzle-orm";

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
  
  // Project Activity Logs
  getProjectActivityLogs(projectId?: string, startDate?: string, endDate?: string): Promise<ProjectActivityLog[]>;
  createProjectActivityLog(log: InsertProjectActivityLog): Promise<ProjectActivityLog>;
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
    // Skip deprecated sample data initialization - using PostgreSQL storage instead
    return;
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
      percentComplete: 65,
      percentMode: "auto",
      projectType: "Commercial",
      estimatedBudget: 500000000,
      actualCost: 325000000,
      contractValue: 450000000,
      profitMargin: 15,
      riskLevel: "medium",
      priority: "high",
      startBlocked: false,
      supervisorEmail: null,
      supervisorPhone: null,
      clientName: "Downtown Mall Corp",
      clientContact: "John Smith",
      clientEmail: "john@downtownmall.com",
      clientPhone: "+1-206-555-0100",
      generalContractor: "Seattle Construction Inc",
      contractorContact: "Sarah Johnson",
      contractorEmail: "sarah@seattleconstruction.com",
      contractorPhone: "+1-206-555-0200",
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
      percentComplete: 15,
      percentMode: "auto",
      projectType: "Residential",
      estimatedBudget: 200000000,
      actualCost: 30000000,
      contractValue: 180000000,
      profitMargin: 20,
      riskLevel: "high",
      priority: "medium",
      startBlocked: true,
      supervisorEmail: null,
      supervisorPhone: null,
      clientName: "Portland Development LLC",
      clientContact: "Mike Davis",
      clientEmail: "mike@portlanddev.com",
      clientPhone: "+1-503-555-0300",
      generalContractor: "Demo Experts Inc",
      contractorContact: "Lisa Chen",
      contractorEmail: "lisa@demoexperts.com",
      contractorPhone: "+1-503-555-0400",
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
      percentComplete: 100,
      percentMode: "auto",
      projectType: "Infrastructure",
      estimatedBudget: 50000000,
      actualCost: 45000000,
      contractValue: 50000000,
      profitMargin: 10,
      riskLevel: "low",
      priority: "low",
      startBlocked: false,
      supervisorEmail: null,
      supervisorPhone: null,
      clientName: "Internal Operations",
      clientContact: null,
      clientEmail: null,
      clientPhone: null,
      generalContractor: null,
      contractorContact: null,
      contractorEmail: null,
      contractorPhone: null,
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
      percentComplete: 100,
      percentMode: "auto",
      projectType: "Infrastructure",
      estimatedBudget: 25000000,
      actualCost: 23000000,
      contractValue: 25000000,
      profitMargin: 8,
      riskLevel: "low",
      priority: "medium",
      startBlocked: false,
      supervisorEmail: null,
      supervisorPhone: null,
      clientName: "Internal Operations",
      clientContact: null,
      clientEmail: null,
      clientPhone: null,
      generalContractor: null,
      contractorContact: null,
      contractorEmail: null,
      contractorPhone: null,
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
        percentComplete: 45,
        percentMode: "auto",
        projectType: "Infrastructure",
        estimatedBudget: 2500000,
        actualCost: 1125000,
        contractValue: 2400000,
        profitMargin: 15,
        riskLevel: "medium",
        priority: "high",
        startBlocked: false,
        supervisorEmail: "supervisor@bridge.com",
        supervisorPhone: "+1-206-555-0100",
        clientName: "Washington State DOT",
        clientContact: "John Smith",
        clientEmail: "john.smith@wsdot.wa.gov",
        clientPhone: "+1-360-555-0200",
        generalContractor: "Pacific Bridge Corp",
        contractorContact: "Sarah Wilson",
        contractorEmail: "sarah@pacificbridge.com",
        contractorPhone: "+1-206-555-0300",
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
        percentComplete: 25,
        percentMode: "auto",
        projectType: "Demolition",
        estimatedBudget: 850000,
        actualCost: 212500,
        contractValue: 800000,
        profitMargin: 12,
        riskLevel: "medium",
        priority: "medium",
        startBlocked: true,
        supervisorEmail: "demo.supervisor@company.com",
        supervisorPhone: "+1-206-555-0101",
        clientName: "Kent Industrial LLC",
        clientContact: "Mike Johnson",
        clientEmail: "mike@kentindustrial.com",
        clientPhone: "+1-425-555-0201",
        generalContractor: "Demolition Experts Inc",
        contractorContact: "Tom Brown",
        contractorEmail: "tom@demoexperts.com",
        contractorPhone: "+1-206-555-0301",
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
        percentComplete: 75,
        percentMode: "auto",
        projectType: "Renovation",
        estimatedBudget: 1800000,
        actualCost: 1350000,
        contractValue: 1750000,
        profitMargin: 18,
        riskLevel: "low",
        priority: "high",
        startBlocked: false,
        supervisorEmail: "school.supervisor@company.com",
        supervisorPhone: "+1-425-555-0102",
        clientName: "Bellevue School District",
        clientContact: "Jane Davis",
        clientEmail: "jane.davis@bsd405.org",
        clientPhone: "+1-425-555-0202",
        generalContractor: "Education Builders Ltd",
        contractorContact: "Robert Garcia",
        contractorEmail: "robert@edubuilders.com",
        contractorPhone: "+1-425-555-0302",
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
        percentComplete: 35,
        percentMode: "auto",
        projectType: "Commercial Construction",
        estimatedBudget: 45000000,
        actualCost: 15750000,
        contractValue: 43500000,
        profitMargin: 22,
        riskLevel: "high",
        priority: "high",
        startBlocked: false,
        supervisorEmail: "tower.supervisor@company.com",
        supervisorPhone: "+1-206-555-0103",
        clientName: "Belltown Development Group",
        clientContact: "Lisa Chen",
        clientEmail: "lisa@belltowndev.com",
        clientPhone: "+1-206-555-0203",
        generalContractor: "High Rise Specialists",
        contractorContact: "David Martinez",
        contractorEmail: "david@highrisespec.com",
        contractorPhone: "+1-206-555-0303",
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
        percentComplete: 10,
        percentMode: "auto",
        projectType: "Demolition",
        estimatedBudget: 680000,
        actualCost: 68000,
        contractValue: 650000,
        profitMargin: 10,
        riskLevel: "medium",
        priority: "medium",
        startBlocked: true,
        supervisorEmail: "garage.supervisor@company.com",
        supervisorPhone: "+1-206-555-0104",
        clientName: "Capitol Hill Community",
        clientContact: "Alex Thompson",
        clientEmail: "alex@caphill.org",
        clientPhone: "+1-206-555-0204",
        generalContractor: "Urban Demo Solutions",
        contractorContact: "Maria Rodriguez",
        contractorEmail: "maria@urbandemo.com",
        contractorPhone: "+1-206-555-0304",
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
        percentComplete: 60,
        percentMode: "auto",
        projectType: "Infrastructure",
        estimatedBudget: 3200000,
        actualCost: 1920000,
        contractValue: 3100000,
        profitMargin: 16,
        riskLevel: "high",
        priority: "urgent",
        startBlocked: false,
        supervisorEmail: "subway.supervisor@company.com",
        supervisorPhone: "+1-206-555-0105",
        clientName: "Sound Transit",
        clientContact: "Kevin Wong",
        clientEmail: "kevin@soundtransit.org",
        clientPhone: "+1-206-555-0205",
        generalContractor: "Transit Infrastructure Corp",
        contractorContact: "Jennifer Lee",
        contractorEmail: "jennifer@transitinfra.com",
        contractorPhone: "+1-206-555-0305",
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
        percentComplete: 55,
        percentMode: "auto",
        projectType: "Healthcare Construction",
        estimatedBudget: 28000000,
        actualCost: 15400000,
        contractValue: 27200000,
        profitMargin: 20,
        riskLevel: "high",
        priority: "urgent",
        startBlocked: false,
        supervisorEmail: "hospital.supervisor@company.com",
        supervisorPhone: "+1-206-555-0106",
        clientName: "First Hill Medical Center",
        clientContact: "Dr. Patricia Williams",
        clientEmail: "patricia@firsthill.org",
        clientPhone: "+1-206-555-0206",
        generalContractor: "Medical Facility Builders",
        contractorContact: "Andrew Kim",
        contractorEmail: "andrew@medfacility.com",
        contractorPhone: "+1-206-555-0306",
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
        percentComplete: 20,
        percentMode: "auto",
        projectType: "Historic Restoration",
        estimatedBudget: 1950000,
        actualCost: 390000,
        contractValue: 1900000,
        profitMargin: 14,
        riskLevel: "medium",
        priority: "medium",
        startBlocked: true,
        supervisorEmail: "pier.supervisor@company.com",
        supervisorPhone: "+1-206-555-0107",
        clientName: "Seattle Port Authority",
        clientContact: "Mark Anderson",
        clientEmail: "mark@portseattle.org",
        clientPhone: "+1-206-555-0207",
        generalContractor: "Historic Marine Works",
        contractorContact: "Susan Taylor",
        contractorEmail: "susan@historicmarine.com",
        contractorPhone: "+1-206-555-0307",
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
        percentComplete: 40,
        percentMode: "auto",
        projectType: "Sports Facility",
        estimatedBudget: 35000000,
        actualCost: 14000000,
        contractValue: 34000000,
        profitMargin: 19,
        riskLevel: "high",
        priority: "high",
        startBlocked: false,
        supervisorEmail: "stadium.supervisor@company.com",
        supervisorPhone: "+1-206-555-0108",
        clientName: "SoDo Sports LLC",
        clientContact: "Chris Johnson",
        clientEmail: "chris@sodosports.com",
        clientPhone: "+1-206-555-0208",
        generalContractor: "Stadium Specialists Inc",
        contractorContact: "Rachel Green",
        contractorEmail: "rachel@stadiumspec.com",
        contractorPhone: "+1-206-555-0308",
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
        percentComplete: 15,
        percentMode: "auto",
        projectType: "Demolition",
        estimatedBudget: 1200000,
        actualCost: 180000,
        contractValue: 1150000,
        profitMargin: 11,
        riskLevel: "medium",
        priority: "low",
        startBlocked: true,
        supervisorEmail: "shopping.supervisor@company.com",
        supervisorPhone: "+1-206-555-0109",
        clientName: "Northgate Development Corp",
        clientContact: "Linda Zhang",
        clientEmail: "linda@northgatedev.com",
        clientPhone: "+1-206-555-0209",
        generalContractor: "Retail Demo Experts",
        contractorContact: "Brian Foster",
        contractorEmail: "brian@retaildemo.com",
        contractorPhone: "+1-206-555-0309",
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
        percentComplete: 30,
        percentMode: "auto",
        projectType: "Residential Construction",
        estimatedBudget: 52000000,
        actualCost: 15600000,
        contractValue: 50000000,
        profitMargin: 25,
        riskLevel: "medium",
        priority: "high",
        startBlocked: false,
        supervisorEmail: "apartment.supervisor@company.com",
        supervisorPhone: "+1-206-555-0110",
        clientName: "South Lake Union Properties",
        clientContact: "Michael Davis",
        clientEmail: "michael@sluproperties.com",
        clientPhone: "+1-206-555-0210",
        generalContractor: "Luxury Residential Builders",
        contractorContact: "Emily Carter",
        contractorEmail: "emily@luxuryres.com",
        contractorPhone: "+1-206-555-0310",
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
        percentComplete: 5,
        percentMode: "auto",
        projectType: "Environmental Remediation",
        estimatedBudget: 3200000,
        actualCost: 160000,
        contractValue: 3100000,
        profitMargin: 8,
        riskLevel: "high",
        priority: "medium",
        startBlocked: true,
        supervisorEmail: "factory.supervisor@company.com",
        supervisorPhone: "+1-206-555-0111",
        clientName: "Georgetown Industrial LLC",
        clientContact: "Robert Miller",
        clientEmail: "robert@georgetownind.com",
        clientPhone: "+1-206-555-0211",
        generalContractor: "Environmental Solutions Corp",
        contractorContact: "Jessica White",
        contractorEmail: "jessica@envsolutions.com",
        contractorPhone: "+1-206-555-0311",
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
        percentComplete: 80,
        percentMode: "auto",
        projectType: "Community Facility",
        estimatedBudget: 2200000,
        actualCost: 1760000,
        contractValue: 2100000,
        profitMargin: 17,
        riskLevel: "low",
        priority: "medium",
        startBlocked: false,
        supervisorEmail: "community.supervisor@company.com",
        supervisorPhone: "+1-206-555-0112",
        clientName: "Fremont Community Association",
        clientContact: "Nancy Johnson",
        clientEmail: "nancy@fremontcommunity.org",
        clientPhone: "+1-206-555-0212",
        generalContractor: "Community Builders Inc",
        contractorContact: "Paul Wilson",
        contractorEmail: "paul@communitybuilders.com",
        contractorPhone: "+1-206-555-0312",
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
        percentComplete: 50,
        percentMode: "auto",
        projectType: "Public Facility",
        estimatedBudget: 8500000,
        actualCost: 4250000,
        contractValue: 8200000,
        profitMargin: 21,
        riskLevel: "low",
        priority: "medium",
        startBlocked: false,
        supervisorEmail: "library.supervisor@company.com",
        supervisorPhone: "+1-206-555-0113",
        clientName: "Seattle Public Library",
        clientContact: "Carol Thompson",
        clientEmail: "carol@spl.org",
        clientPhone: "+1-206-555-0213",
        generalContractor: "Public Works Contractors",
        contractorContact: "Steven Lee",
        contractorEmail: "steven@publicworks.com",
        contractorPhone: "+1-206-555-0313",
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
        percentComplete: 30,
        percentMode: "auto",
        projectType: "Marine Infrastructure",
        estimatedBudget: 4800000,
        actualCost: 1440000,
        contractValue: 4650000,
        profitMargin: 16,
        riskLevel: "medium",
        priority: "low",
        startBlocked: true,
        supervisorEmail: "marina.supervisor@company.com",
        supervisorPhone: "+1-206-555-0114",
        clientName: "Shilshole Bay Marina",
        clientContact: "James Peterson",
        clientEmail: "james@shilsholebay.com",
        clientPhone: "+1-206-555-0214",
        generalContractor: "Marine Construction LLC",
        contractorContact: "Diana Brown",
        contractorEmail: "diana@marineconstruction.com",
        contractorPhone: "+1-206-555-0314",
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
        emergencyContactPhone: null,
        company: null,
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
    // Always load from PostgreSQL database, not in-memory cache
    const dbProjects = await db.select().from(projects);
    console.log(`💾 getProjects: Found ${dbProjects.length} projects in PostgreSQL database`);
    
    // Update in-memory cache
    this.projects.clear();
    for (const project of dbProjects) {
      this.projects.set(project.id, project);
    }
    
    return dbProjects;
  }

  async getProject(id: string): Promise<Project | undefined> {
    // Always load from PostgreSQL database first
    const [dbProject] = await db.select().from(projects).where(eq(projects.id, id));
    if (dbProject) {
      this.projects.set(id, dbProject);
    }
    return dbProject;
  }

  async createProject(project: InsertProject): Promise<Project> {
    // Use database instead of in-memory storage
    const [newProject] = await db.insert(projects).values({
      ...project,
      gpsLatitude: project.gpsLatitude || null,
      gpsLongitude: project.gpsLongitude || null,
      kmzFileUrl: project.kmzFileUrl || null,
      description: project.description || null,
      status: project.status || "Planned",
      progress: project.progress || 0,
      percentComplete: project.percentComplete || 0,
      percentMode: project.percentMode || "auto",
      startDate: project.startDate ? new Date(project.startDate) : new Date(),
      endDate: project.endDate ? new Date(project.endDate) : null,
    }).returning();
    
    // Also update in-memory cache
    this.projects.set(newProject.id, newProject);
    
    return newProject;
  }

  async updateProject(id: string, updates: UpdateProject): Promise<Project> {
    // Update in database
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    
    if (!updatedProject) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    // Update in-memory cache
    this.projects.set(id, updatedProject);
    
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    // First, unassign all employees and equipment from this project
    for (const employee of Array.from(this.employees.values())) {
      if (employee.currentProjectId === id) {
        await this.updateEmployeeAssignment(employee.id, { currentProjectId: null });
      }
    }
    
    for (const equipment of Array.from(this.equipment.values())) {
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
      currentProjectId: assignment.projectId,
      status: assignment.projectId ? "busy" : "available",
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
    const projectName = assignment.projectId 
      ? this.projects.get(assignment.projectId)?.name 
      : null;
    
    const description = assignment.projectId
      ? `${employee.name} was assigned to ${projectName}`
      : `${employee.name} was unassigned from project`;
    
    await this.createActivity({
      type: assignment.projectId ? "assignment" : "unassignment",
      description,
      entityType: "employee",
      entityId: id,
      projectId: assignment.projectId,
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
      currentProjectId: assignment.projectId,
      status: assignment.projectId ? "in-use" : "available",
      updatedAt: new Date(),
    };
    
    this.equipment.set(id, updatedEquipment);
    
    // Create activity
    const projectName = assignment.projectId 
      ? this.projects.get(assignment.projectId)?.name 
      : null;
    
    const description = assignment.projectId
      ? `${equipment.name} was assigned to ${projectName}`
      : `${equipment.name} was unassigned from project`;
    
    await this.createActivity({
      type: assignment.projectId ? "assignment" : "unassignment",
      description,
      entityType: "equipment",
      entityId: id,
      projectId: assignment.projectId,
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

  // Project Activity Logs (default implementation - can be overridden)
  async getProjectActivityLogs(projectId?: string, startDate?: string, endDate?: string): Promise<ProjectActivityLog[]> {
    // Base class returns empty array - should be implemented in subclasses
    return [];
  }

  async createProjectActivityLog(log: InsertProjectActivityLog): Promise<ProjectActivityLog> {
    // Base class throws error - should be implemented in subclasses
    throw new Error("Project activity logging not implemented in base storage class");
  }
}

// Create a PostgreSQL storage class that extends MemStorage but uses database for projects
export class PostgreSQLStorage extends MemStorage {
  // Override project methods to use PostgreSQL instead of in-memory storage
  
  async getProjects(): Promise<Project[]> {
    console.log(`💾 PostgreSQLStorage.getProjects: Loading projects from PostgreSQL database`);
    const dbProjects = await db.select().from(projects);
    console.log(`💾 PostgreSQLStorage.getProjects: Found ${dbProjects.length} projects in PostgreSQL database`);
    
    // Update in-memory cache for consistency with parent class
    this.projects.clear();
    for (const project of dbProjects) {
      this.projects.set(project.id, project);
    }
    
    return dbProjects;
  }

  async getProject(id: string): Promise<Project | undefined> {
    console.log(`💾 PostgreSQLStorage.getProject: Loading project ${id} from PostgreSQL database`);
    const [dbProject] = await db.select().from(projects).where(eq(projects.id, id));
    if (dbProject) {
      this.projects.set(id, dbProject);
    }
    return dbProject;
  }

  async createProject(project: InsertProject): Promise<Project> {
    console.log(`💾 PostgreSQLStorage.createProject: Creating project in PostgreSQL database`);
    const [newProject] = await db.insert(projects).values({
      ...project,
      gpsLatitude: project.gpsLatitude || null,
      gpsLongitude: project.gpsLongitude || null,
      kmzFileUrl: project.kmzFileUrl || null,
      description: project.description || null,
      status: project.status || "Planned",
      progress: project.progress || 0,
      percentComplete: project.percentComplete || 0,
      percentMode: project.percentMode || "auto",
      startDate: project.startDate ? new Date(project.startDate) : new Date(),
      endDate: project.endDate ? new Date(project.endDate) : null,
    }).returning();
    
    console.log(`💾 PostgreSQLStorage.createProject: Created project ${newProject.id} successfully`);
    
    // Also update in-memory cache
    this.projects.set(newProject.id, newProject);
    
    return newProject;
  }

  async updateProject(id: string, updates: UpdateProject): Promise<Project> {
    console.log(`💾 PostgreSQLStorage.updateProject: Updating project ${id} in PostgreSQL database`);
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    
    if (!updatedProject) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    console.log(`💾 PostgreSQLStorage.updateProject: Updated project ${id} successfully`);
    
    // Update in-memory cache
    this.projects.set(id, updatedProject);
    
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    console.log(`💾 PostgreSQLStorage.deleteProject: Deleting project ${id} from PostgreSQL database`);
    
    // First, unassign all employees and equipment from this project
    for (const employee of Array.from(this.employees.values())) {
      if (employee.currentProjectId === id) {
        await this.updateEmployeeAssignment(employee.id, { currentProjectId: null });
      }
    }

    for (const equipment of Array.from(this.equipment.values())) {
      if (equipment.currentProjectId === id) {
        await this.updateEquipmentAssignment(equipment.id, { currentProjectId: null });
      }
    }

    // Delete from database
    await db.delete(projects).where(eq(projects.id, id));
    
    // Remove from in-memory cache
    this.projects.delete(id);
    
    console.log(`💾 PostgreSQLStorage.deleteProject: Deleted project ${id} successfully`);
  }

  // Override project activity logging methods to use PostgreSQL
  async getProjectActivityLogs(projectId?: string, startDate?: string, endDate?: string): Promise<ProjectActivityLog[]> {
    console.log(`💾 PostgreSQLStorage.getProjectActivityLogs: Loading logs from PostgreSQL database`);
    let query = db.select().from(projectActivityLogs);
    
    if (projectId) {
      query = query.where(eq(projectActivityLogs.projectId, projectId));
    }
    if (startDate) {
      query = query.where(gte(projectActivityLogs.date, startDate));
    }
    if (endDate) {
      query = query.where(lte(projectActivityLogs.date, endDate));
    }
    
    const logs = await query.orderBy(desc(projectActivityLogs.date), desc(projectActivityLogs.time));
    console.log(`💾 PostgreSQLStorage.getProjectActivityLogs: Found ${logs.length} logs`);
    return logs;
  }

  async createProjectActivityLog(log: InsertProjectActivityLog): Promise<ProjectActivityLog> {
    console.log(`💾 PostgreSQLStorage.createProjectActivityLog: Creating log for project ${log.projectId}`);
    const [newLog] = await db.insert(projectActivityLogs).values(log).returning();
    console.log(`💾 PostgreSQLStorage.createProjectActivityLog: Created log ${newLog.id} successfully`);
    return newLog;
  }

  // Override employee methods to use PostgreSQL instead of in-memory storage
  async getEmployees(): Promise<Employee[]> {
    const dbEmployees = await db.select().from(employees);
    
    // Update in-memory cache for consistency with parent class
    this.employees.clear();
    for (const employee of dbEmployees) {
      this.employees.set(employee.id, employee);
    }
    
    return dbEmployees;
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [dbEmployee] = await db.select().from(employees).where(eq(employees.id, id));
    if (dbEmployee) {
      this.employees.set(id, dbEmployee);
    }
    return dbEmployee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values({
      ...employee,
      email: employee.email || null,
      phone: employee.phone || null,
      avatarUrl: employee.avatarUrl || null,
      currentProjectId: employee.currentProjectId || null,
      employmentStatus: employee.employmentStatus || "active",
      status: employee.status || "available",
    }).returning();
    
    // Update in-memory cache
    this.employees.set(newEmployee.id, newEmployee);
    
    return newEmployee;
  }

  async updateEmployee(id: string, updates: UpdateEmployee): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();
    
    if (!updatedEmployee) {
      throw new Error(`Employee with id ${id} not found`);
    }
    
    // Update in-memory cache
    this.employees.set(id, updatedEmployee);
    
    return updatedEmployee;
  }

  async updateEmployeeAssignment(id: string, assignment: UpdateEmployeeAssignment): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({
        currentProjectId: assignment.projectId,
        status: assignment.projectId ? "assigned" : "available",
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();
    
    if (!updatedEmployee) {
      throw new Error(`Employee with id ${id} not found`);
    }
    
    // Update in-memory cache
    this.employees.set(id, updatedEmployee);
    
    // Create activity
    const projectName = assignment.projectId 
      ? this.projects.get(assignment.projectId)?.name 
      : null;
    
    const description = assignment.projectId
      ? `${updatedEmployee.name} was assigned to ${projectName}`
      : `${updatedEmployee.name} was unassigned from project`;
    
    await this.createActivity({
      type: assignment.projectId ? "assignment" : "unassignment",
      description,
      entityType: "employee",
      entityId: id,
      projectId: assignment.projectId,
    });
    
    return updatedEmployee;
  }

  // Override equipment methods to use PostgreSQL instead of in-memory storage
  async getEquipment(): Promise<Equipment[]> {
    const dbEquipment = await db.select().from(equipment);
    
    // Update in-memory cache for consistency with parent class
    this.equipment.clear();
    for (const equipmentItem of dbEquipment) {
      this.equipment.set(equipmentItem.id, equipmentItem);
    }
    
    return dbEquipment;
  }

  async getEquipmentItem(id: string): Promise<Equipment | undefined> {
    const [dbEquipment] = await db.select().from(equipment).where(eq(equipment.id, id));
    if (dbEquipment) {
      this.equipment.set(id, dbEquipment);
    }
    return dbEquipment;
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const [newEquipment] = await db.insert(equipment).values({
      ...equipmentData,
      make: equipmentData.make || null,
      model: equipmentData.model || null,
      assetNumber: equipmentData.assetNumber || null,
      serialNumber: equipmentData.serialNumber || null,
      currentProjectId: equipmentData.currentProjectId || null,
      status: equipmentData.status || "available",
    }).returning();
    
    // Update in-memory cache
    this.equipment.set(newEquipment.id, newEquipment);
    
    return newEquipment;
  }

  async updateEquipment(id: string, updates: UpdateEquipment): Promise<Equipment> {
    const [updatedEquipment] = await db
      .update(equipment)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(equipment.id, id))
      .returning();
    
    if (!updatedEquipment) {
      throw new Error(`Equipment with id ${id} not found`);
    }
    
    // Update in-memory cache
    this.equipment.set(id, updatedEquipment);
    
    return updatedEquipment;
  }

  async updateEquipmentAssignment(id: string, assignment: UpdateEquipmentAssignment): Promise<Equipment> {
    const [updatedEquipment] = await db
      .update(equipment)
      .set({
        currentProjectId: assignment.projectId,
        status: assignment.projectId ? "in-use" : "available",
        updatedAt: new Date(),
      })
      .where(eq(equipment.id, id))
      .returning();
    
    if (!updatedEquipment) {
      throw new Error(`Equipment with id ${id} not found`);
    }
    
    // Update in-memory cache
    this.equipment.set(id, updatedEquipment);
    
    // Create activity
    const projectName = assignment.projectId 
      ? this.projects.get(assignment.projectId)?.name 
      : null;
    
    const description = assignment.projectId
      ? `${updatedEquipment.name} was assigned to ${projectName}`
      : `${updatedEquipment.name} was unassigned from project`;
    
    await this.createActivity({
      type: assignment.projectId ? "assignment" : "unassignment",
      description,
      entityType: "equipment",
      entityId: id,
      projectId: assignment.projectId,
    });
    
    return updatedEquipment;
  }

  // Project Contacts PostgreSQL implementation
  async getProjectContacts(projectId: string): Promise<ProjectContact[]> {
    const dbContacts = await db.select().from(projectContacts).where(eq(projectContacts.projectId, projectId));
    return dbContacts;
  }

  async createProjectContact(contact: InsertProjectContact): Promise<ProjectContact> {
    const [newContact] = await db.insert(projectContacts).values({
      ...contact,
      email: contact.email || '',
      mobile: contact.mobile || '',
      company: contact.company || '',
      isPrimary: contact.isPrimary || false,
    }).returning();
    
    return newContact;
  }

  async updateProjectContact(id: string, updates: Partial<ProjectContact>): Promise<ProjectContact> {
    const [updatedContact] = await db
      .update(projectContacts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(projectContacts.id, id))
      .returning();
    
    if (!updatedContact) {
      throw new Error(`Project contact with id ${id} not found`);
    }
    
    return updatedContact;
  }

  async deleteProjectContact(id: string): Promise<void> {
    await db.delete(projectContacts).where(eq(projectContacts.id, id));
  }
}

export const storage = new PostgreSQLStorage();
