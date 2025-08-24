import React from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch, useLocation } from "wouter";
import "./index.css";

// Create sophisticated OpsSync.ai app with all your features
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const theme = extendTheme({
  config: { initialColorMode: "dark", useSystemColorMode: false },
  colors: {
    brand: { 500: "#4A90E2", 600: "#357ABD", 700: "#2A5C8A" },
    secondary: "#BB86FC",
    error: "#CF6679",
  },
  styles: {
    global: {
      body: { bg: "#121212", color: "#E0E0E0", fontFamily: "'Inter', sans-serif" },
    },
  },
});

function OpsyncApp() {
  const [currentUser, setCurrentUser] = React.useState({ name: "Demo User", role: "admin" });
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <NavigationHeader user={currentUser} />
        <div className="flex">
          <SidebarNavigation />
          <main className="flex-1 p-6">
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/repair-shop" component={RepairShopPage} />
              <Route path="/equipment" component={EquipmentPage} />
              <Route path="/projects" component={ProjectsPage} />
              <Route path="/employees" component={EmployeesPage} />
              <Route path="/analytics" component={AnalyticsPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route>404 - Page Not Found</Route>
            </Switch>
          </main>
        </div>
      </div>
    </Router>
  );
}

function NavigationHeader({ user }) {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-blue-400">OpsSync.ai</h1>
          <span className="text-purple-400 text-sm">Repair Shop Management</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">Welcome, {user?.name}</span>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}

function SidebarNavigation() {
  const [location, setLocation] = useLocation();
  
  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Repair Shop', path: '/repair-shop', icon: '🔧' },
    { name: 'Equipment', path: '/equipment', icon: '⚙️' },
    { name: 'Projects', path: '/projects', icon: '🏗️' },
    { name: 'Employees', path: '/employees', icon: '👥' },
    { name: 'Analytics', path: '/analytics', icon: '📈' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
              location === item.path || (location === '/' && item.path === '/dashboard')
                ? 'bg-blue-500 text-white' 
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function DashboardPage() {
  const [projects, setProjects] = React.useState([]);
  const [equipment, setEquipment] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/equipment').then(r => r.json()),
      fetch('/api/employees').then(r => r.json())
    ]).then(([projectData, equipmentData, employeeData]) => {
      setProjects(projectData || []);
      setEquipment(equipmentData || []);
      setEmployees(employeeData || []);
    }).catch(console.error);
  }, []);

  const metrics = {
    activeProjects: projects.filter(p => p.status === 'Active').length,
    availableEquipment: equipment.filter(e => !e.currentProjectId).length,
    equipmentInRepair: equipment.filter(e => e.status === 'maintenance' || e.currentProjectId === 'repair-shop').length,
    totalEmployees: employees.length,
    utilizationRate: Math.round((employees.filter(e => e.currentProjectId).length / Math.max(employees.length, 1)) * 100)
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-gray-400">Real-time insights into your repair shop operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Active Projects" value={metrics.activeProjects} icon="🏗️" color="blue" />
        <MetricCard title="Available Equipment" value={metrics.availableEquipment} icon="✅" color="green" />
        <MetricCard title="Equipment in Repair" value={metrics.equipmentInRepair} icon="🔧" color="red" />
        <MetricCard title="Workforce Utilization" value={`${metrics.utilizationRate}%`} icon="👥" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-purple-400 mb-4">Recent Projects</h2>
          <div className="space-y-3">
            {projects.slice(0, 5).map((project, index) => (
              <div key={project.id || index} className="bg-gray-700 p-4 rounded border border-gray-600">
                <h3 className="font-medium text-white">{project.name}</h3>
                <p className="text-gray-400 text-sm">{project.location}</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {project.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-purple-400 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded font-medium flex items-center gap-2">
              <span>➕</span> Create Work Order
            </button>
            <button className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded font-medium flex items-center gap-2">
              <span>🔧</span> Assign Equipment
            </button>
            <button className="w-full bg-purple-500 hover:bg-purple-600 text-white p-3 rounded font-medium flex items-center gap-2">
              <span>📊</span> View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepairShopPage() {
  const [repairEquipment, setRepairEquipment] = React.useState([]);
  const [workOrders, setWorkOrders] = React.useState([]);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/equipment').then(r => r.json()),
      fetch('/api/work-orders').then(r => r.status === 401 ? [] : r.json())
    ]).then(([equipmentData, workOrderData]) => {
      const repair = (equipmentData || []).filter(eq => 
        eq.currentProjectId === "repair-shop" || (!eq.currentProjectId && eq.status === "maintenance")
      );
      setRepairEquipment(repair);
      setWorkOrders(Array.isArray(workOrderData) ? workOrderData : []);
    }).catch(console.error);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          🔧 Repair Shop Management
        </h1>
        <p className="text-gray-400">Equipment under repair and maintenance</p>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
        <h2 className="text-xl font-semibold text-purple-400 mb-4">
          Assets Needing Repairs or PM ({repairEquipment.length})
        </h2>
        
        {repairEquipment.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Equipment in Repair</h3>
            <p className="text-gray-400">Equipment will appear here when sent to repair shop</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repairEquipment.map((equipment) => {
              const equipmentWorkOrders = workOrders.filter(wo => wo.equipmentId === equipment.id);
              
              return (
                <div key={equipment.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">{equipment.name}</h4>
                  <p className="text-gray-400 text-sm mb-3">{equipment.type}</p>
                  
                  {equipmentWorkOrders.length > 0 ? (
                    <div className="space-y-2">
                      {equipmentWorkOrders.map((workOrder) => (
                        <div key={workOrder.id} className="bg-gray-600 p-2 rounded text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-white font-medium">{workOrder.title}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              workOrder.priority === 'urgent' ? 'bg-red-100 text-red-800' : 
                              workOrder.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {workOrder.priority}
                            </span>
                          </div>
                          <p className="text-gray-300">{workOrder.description}</p>
                          <p className="text-gray-400 mt-1">Status: {workOrder.status}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-600 p-3 rounded text-center text-gray-300 text-sm">
                      No work orders yet - needs assessment
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EquipmentPage() {
  const [equipment, setEquipment] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/equipment')
      .then(r => r.json())
      .then(setEquipment)
      .catch(console.error);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Equipment Management</h1>
        <p className="text-gray-400">Complete equipment inventory and status tracking</p>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-purple-400 mb-4">Equipment Inventory ({equipment.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((item) => (
            <div key={item.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
              <h3 className="font-medium text-white mb-2">{item.name}</h3>
              <p className="text-gray-400 text-sm mb-2">{item.type}</p>
              <div className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  !item.currentProjectId ? 'bg-green-100 text-green-800' :
                  item.status === 'maintenance' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {!item.currentProjectId ? 'Available' : 
                   item.status === 'maintenance' ? 'In Repair' : 'In Use'}
                </span>
                {item.currentProjectId && (
                  <span className="text-xs text-gray-400">Project: {item.currentProjectId}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsPage() {
  const [projects, setProjects] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(setProjects)
      .catch(console.error);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Project Management</h1>
        <p className="text-gray-400">Active projects and assignments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
            <p className="text-gray-400 text-sm mb-3">{project.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-blue-400 text-sm">📍 {project.location}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {project.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmployeesPage() {
  const [employees, setEmployees] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(setEmployees)
      .catch(console.error);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Employee Management</h1>
        <p className="text-gray-400">Workforce overview and assignments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((employee) => (
          <div key={employee.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-white mb-1">{employee.name}</h3>
            <p className="text-gray-400 text-sm mb-2">{employee.position}</p>
            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                !employee.currentProjectId ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {!employee.currentProjectId ? 'Available' : 'Assigned'}
              </span>
              {employee.currentProjectId && (
                <span className="text-xs text-gray-400">Project: {employee.currentProjectId}</span>
              )}
            </div>
            {employee.skills && (
              <p className="text-xs text-gray-500 mt-2">Skills: {employee.skills.slice(0,2).join(', ')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">Performance metrics and business intelligence</p>
      </div>
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-purple-400 mb-4">Coming Soon</h2>
        <p className="text-gray-400">Advanced analytics and reporting features are in development.</p>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">System configuration and preferences</p>
      </div>
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-purple-400 mb-4">System Settings</h2>
        <p className="text-gray-400">Configuration options will be available here.</p>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
  };

  return (
    <div className={`bg-gray-800 rounded-lg border p-6 ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <div className={`text-2xl font-bold ${color === 'blue' ? 'text-blue-400' : 
                                              color === 'green' ? 'text-green-400' :
                                              color === 'red' ? 'text-red-400' : 'text-purple-400'}`}>
          {value}
        </div>
      </div>
      <h3 className="font-medium text-white">{title}</h3>
    </div>
  );
}

const el = document.getElementById("root");
if (!el) throw new Error("#root not found");

createRoot(el).render(
  <QueryClientProvider client={queryClient}>
    <ChakraProvider theme={theme}>
      <OpsyncApp />
    </ChakraProvider>
  </QueryClientProvider>
);