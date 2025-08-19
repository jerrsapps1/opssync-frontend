import React, { useEffect, useState, createContext, useContext } from "react";
import {
  ChakraProvider,
  extendTheme,
  Box,
  Flex,
  Heading,
  Image,
  Text,
  HStack,
  Button,
  Spacer,

  useToast,
  Alert as ChakraAlert,
  AlertIcon,
  AlertTitle,
  AlertDescription as ChakraAlertDescription,
  CloseButton,
} from "@chakra-ui/react";
// Removed unused icon imports
import { Route, Switch, Router, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import pages
import Dashboard from "./pages/dashboard";
import WhiteLabelPage from "./pages/white-label";
import EmployeesPage from "./pages/employees";
import EquipmentPage from "./pages/equipment";
import ProjectsPage from "./pages/projects";
import AnalyticsPage from "./pages/analytics";
import AppLayout from "./components/layout/AppLayout";
import SettingsIndex from "./pages/settings/index";
import ProjectSettings from "./pages/settings/projects";
import SettingsEquipment from "./pages/settings/equipment";
import SettingsEmployees from "./pages/settings/employees";
import PrivacySettings from "./pages/settings/privacy";
import PrivacyTestSettings from "./pages/settings/privacy-test";
import EquipmentDetail from "./pages/equipment-detail";
import EmployeeDetail from "./pages/employee-detail";
import DirectoryPage from "./pages/directory";
import HistoryPage from "./pages/history";
import SupervisorPortal from "./pages/supervisor";
import PricingPage from "./pages/billing/pricing";
import BillingHome from "./pages/billing";
import ProjectProfile from "./pages/project-profile";
import ManagerDashboard from "./pages/ManagerDashboard";
import OrgSettings from "./pages/OrgSettings";
import OwnerSettings from "./pages/OwnerSettings";
import BrandingSettings from "./pages/BrandingSettings";
import BillingSettings from "./pages/BillingSettings";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import OwnerBrandingControls from "./pages/OwnerBrandingControls";
import WhiteLabelSettings from "./pages/WhiteLabelSettings";
import RepairShop from "./pages/repair-shop";
import Login from "./pages/Login";
import SystemSettings from "./pages/system-settings";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Import the properly configured QueryClient
import { queryClient } from "./lib/queryClient";

/** ======= Brand Configuration ======= **/
const defaultBrandConfig = {
  appName: "OpsSync.ai",
  primaryColor: "#4A90E2",
  secondaryColor: "#BB86FC",
  logoUrl: "https://cdn-icons-png.flaticon.com/512/2920/2920579.png",
};

/** ======= Dynamic Theme ======= **/
function createTheme(brandConfig: any) {
  return extendTheme({
    config: { initialColorMode: "dark", useSystemColorMode: false },
    colors: {
      brand: {
        500: brandConfig.primaryColor,
        600: "#357ABD",
        700: "#2A5C8A",
      },
      secondary: brandConfig.secondaryColor,
      error: "#CF6679",
    },
    styles: {
      global: {
        body: {
          bg: "#121212",
          color: "#E0E0E0",
          fontFamily: "'Inter', sans-serif",
        },
      },
    },
  });
}

/** ======= App Context ======= **/
const AppContext = createContext<any>(null);
export function useApp() {
  return useContext(AppContext);
}

/** ======= Mock Data ======= **/
const mockProjects = [
  {
    id: "proj-001",
    name: "Downtown Mall Renovation",
    description: "Complete renovation of downtown shopping center",
    status: "Active",
    location: "Downtown",
  },
  {
    id: "proj-002", 
    name: "Highway Bridge Construction",
    description: "New bridge construction over Miller Creek",
    status: "Planning",
    location: "Highway 101",
  },
  {
    id: "proj-003",
    name: "Residential Complex Demo",
    description: "Demolition of old residential buildings",
    status: "Active", 
    location: "Oak Street",
  },
];

const mockEmployees = [
  { id: "emp-001", name: "John Smith", role: "Heavy Equipment Operator", currentProjectId: "proj-001" },
  { id: "emp-002", name: "Sarah Johnson", role: "Site Supervisor", currentProjectId: "proj-001" },
  { id: "emp-003", name: "Mike Davis", role: "Safety Inspector", currentProjectId: "proj-002" },
  { id: "emp-004", name: "Lisa Wilson", role: "Crane Operator", currentProjectId: null },
  { id: "emp-005", name: "Tom Brown", role: "Demolition Specialist", currentProjectId: "proj-003" },
];

const mockEquipment = [
  { id: "eq-001", name: "Excavator CAT-320", type: "Heavy Machinery", currentProjectId: "proj-001" },
  { id: "eq-002", name: "Pneumatic Drill Set", type: "Power Tools", currentProjectId: "proj-002" },
  { id: "eq-003", name: "Bulldozer BD-450", type: "Heavy Machinery", currentProjectId: "proj-001" },
  { id: "eq-004", name: "Demo Hammer Kit", type: "Demolition", currentProjectId: "proj-003" },
  { id: "eq-005", name: "Concrete Mixer", type: "Heavy Equipment", currentProjectId: null },
];

/** ======= Header Component (now integrated in AppLayout) ======= **/

/** ======= Conflict Alert Component ======= **/
function ConflictAlert({ conflicts, onClose }: { conflicts: any; onClose: () => void }) {
  const hasConflicts =
    conflicts.employeeConflicts.length > 0 || conflicts.equipmentConflicts.length > 0;

  if (!hasConflicts) return null;

  return (
    <ChakraAlert status="error" mb={4}>
      <AlertIcon />
      <Box flex="1">
        <AlertTitle mr={2}>Assignment Conflicts Detected!</AlertTitle>
        <ChakraAlertDescription>
          {conflicts.employeeConflicts.length > 0 && (
            <Text>
              Employees: {conflicts.employeeConflicts.map((e: any) => e.name).join(", ")}
            </Text>
          )}
          {conflicts.equipmentConflicts.length > 0 && (
            <Text>
              Equipment: {conflicts.equipmentConflicts.map((e: any) => e.name).join(", ")}
            </Text>
          )}
        </ChakraAlertDescription>
      </Box>
      <CloseButton onClick={onClose} />
    </ChakraAlert>
  );
}

/** ======= App Provider ======= **/
function AppProvider({ children }: { children: React.ReactNode }) {
  const [brandConfig, setBrandConfig] = useState(defaultBrandConfig);
  const [user, setUser] = useState({ id: "test-user-001", username: "demo" });
  const [projects, setProjects] = useState(mockProjects);
  const [employees, setEmployees] = useState(mockEmployees);
  const [equipment, setEquipment] = useState(mockEquipment);
  const [conflicts, setConflicts] = useState({ employeeConflicts: [], equipmentConflicts: [] });
  const [alertDismissed, setAlertDismissed] = useState(false);
  const toast = useToast();

  // Drag and drop handler
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Parse draggable ID to get type and ID
    const [type, id] = draggableId.split('-');
    const projectId = destination.droppableId === 'unassigned' ? null : destination.droppableId;

    if (type === 'employee') {
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === id ? { ...emp, currentProjectId: projectId } : emp
        )
      );
    } else if (type === 'equipment') {
      setEquipment(prev => 
        prev.map(eq => 
          eq.id === id ? { ...eq, currentProjectId: projectId } : eq
        )
      );
    }

    toast({
      title: `${type === 'employee' ? 'Employee' : 'Equipment'} Assignment Updated`,
      status: 'success',
      duration: 2000,
    });
  };

  const logout = () => {
    // Handle logout logic
    console.log('Logout');
  };

  const appValue = {
    brandConfig,
    setBrandConfig,
    user,
    setUser,
    projects,
    setProjects,
    employees,
    setEmployees,
    equipment,
    setEquipment,
    onDragEnd,
    logout,
    conflicts,
    setConflicts,
    alertDismissed,
    setAlertDismissed,
  };

  return (
    <AppContext.Provider value={appValue}>
      {children}
    </AppContext.Provider>
  );
}

