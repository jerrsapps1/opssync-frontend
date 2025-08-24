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
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
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
import Logs from "./pages/logs";
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
    <Routes>
      {/* Public login route */}
      <Route 
        path="/login" 
        element={
          <Login 
            brandConfig={user?.brandConfig || defaultBrandConfig}
          />
        } 
      />
      
      {/* Protected routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/employees" element={
          <ProtectedRoute>
            <EmployeesPage />
          </ProtectedRoute>
        } />
        <Route path="/equipment" element={
          <ProtectedRoute>
            <EquipmentPage />
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsIndex />
          </ProtectedRoute>
        }>
          <Route path="projects" element={<ProjectSettings />} />
          <Route path="equipment" element={<SettingsEquipment />} />
          <Route path="employees" element={<SettingsEmployees />} />
          <Route path="privacy" element={<PrivacySettings />} />
        </Route>
        <Route path="/equipment/:id" element={
          <ProtectedRoute>
            <EquipmentDetail />
          </ProtectedRoute>
        } />
        <Route path="/employees/:id" element={
          <ProtectedRoute>
            <EmployeeDetail />
          </ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute>
            <ProjectProfile />
          </ProtectedRoute>
        } />
        <Route path="/logs" element={
          <ProtectedRoute>
            <Logs />
          </ProtectedRoute>
        } />
        <Route path="/system-settings" element={
          <ProtectedRoute>
            <SystemSettings />
          </ProtectedRoute>
        } />
        <Route path="/project/:id" element={
          <ProtectedRoute>
            <ProjectProfile />
          </ProtectedRoute>
        } />
        <Route path="/directory" element={
          <ProtectedRoute>
            <DirectoryPage />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } />
        <Route path="/supervisor" element={
          <ProtectedRoute>
            <SupervisorPortal />
          </ProtectedRoute>
        } />
        <Route path="/manager" element={
          <ProtectedRoute>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/org/settings" element={
          <ProtectedRoute>
            <OrgSettings />
          </ProtectedRoute>
        } />
        <Route path="/owner/settings" element={
          <ProtectedRoute>
            <OwnerSettings />
          </ProtectedRoute>
        } />
        <Route path="/owner/branding" element={
          <ProtectedRoute>
            <OwnerBrandingControls />
          </ProtectedRoute>
        } />
        <Route path="/org/branding" element={
          <ProtectedRoute>
            <BrandingSettings />
          </ProtectedRoute>
        } />
        <Route path="/org/white-label" element={
          <ProtectedRoute>
            <WhiteLabelSettings />
          </ProtectedRoute>
        } />
        <Route path="/billing" element={
          <ProtectedRoute>
            <BillingSettings />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AdvancedAnalytics />
          </ProtectedRoute>
        } />
        <Route path="/pricing" element={
          <ProtectedRoute>
            <PricingPage />
          </ProtectedRoute>
        } />
        <Route path="/assignments" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/builder" element={
          <ProtectedRoute>
            <Navigate to="/employees" replace />
          </ProtectedRoute>
        } />
        <Route path="/white-label" element={
          <ProtectedRoute>
            <WhiteLabelPage />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

/** ======= Root App Component ======= **/
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={createTheme(defaultBrandConfig)}>
        <AuthProvider>
          <AppProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}