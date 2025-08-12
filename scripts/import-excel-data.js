import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Read the Excel file
const workbook = XLSX.readFile('attached_assets/earthmoving_equipment_1754970393643.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const equipmentData = XLSX.utils.sheet_to_json(worksheet);

console.log('Equipment data from Excel:');
console.log(JSON.stringify(equipmentData, null, 2));

// Generate equipment records
const equipment = equipmentData.map((row, index) => {
  const id = `eq-${String(index + 1).padStart(3, '0')}`;
  
  return {
    id,
    name: row.Name || row.Equipment || row.Model || `Equipment ${index + 1}`,
    type: row.Type || row.Category || 'Heavy Equipment',
    make: row.Make || row.Manufacturer || '',
    model: row.Model || row.Name || '',
    year: row.Year || row.ManufactureYear || new Date().getFullYear() - Math.floor(Math.random() * 15),
    serialNumber: row.Serial || row.SerialNumber || `SN${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    currentProjectId: null,
    status: 'active'
  };
});

// Generate sample employees
const employees = [
  {
    id: 'emp-001',
    name: 'John Martinez',
    role: 'Heavy Equipment Operator',
    email: 'john.martinez@company.com',
    phone: '(555) 234-5678',
    yearsExperience: 12,
    operates: ['Excavator', 'Bulldozer', 'Loader'],
    currentProjectId: null,
    status: 'active'
  },
  {
    id: 'emp-002', 
    name: 'Sarah Chen',
    role: 'Site Supervisor',
    email: 'sarah.chen@company.com',
    phone: '(555) 345-6789',
    yearsExperience: 8,
    operates: ['Crane', 'Forklift'],
    currentProjectId: null,
    status: 'active'
  },
  {
    id: 'emp-003',
    name: 'Mike Rodriguez',
    role: 'Equipment Technician',
    email: 'mike.rodriguez@company.com', 
    phone: '(555) 456-7890',
    yearsExperience: 15,
    operates: ['All Equipment Types'],
    currentProjectId: null,
    status: 'active'
  },
  {
    id: 'emp-004',
    name: 'Lisa Thompson',
    role: 'Crane Operator',
    email: 'lisa.thompson@company.com',
    phone: '(555) 567-8901', 
    yearsExperience: 6,
    operates: ['Mobile Crane', 'Tower Crane'],
    currentProjectId: null,
    status: 'active'
  },
  {
    id: 'emp-005',
    name: 'David Kim',
    role: 'Demolition Specialist',
    email: 'david.kim@company.com',
    phone: '(555) 678-9012',
    yearsExperience: 10,
    operates: ['Demolition Equipment', 'Excavator', 'Compactor'],
    currentProjectId: null,
    status: 'active'
  },
  {
    id: 'emp-006',
    name: 'Jennifer Walsh',
    role: 'Project Coordinator',
    email: 'jennifer.walsh@company.com',
    phone: '(555) 789-0123',
    yearsExperience: 5,
    operates: [],
    currentProjectId: null,
    status: 'active'
  }
];

// Generate sample projects
const projects = [
  {
    id: 'proj-001',
    name: 'Downtown Mall Renovation',
    location: '123 Main St, Downtown',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-06-30'
  },
  {
    id: 'proj-002', 
    name: 'Highway 95 Construction',
    location: 'Highway 95, Mile Marker 45-52',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-08-15'
  },
  {
    id: 'proj-003',
    name: 'Residential Complex Demo',
    location: '456 Oak Avenue',
    status: 'planning',
    startDate: '2024-03-01',
    endDate: '2024-05-30'
  }
];

// Output the data
console.log('\n=== GENERATED EQUIPMENT ===');
console.log(JSON.stringify(equipment, null, 2));

console.log('\n=== GENERATED EMPLOYEES ===');
console.log(JSON.stringify(employees, null, 2));

console.log('\n=== GENERATED PROJECTS ===');
console.log(JSON.stringify(projects, null, 2));

// Save to JSON files for import
fs.writeFileSync('data/mock-equipment.json', JSON.stringify(equipment, null, 2));
fs.writeFileSync('data/mock-employees.json', JSON.stringify(employees, null, 2));
fs.writeFileSync('data/mock-projects.json', JSON.stringify(projects, null, 2));

console.log('\n✓ Data saved to data/ directory');