/** ======= Main App Routes Component ======= **/
function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Switch>
      {/* Public login route */}
      <Route path="/login">
        {() => <Login brandConfig={user?.brandConfig || defaultBrandConfig} />}
      </Route>
      
      {/* Root redirect */}
      <Route path="/">
        {() => <ProtectedRoute><Redirect to="/dashboard" /></ProtectedRoute>}
      </Route>
      
      {/* Protected routes */}
      <Route path="/dashboard">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/employees">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <EmployeesPage />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/equipment">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <EquipmentPage />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/projects">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/analytics">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <AdvancedAnalytics />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/settings">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <SettingsIndex />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/settings/projects">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <ProjectSettings />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/settings/equipment">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <SettingsEquipment />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/settings/employees">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <SettingsEmployees />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/settings/privacy">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <PrivacySettings />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/equipment/:id">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <EquipmentDetail />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/employees/:id">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <EmployeeDetail />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/projects/:id">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <ProjectProfile />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/project/:id">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <ProjectProfile />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/repair-shop">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <RepairShop />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/system-settings">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <SystemSettings />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/directory">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <DirectoryPage />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/history">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/supervisor">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <SupervisorPortal />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/manager">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <ManagerDashboard />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/org/settings">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <OrgSettings />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/owner/settings">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <OwnerSettings />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/owner/branding">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <OwnerBrandingControls />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/org/branding">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <BrandingSettings />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/org/white-label">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <WhiteLabelSettings />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/billing">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <BillingSettings />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/pricing">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <PricingPage />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/assignments">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
      
      <Route path="/builder">
        {() => (
          <ProtectedRoute>
            <Redirect to="/employees" />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/white-label">
        {() => (
          <AppLayout>
            <ProtectedRoute>
              <WhiteLabelPage />
            </ProtectedRoute>
          </AppLayout>
        )}
      </Route>
    </Switch>
  );
}

/** ======= Root App Component ======= **/
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={createTheme(defaultBrandConfig)}>
        <AuthProvider>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </AuthProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}