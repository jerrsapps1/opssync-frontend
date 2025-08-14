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

// Import the properly configured QueryClient
import { queryClient } from "./lib/queryClient";

/** ======= Auth Context ======= **/
const AuthContext = createContext<any>(null);
function useAuth() {
  return useContext(AuthContext);
}

/** ======= Brand Configuration ======= **/
const defaultBrandConfig = {
  appName: "StaffTrak",
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

/** ======= Root App Component ======= **/
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={createTheme(defaultBrandConfig)}>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/equipment" element={<EquipmentPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsIndex />}>
                  <Route path="projects" element={<ProjectSettings />} />
                  <Route path="equipment" element={<SettingsEquipment />} />
                  <Route path="employees" element={<SettingsEmployees />} />
                  <Route path="privacy" element={<PrivacySettings />} />
                </Route>
                <Route path="/equipment/:id" element={<EquipmentDetail />} />
                <Route path="/employees/:id" element={<EmployeeDetail />} />
                <Route path="/projects/:id" element={<ProjectProfile />} />
                <Route path="/project/:id" element={<ProjectProfile />} />
                <Route path="/directory" element={<DirectoryPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/supervisor" element={<SupervisorPortal />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/billing" element={<BillingHome />} />
                <Route path="/assignments" element={<Dashboard />} />
                <Route path="/builder" element={<Navigate to="/employees" replace />} />
                <Route path="/white-label" element={<WhiteLabelPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}