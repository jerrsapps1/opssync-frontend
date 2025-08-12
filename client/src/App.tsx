import React, { useEffect, useState, useRef, createContext, useContext } from "react";
import {
  ChakraProvider,
  extendTheme,
  Box,
  Flex,
  Heading,
  Image,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Button,
  Input,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  useToast,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  Spacer,
  Stack,
  SimpleGrid,
  Select,
  Textarea,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Badge,
  Progress,
} from "@chakra-ui/react";
import { HamburgerIcon, SettingsIcon, StarIcon } from "@chakra-ui/icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { ObjectUploader } from "./components/ObjectUploader";

// Additional imports for new settings pages
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button as UIButton } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Input as UIInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea as UITextarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertProjectSchema, 
  insertEmployeeSchema, 
  insertEquipmentSchema,
  updateEmployeeSchema,
  updateEquipmentSchema,
  type InsertProject, 
  type InsertEmployee, 
  type InsertEquipment,
  type UpdateEmployee,
  type UpdateEquipment,
  type Project, 
  type Employee, 
  type Equipment 
} from "@shared/schema";
import { Plus, Edit, UserCheck, UserX, AlertTriangle, Wrench, Download, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
// useToast already imported from ChakraUI
import { Alert as UIAlert, AlertDescription as UIAlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';

/** ======= Auth Context ======= **/
const AuthContext = createContext<any>(null);
function useAuth() {
  return useContext(AuthContext);
}

/** ======= Default Brand Config ======= **/
const defaultBrandConfig = {
  appName: "TrackPro",
  primaryColor: "#4A90E2",
  secondaryColor: "#BB86FC",
  logoUrl: "https://cdn-icons-png.flaticon.com/512/2920/2920579.png",
};

/** ======= Dynamic Theme Function ======= **/
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
function useApp() {
  return useContext(AppContext);
}

/** ======= Navigation Context ======= **/
const NavigationContext = createContext<any>(null);
function useNavigation() {
  return useContext(NavigationContext);
}

/** ======= Project Filter Context ======= **/
const ProjectFilterContext = createContext<any>(null);
function useProjectFilter() {
  return useContext(ProjectFilterContext);
}

/** ======= Auth Provider ======= **/
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [brandConfig, setBrandConfig] = useState(defaultBrandConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const res = await fetch('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        if (userData.brandConfig) {
          try {
            const parsedBrandConfig = typeof userData.brandConfig === 'string' 
              ? JSON.parse(userData.brandConfig) 
              : userData.brandConfig;
            setBrandConfig({ ...defaultBrandConfig, ...parsedBrandConfig });
          } catch (error) {
            console.error('Error parsing brand config:', error);
            setBrandConfig(defaultBrandConfig);
          }
        }
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('authToken');
    }
    setLoading(false);
  };

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      const { token, user: userData } = await res.json();
      localStorage.setItem('authToken', token);
      setUser(userData);
      if (userData.brandConfig) {
        try {
          const parsedBrandConfig = typeof userData.brandConfig === 'string' 
            ? JSON.parse(userData.brandConfig) 
            : userData.brandConfig;
          setBrandConfig({ ...defaultBrandConfig, ...parsedBrandConfig });
        } catch (error) {
          console.error('Error parsing brand config:', error);
          setBrandConfig(defaultBrandConfig);
        }
      }
      return true;
    }
    return false;
  };

  const register = async (username: string, password: string, brandData: any) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, brandConfig: brandData })
    });

    if (res.ok) {
      const { token, user: userData } = await res.json();
      localStorage.setItem('authToken', token);
      setUser(userData);
      setBrandConfig({ ...defaultBrandConfig, ...brandData });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setBrandConfig(defaultBrandConfig);
  };

  const updateBrandConfig = async (newBrandConfig: any) => {
    const token = localStorage.getItem('authToken');
    const res = await fetch('/api/auth/brand-config', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ brandConfig: newBrandConfig })
    });

    if (res.ok) {
      setBrandConfig({ ...defaultBrandConfig, ...newBrandConfig });
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      brandConfig,
      login,
      register,
      logout,
      updateBrandConfig,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/** ======= Conflict Polling Hook ======= **/
function useConflictPolling(interval = 15000) {
  const [conflicts, setConflicts] = useState<any>({ employeeConflicts: [], equipmentConflicts: [] });

  useEffect(() => {
    const fetchConflicts = async () => {
      try {
        const res = await fetch('/api/conflicts');
        if (res.ok) {
          setConflicts(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch conflicts:', error);
      }
    };

    fetchConflicts().catch(console.error);
    const intervalId = setInterval(() => {
      fetchConflicts().catch(console.error);
    }, interval);
    return () => clearInterval(intervalId);
  }, [interval]);

  return [conflicts, setConflicts];
}

/** ======= Navigation Provider ======= **/
function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const navigateTo = (view: string, projectId?: string) => {
    setCurrentView(view);
    if (projectId) {
      setCurrentProjectId(projectId);
    }
  };

  const navigateToProject = (projectId: string) => {
    setCurrentView('project-profile');
    setCurrentProjectId(projectId);
  };

  const navigateToSettings = () => {
    setCurrentView('settings');
  };

  const navigateToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentProjectId(null);
  };

  return (
    <NavigationContext.Provider value={{
      currentView,
      currentProjectId,
      navigateTo,
      navigateToProject,
      navigateToSettings,
      navigateToDashboard
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

/** ======= Project Filter Provider ======= **/
function ProjectFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  const clearSelection = () => {
    setSelectedProjectId(null);
  };

  return (
    <ProjectFilterContext.Provider value={{
      selectedProjectId,
      selectProject,
      clearSelection
    }}>
      {children}
    </ProjectFilterContext.Provider>
  );
}

/** ======= App Provider ======= **/
function AppProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const toast = useToast();

  // Load initial data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [projRes, empRes, eqRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/employees"),
          fetch("/api/equipment"),
        ]);

        if (!projRes.ok || !empRes.ok || !eqRes.ok) {
          throw new Error("Failed to load data");
        }

        setProjects(await projRes.json());
        setEmployees(await empRes.json());
        setEquipment(await eqRes.json());
      } catch (e: any) {
        toast({
          title: "Error loading data",
          description: e.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    }
    fetchData().catch(console.error);
  }, [toast]);

  // Update employee assignment (project)
  async function moveEmployee(empId: string, newProjectId: string | null) {
    try {
      const res = await fetch(`/api/employees/${empId}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProjectId: newProjectId }),
      });
      if (!res.ok) throw new Error("Failed to update employee");
      const updatedEmployee = await res.json();
      setEmployees((emps) =>
        emps.map((e) =>
          e.id === empId ? updatedEmployee : e
        )
      );
    } catch (e: any) {
      toast({
        title: "Error updating employee",
        description: e.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  // Update equipment assignment (project)
  async function moveEquipment(eqId: string, newProjectId: string | null) {
    try {
      const res = await fetch(`/api/equipment/${eqId}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProjectId: newProjectId }),
      });
      if (!res.ok) throw new Error("Failed to update equipment");
      const updatedEquipment = await res.json();
      setEquipment((eqs) =>
        eqs.map((e) => (e.id === eqId ? updatedEquipment : e))
      );
    } catch (e: any) {
      toast({
        title: "Error updating equipment",
        description: e.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  // Add new items
  const addProject = async (projectData: any) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const newProject = await res.json();
      setProjects((prev) => [...prev, newProject]);
      toast({
        title: "Project created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return newProject;
    } catch (e: any) {
      toast({
        title: "Error creating project",
        description: e.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      throw e;
    }
  };

  const addEmployee = async (employeeData: any) => {
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeData),
      });
      if (!res.ok) throw new Error("Failed to create employee");
      const newEmployee = await res.json();
      setEmployees((prev) => [...prev, newEmployee]);
      toast({
        title: "Employee added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return newEmployee;
    } catch (e: any) {
      toast({
        title: "Error adding employee",
        description: e.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      throw e;
    }
  };

  const addEquipment = async (equipmentData: any) => {
    try {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(equipmentData),
      });
      if (!res.ok) throw new Error("Failed to create equipment");
      const newEquipment = await res.json();
      setEquipment((prev) => [...prev, newEquipment]);
      toast({
        title: "Equipment added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return newEquipment;
    } catch (e: any) {
      toast({
        title: "Error adding equipment",
        description: e.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      throw e;
    }
  };

  // Update functions (placeholders for now)
  const updateProject = async (projectId: string, updateData: any) => {
    // TODO: Implement project update
  };

  const updateEmployee = async (employeeId: string, updateData: any) => {
    // TODO: Implement employee update
  };

  const updateEquipment = async (equipmentId: string, updateData: any) => {
    // TODO: Implement equipment update
  };

  return (
    <AppContext.Provider
      value={{ 
        projects, 
        employees, 
        equipment, 
        moveEmployee, 
        moveEquipment,
        addProject,
        addEmployee,
        addEquipment,
        updateProject,
        updateEmployee,
        updateEquipment
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/** ======= Login Form ======= **/
function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [brandData, setBrandData] = useState(defaultBrandConfig);
  const { login, register } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = isRegister 
      ? await register(username, password, brandData)
      : await login(username, password);

    if (!success) {
      toast({
        title: "Authentication failed",
        description: isRegister ? "Registration failed" : "Invalid credentials",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      minH="100vh"
      bg="#121212"
      color="#E0E0E0"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box maxW="md" w="full" p={8} bg="#1E1E2F" borderRadius="md" boxShadow="lg">
        <VStack spacing={6}>
          <Heading size="lg" textAlign="center">
            {isRegister ? "Create Account" : "Welcome to TrackPro"}
          </Heading>

          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Username</FormLabel>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </FormControl>

              <FormControl>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </FormControl>

              {isRegister && (
                <VStack spacing={4} w="full">
                  <Text fontWeight="bold">Customize Your Brand</Text>

                  <FormControl>
                    <FormLabel>App Name</FormLabel>
                    <Input
                      value={brandData.appName}
                      onChange={(e) => setBrandData({...brandData, appName: e.target.value})}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Primary Color</FormLabel>
                    <Input
                      type="color"
                      value={brandData.primaryColor}
                      onChange={(e) => setBrandData({...brandData, primaryColor: e.target.value})}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Logo URL</FormLabel>
                    <Input
                      value={brandData.logoUrl}
                      onChange={(e) => setBrandData({...brandData, logoUrl: e.target.value})}
                    />
                  </FormControl>
                </VStack>
              )}

              <UIButton type="submit" colorScheme="blue" width="full">
                {isRegister ? "Create Account" : "Login"}
              </UIButton>

              <Button
                variant="link"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? "Already have an account? Login" : "Need an account? Register"}
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Box>
  );
}

/** ======= Enhanced Settings Modal ======= **/
function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { brandConfig, updateBrandConfig } = useAuth();
  const [formData, setFormData] = useState(brandConfig);
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  useEffect(() => {
    setFormData(brandConfig);
  }, [brandConfig, isOpen]);

  const handleSave = async () => {
    const success = await updateBrandConfig(formData);
    if (success) {
      toast({
        title: "Settings saved",
        description: "Your brand configuration has been updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } else {
      toast({
        title: "Failed to save",
        description: "Could not update settings",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleColorChange = (field: string, color: string) => {
    setFormData(prev => ({ ...prev, [field]: color }));
  };

  const handleLogoUpload = (logoUrl: string) => {
    // Convert storage URL to public serving URL
    const publicUrl = logoUrl.replace(
      "https://storage.googleapis.com/",
      "/public-objects/"
    ).replace(/^\/[^\/]+\//, "");

    setFormData(prev => ({ ...prev, logoUrl: `/public-objects/${publicUrl}` }));
  };

  const tabs = [
    { label: "Brand Identity", icon: "🎨" },
    { label: "Company Info", icon: "🏢" },
    { label: "Colors & Theme", icon: "🌈" },
    { label: "Logo & Assets", icon: "📷" }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent bg="#1E1E2F" color="#E0E0E0" maxH="90vh">
        <ModalHeader borderBottom="1px solid #4A4A5E">
          <VStack align="start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold">White-Label Settings</Text>
            <Text fontSize="sm" color="gray.400">
              Customize your app's brand identity and appearance
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6} overflow="hidden">
          <Flex height="500px">
            {/* Sidebar Navigation */}
            <Box width="200px" mr={6} borderRight="1px solid #4A4A5E" pr={4}>
              <VStack spacing={2} align="stretch">
                {tabs.map((tab, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    justifyContent="flex-start"
                    onClick={() => setActiveTab(index)}
                    bg={activeTab === index ? "brand.600" : "transparent"}
                    color={activeTab === index ? "white" : "gray.300"}
                    _hover={{ bg: activeTab === index ? "brand.500" : "gray.700" }}
                    leftIcon={<Text>{tab.icon}</Text>}
                    size="sm"
                  >
                    {tab.label}
                  </Button>
                ))}
              </VStack>
            </Box>

            {/* Content Area */}
            <Box flex="1" overflowY="auto">
              {activeTab === 0 && (
                <VStack spacing={6} align="stretch">
                  <Heading size="md" color="white">Brand Identity</Heading>

                  <FormControl>
                    <FormLabel>Application Name</FormLabel>
                    <Input
                      value={formData.appName}
                      onChange={(e) => setFormData({...formData, appName: e.target.value})}
                      bg="#2D2D44"
                      border="1px solid #4A4A5E"
                      _focus={{ borderColor: brandConfig.primaryColor }}
                      placeholder="Your Company Name"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      This name appears in the header and throughout the app
                    </Text>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Tagline</FormLabel>
                    <Input
                      value={formData.tagline || ""}
                      onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                      bg="#2D2D44"
                      border="1px solid #4A4A5E"
                      _focus={{ borderColor: brandConfig.primaryColor }}
                      placeholder="Professional Asset Management"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Optional tagline displayed with your brand
                    </Text>
                  </FormControl>
                </VStack>
              )}

              {activeTab === 1 && (
                <VStack spacing={6} align="stretch">
                  <Heading size="md" color="white">Company Information</Heading>

                  <FormControl>
                    <FormLabel>Company Name</FormLabel>
                    <Input
                      value={formData.companyName || ""}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      bg="#2D2D44"
                      border="1px solid #4A4A5E"
                      _focus={{ borderColor: brandConfig.primaryColor }}
                      placeholder="Your Company Ltd."
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Industry</FormLabel>
                    <Input
                      value={formData.industry || ""}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      bg="#2D2D44"
                      border="1px solid #4A4A5E"
                      _focus={{ borderColor: brandConfig.primaryColor }}
                      placeholder="Construction, Demolition, Equipment Rental"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Website</FormLabel>
                    <Input
                      value={formData.website || ""}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      bg="#2D2D44"
                      border="1px solid #4A4A5E"
                      _focus={{ borderColor: brandConfig.primaryColor }}
                      placeholder="https://yourcompany.com"
                    />
                  </FormControl>
                </VStack>
              )}

              {activeTab === 2 && (
                <VStack spacing={6} align="stretch">
                  <Heading size="md" color="white">Colors & Theme</Heading>

                  <FormControl>
                    <FormLabel>Primary Brand Color</FormLabel>
                    <HStack>
                      <Input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        width="60px"
                        height="40px"
                        padding="4px"
                        bg="transparent"
                        border="1px solid #4A4A5E"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        bg="#2D2D44"
                        border="1px solid #4A4A5E"
                        _focus={{ borderColor: brandConfig.primaryColor }}
                      />
                    </HStack>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Used for buttons, headers, and accent elements
                    </Text>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Secondary Color</FormLabel>
                    <HStack>
                      <Input
                        type="color"
                        value={formData.secondaryColor || "#4A5568"}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                        width="60px"
                        height="40px"
                        padding="4px"
                        bg="transparent"
                        border="1px solid #4A4A5E"
                      />
                      <Input
                        value={formData.secondaryColor || "#4A5568"}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                        bg="#2D2D44"
                        border="1px solid #4A4A5E"
                        _focus={{ borderColor: brandConfig.primaryColor }}
                      />
                    </HStack>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Used for secondary elements and borders
                    </Text>
                  </FormControl>

                  <Box p={4} bg="#2D2D44" borderRadius="md" border="1px solid #4A4A5E">
                    <Text fontSize="sm" fontWeight="bold" mb={2}>Color Preview</Text>
                    <HStack spacing={4}>
                      <Box w={16} h={8} bg={formData.primaryColor} borderRadius="md" />
                      <Box w={16} h={8} bg={formData.secondaryColor || "#4A5568"} borderRadius="md" />
                      <Text fontSize="xs" color="gray.500">
                        Primary & Secondary
                      </Text>
                    </HStack>
                  </Box>
                </VStack>
              )}

              {activeTab === 3 && (
                <VStack spacing={6} align="stretch">
                  <Heading size="md" color="white">Logo & Visual Assets</Heading>

                  <FormControl>
                    <FormLabel>Company Logo</FormLabel>
                    <VStack spacing={4} align="stretch">
                      {formData.logoUrl && (
                        <Box p={4} bg="#2D2D44" borderRadius="md" border="1px solid #4A4A5E">
                          <Text fontSize="sm" mb={2}>Current Logo:</Text>
                          <Image
                            src={formData.logoUrl}
                            alt="Current logo"
                            maxH="80px"
                            maxW="200px"
                            objectFit="contain"
                          />
                        </Box>
                      )}

                      <ObjectUploader onComplete={handleLogoUpload}>
                        📁 Upload New Logo
                      </ObjectUploader>

                      <Text fontSize="xs" color="gray.500">
                        Recommended: PNG or SVG format, max 5MB, optimized for 40px height
                      </Text>
                    </VStack>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Logo URL (Alternative)</FormLabel>
                    <Input
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                      bg="#2D2D44"
                      border="1px solid #4A4A5E"
                      _focus={{ borderColor: brandConfig.primaryColor }}
                      placeholder="https://example.com/logo.png"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Or provide a direct URL to your logo image
                    </Text>
                  </FormControl>
                </VStack>
              )}
            </Box>
          </Flex>
        </ModalBody>

        <ModalFooter borderTop="1px solid #4A4A5E">
          <UIButton colorScheme="blue" mr={3} onClick={handleSave}>
            Save Changes
          </UIButton>
          <UIButton variant="ghost" onClick={onClose}>
            Cancel
          </UIButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** ======= Header with Branding and Auth ======= **/
function Header() {
  const { brandConfig, user, logout } = useAuth();
  const { navigateTo, navigateToSettings, navigateToDashboard, currentView } = useNavigation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Flex
        as="header"
        bg="brand.700"
        align="center"
        p={4}
        boxShadow="md"
        mb={4}
        userSelect="none"
      >
        {/* Logo and Brand */}
        <HStack spacing={3} mr={6}>
          <Image
            src={brandConfig.logoUrl}
            alt={`${brandConfig.appName} Logo`}
            height="40px"
            cursor="pointer"
            onClick={navigateToDashboard}
          />
          <Heading 
            size="md" 
            color="white" 
            cursor="pointer" 
            onClick={navigateToDashboard}
          >
            {brandConfig.appName}
          </Heading>
        </HStack>

        {/* Navigation Buttons */}
        <HStack spacing={2} mr={4}>
          <Button
            variant={currentView === 'dashboard' ? 'solid' : 'outline'}
            bg={currentView === 'dashboard' ? 'white' : 'transparent'}
            color={currentView === 'dashboard' ? 'brand.700' : 'white'}
            borderColor="white"
            _hover={{ 
              bg: currentView === 'dashboard' ? 'gray.100' : 'whiteAlpha.200',
              color: currentView === 'dashboard' ? 'brand.700' : 'white'
            }}
            size="sm"
            onClick={navigateToDashboard}
          >
            Dashboard
          </Button>

          <Button
            variant={currentView === 'projects' ? 'solid' : 'outline'}
            bg={currentView === 'projects' ? 'white' : 'transparent'}
            color={currentView === 'projects' ? 'brand.700' : 'white'}
            borderColor="white"
            _hover={{ 
              bg: currentView === 'projects' ? 'gray.100' : 'whiteAlpha.200',
              color: currentView === 'projects' ? 'brand.700' : 'white'
            }}
            size="sm"
            onClick={() => navigateTo('projects')}
          >
            Project Settings
          </Button>

          <Button
            variant={currentView === 'employees' ? 'solid' : 'outline'}
            bg={currentView === 'employees' ? 'white' : 'transparent'}
            color={currentView === 'employees' ? 'brand.700' : 'white'}
            borderColor="white"
            _hover={{ 
              bg: currentView === 'employees' ? 'gray.100' : 'whiteAlpha.200',
              color: currentView === 'employees' ? 'brand.700' : 'white'
            }}
            size="sm"
            onClick={() => navigateTo('employees')}
          >
            Employee Profiles
          </Button>

          <Button
            variant={currentView === 'equipment' ? 'solid' : 'outline'}
            bg={currentView === 'equipment' ? 'white' : 'transparent'}
            color={currentView === 'equipment' ? 'brand.700' : 'white'}
            borderColor="white"
            _hover={{ 
              bg: currentView === 'equipment' ? 'gray.100' : 'whiteAlpha.200',
              color: currentView === 'equipment' ? 'brand.700' : 'white'
            }}
            size="sm"
            onClick={() => navigateTo('equipment')}
          >
            Equipment Management
          </Button>
        </HStack>

        <Spacer />

        <HStack spacing={3}>
          <Text color="white" fontSize="sm">
            Welcome, {user?.username}
          </Text>

          <Menu>
            <MenuButton
              as={IconButton}
              icon={<HamburgerIcon />}
              variant="ghost"
              colorScheme="whiteAlpha"
              size="sm"
            />
            <MenuList bg="#1E1E2F" borderColor="brand.500">
              <MenuItem 
                icon={<SettingsIcon />} 
                onClick={onOpen}
                bg="#1E1E2F"
                _hover={{ bg: "brand.600" }}
              >
                Brand Config
              </MenuItem>
              <MenuItem 
                onClick={logout}
                bg="#1E1E2F"
                _hover={{ bg: "red.600" }}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      <SettingsModal isOpen={isOpen} onClose={onClose} />
    </>
  );
}

/** ======= Helper Functions ======= **/
function calculateProjectDuration(startDate: Date | null, endDate: Date | null): string {
  if (!startDate || !endDate) return 'Duration TBD';

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} days`;
  } else if (diffDays < 365) {
    const months = Math.round(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else {
    const years = Math.round(diffDays / 365);
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
}

function getProjectTimeStatus(startDate: Date | null, endDate: Date | null): 'upcoming' | 'active' | 'overdue' | 'completed' {
  if (!startDate || !endDate) return 'active';

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return 'upcoming';
  if (now > end) return 'overdue';
  return 'active';
}

/** ======= Project List (Left Panel) ======= **/
function ProjectList() {
  const { projects } = useApp();
  const { navigateToProject } = useNavigation();
  const { selectedProjectId, selectProject, clearSelection } = useProjectFilter();

  const handleProjectClick = (project: any) => {
    if (selectedProjectId === project.id) {
      // If clicking the same project, clear selection
      clearSelection();
    } else {
      // Select the project for filtering
      selectProject(project.id);
    }
  };

  return (
    <Box
      width="200px"
      borderRight="1px solid"
      borderColor="brand.700"
      p={3}
      overflowY="auto"
      bg="#1E1E2F"
    >
      <HStack justify="space-between" mb={3}>
        <Heading size="sm">Projects</Heading>
        {selectedProjectId && (
          <UIButton size="xs" variant="outline" onClick={clearSelection}>
            Show All
          </UIButton>
        )}
      </HStack>

      <VStack align="start" spacing={2}>
        {projects.map((proj: any) => (
          <Droppable key={proj.id} droppableId={`project-${proj.id}`}>
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                px={3}
                py={2}
                bg={snapshot.isDraggingOver ? "green.600" : (selectedProjectId === proj.id ? "brand.500" : "brand.600")}
                border="2px solid"
                borderColor={snapshot.isDraggingOver ? "green.400" : (selectedProjectId === proj.id ? "brand.300" : "transparent")}
                rounded="md"
                width="100%"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ bg: selectedProjectId === proj.id ? "brand.400" : "brand.500" }}
                onClick={() => handleProjectClick(proj)}
                onDoubleClick={() => navigateToProject(proj.id)}
                minHeight="60px"
              >
                <VStack align="start" spacing={1}>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      {proj.name}
                    </Text>
                    {selectedProjectId === proj.id && (
                      <Text fontSize="xs" color="brand.200">
                        ✓
                      </Text>
                    )}
                  </HStack>

                  <HStack justify="space-between" w="full">
                    <Text fontSize="xs" color="gray.300" textTransform="capitalize">
                      {proj.status}
                    </Text>
                    <Text 
                      fontSize="xs" 
                      color={
                        getProjectTimeStatus(proj.startDate, proj.endDate) === 'overdue' ? 'red.300' :
                        getProjectTimeStatus(proj.startDate, proj.endDate) === 'upcoming' ? 'blue.300' :
                        'green.300'
                      }
                    >
                      {calculateProjectDuration(proj.startDate, proj.endDate)}
                    </Text>
                  </HStack>

                  {proj.progress !== undefined && (
                    <Box w="full">
                      <Progress 
                        value={proj.progress} 
                        size="xs" 
                        colorScheme={
                          getProjectTimeStatus(proj.startDate, proj.endDate) === 'overdue' ? 'red' : 'green'
                        }
                        bg="gray.600"
                      />
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        {proj.progress}% complete
                      </Text>
                    </Box>
                  )}
                </VStack>
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        ))}

        {/* Unassigned Drop Zone */}
        <Droppable droppableId="project-unassigned">
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              px={3}
              py={2}
              bg={snapshot.isDraggingOver ? "red.600" : "#2A2A3D"}
              border="2px dashed"
              borderColor={snapshot.isDraggingOver ? "red.400" : "#4A4A5E"}
              rounded="md"
              width="100%"
              minHeight="60px"
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="sm" color="gray.400" textAlign="center">
                {snapshot.isDraggingOver ? "Release to unassign" : "Unassigned"}
              </Text>
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </VStack>

      <Text fontSize="xs" color="gray.500" mt={3} textAlign="center">
        Click to filter • Double-click for details
      </Text>
    </Box>
  );
}

/** ======= Employee List (Center Panel) ======= **/
function EmployeeList({ onEndorse }: { onEndorse: (type: string, id: string, name: string) => void }) {
  const { employees, projects } = useApp();
  const { selectedProjectId } = useProjectFilter();

  // Group employees by project or unassigned
  const grouped: any = {};
  projects.forEach((p: any) => (grouped[p.id] = []));
  grouped["unassigned"] = [];
  employees.forEach((emp: any) => {
    (emp.currentProjectId && grouped[emp.currentProjectId]
      ? grouped[emp.currentProjectId]
      : grouped["unassigned"]
    ).push(emp);
  });

  // Filter groups based on selected project
  const filteredGroups = selectedProjectId 
    ? { [selectedProjectId]: grouped[selectedProjectId] || [] }
    : grouped;

  // Count filtered employees
  const filteredCount = Object.values(filteredGroups).reduce((total: number, emps: any) => total + emps.length, 0);

  return (
    <Box flex="1" p={3} overflowY="auto">
      <HStack justify="space-between" mb={3}>
        <Heading size="sm">
          Employees
          {selectedProjectId && (
            <Text as="span" fontSize="xs" color="gray.400" ml={2}>
              (Filtered: {filteredCount})
            </Text>
          )}
        </Heading>
        {selectedProjectId && filteredCount === 0 && (
          <Text fontSize="xs" color="yellow.400">
            No employees assigned
          </Text>
        )}
      </HStack>

      {Object.entries(filteredGroups).map(([projId, emps]: [string, any]) => (
        <Droppable key={projId} droppableId={`employee-${projId}`}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              mb={6}
              p={3}
              bg={snapshot.isDraggingOver ? "brand.800" : "#1E1E2F"}
              border="2px dashed"
              borderColor={snapshot.isDraggingOver ? "brand.400" : "#4A4A5E"}
              rounded="md"
              minHeight="80px"
              transition="all 0.2s"
            >
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold" color="white">
                  {projId === "unassigned"
                    ? "Unassigned"
                    : projects.find((p: any) => p.id === projId)?.name}
                </Text>
                  <Text fontSize="xs" color="brand.200" fontWeight="bold">
                  </Text>
                )}
              </HStack>

              {emps.map((emp: any, index: number) => (
                <Draggable
                  key={emp.id}
                  draggableId={`employee-${emp.id}`}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      p={2}
                      mb={2}
                      bg={snapshot.isDragging ? "brand.500" : "brand.600"}
                      rounded="md"
                      boxShadow={snapshot.isDragging ? "2xl" : "sm"}
                      transform={snapshot.isDragging ? "rotate(-2deg) scale(1.05)" : "none"}
                      transition="all 0.2s ease-in-out"
                      _hover={{
                        transform: "scale(1.02)",
                        boxShadow: "lg"
                      }}
                      color="white"
                      userSelect="none"
                      cursor="grab"
                      _active={{ cursor: "grabbing" }}
                      position="relative"
                    >
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="sm">{emp.name}</Text>
                          <Text fontSize="xs" color="gray.300">{emp.role}</Text>
                        </VStack>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          color="brand.200"
                          _hover={{ color: "yellow.300", transform: "scale(1.2)" }}
                          transition="all 0.2s"
                          icon={<StarIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEndorse('employee', emp.id, emp.name);
                          }}
                          aria-label="Endorse employee performance"
                        />
                        {selectedProjectId && emp.currentProjectId === selectedProjectId && (
                          <Box
                            bg="green.400"
                            color="white"
                            borderRadius="full"
                            w={4}
                            h={4}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="xs"
                          >
                            ✓
                          </Box>
                        )}
                      </HStack>
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {emps.length === 0 && (
                <Text color="gray.500" fontSize="sm" fontStyle="italic" textAlign="center" py={2}>
                  No employees {projId === "unassigned" ? "unassigned" : "assigned to this project"}
                </Text>
              )}
            </Box>
          )}
        </Droppable>
      ))}

      {selectedProjectId && filteredCount === 0 && (
        <Box textAlign="center" py={8} bg="#1E1E2F" rounded="md">
          <Text color="gray.400" fontSize="sm">
            No employees assigned to this project
          </Text>
          <Text color="gray.500" fontSize="xs" mt={1}>
            Drag employees here to assign them
          </Text>
        </Box>
      )}
    </Box>
  );
}

/** ======= Equipment List (Right Panel) ======= **/
function EquipmentList({ onEndorse }: { onEndorse: (type: string, id: string, name: string) => void }) {
  const { equipment, projects } = useApp();
  const { selectedProjectId } = useProjectFilter();

  // Apply project filtering if selected
  const filteredEquipment = selectedProjectId && selectedProjectId !== 'all'
    ? equipment.filter((eq: any) => eq.currentProjectId === selectedProjectId)
    : equipment;

  return (
    <Box
      width="250px"
      borderLeft="1px solid"
      borderColor="brand.700"
      p={3}
      overflowY="auto"
      bg="#1E1E2F"
    >
      <HStack justify="space-between" mb={3}>
        <Heading size="sm">
          Equipment
          {selectedProjectId && (
            <Text as="span" fontSize="xs" color="gray.400" ml={2}>
              (Filtered: {filteredEquipment.length})
            </Text>
          )}
        </Heading>
        {selectedProjectId && filteredEquipment.length === 0 && (
          <Text fontSize="xs" color="yellow.400">
            No equipment assigned
          </Text>
        )}
      </HStack>

      <Droppable droppableId="equipment-all">
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            p={3}
            bg={snapshot.isDraggingOver ? "purple.800" : "#2A2A3D"}
            border="2px dashed"
            borderColor={snapshot.isDraggingOver ? "purple.400" : "#4A4A5E"}
            rounded="md"
            minHeight="200px"
            transition="all 0.2s"
          >
            {filteredEquipment.map((eq: any, index: number) => (
              <Draggable
                key={eq.id}
                draggableId={`equipment-${eq.id}`}
                index={index}
              >
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    p={2}
                    mb={2}
                    bg={snapshot.isDragging ? "purple.500" : "#BB86FC"}
                    rounded="md"
                    boxShadow={snapshot.isDragging ? "2xl" : "sm"}
                    color="white"
                    userSelect="none"
                    cursor="grab"
                    transform={snapshot.isDragging ? "rotate(2deg) scale(1.05)" : "none"}
                    transition="all 0.2s ease-in-out"
                    _hover={{
                      transform: "scale(1.02)",
                      boxShadow: "lg"
                    }}
                    _active={{ cursor: "grabbing" }}
                    position="relative"
                  >
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm">{eq.name}</Text>
                        <Text fontSize="xs" color="gray.300">{eq.type}</Text>
                        {/* Assignment status badge - only show when assigned */}
                        {eq.currentProjectId && (
                          <Badge 
                            size="sm" 
                            colorScheme="green" 
                            fontSize="xs"
                          >
                            {projects.find((p: any) => p.id === eq.currentProjectId)?.name || "Assigned"}
                          </Badge>
                        )}
                      </VStack>

                    </HStack>
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {filteredEquipment.length === 0 && (
              <Text color="gray.500" fontSize="sm" fontStyle="italic" textAlign="center" py={8}>
                {selectedProjectId ? "No equipment assigned to this project" : "No equipment available"}
              </Text>
            )}
          </Box>
        )}
      </Droppable>
    </Box>
  );
}

/** ======= Conflict Alert Component ======= **/
function ConflictAlert({ conflicts, onClose }: { conflicts: any; onClose: () => void }) {
  const hasConflicts =
    conflicts.employeeConflicts.length > 0 || conflicts.equipmentConflicts.length > 0;

  if (!hasConflicts) return null;

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
  };

  const handleAlertClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <UIAlert status="error" mb={4} onClick={handleAlertClick}>
      <AlertIcon />
      <Box flex="1">
        <AlertTitle mr={2}>Assignment Conflicts Detected!</AlertTitle>
        <UIAlertDescription>
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
        </UIAlertDescription>
      </Box>
      <CloseButton onClick={handleClose} />
    </UIAlert>
  );
}

/** ======= Main App Content ======= **/
function MainApp() {
  const { moveEmployee, moveEquipment } = useApp();
  const [conflicts, setConflicts] = useConflictPolling(15000);
  const [dismissedConflicts, setDismissedConflicts] = useState(false);
  const [endorsementAnimation, setEndorsementAnimation] = useState<{show: boolean, text: string, type: string}>({show: false, text: '', type: ''});

  const handleSkillEndorsement = (type: string, id: string, name: string) => {
    setEndorsementAnimation({
      show: true,
      text: `${name} endorsed!`,
      type: type
    });

    // Hide animation after 2 seconds
    setTimeout(() => {
      setEndorsementAnimation({show: false, text: '', type: ''});
    }, 2000);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    if (sourceId === destId) return;

    console.log("Drag end:", { sourceId, destId, draggableId });

    // Extract item type and project IDs
    const [itemType, ...sourceProjectParts] = sourceId.split("-");
    const [destType, ...destProjectParts] = destId.split("-");
    const itemId = draggableId.replace(`${itemType}-`, "");

    // Handle different destination types
    let newProjectId = null;
    if (destType === "project" && destProjectParts.join("-") !== "unassigned") {
      newProjectId = destProjectParts.join("-");
    }

    console.log("Moving item:", { itemType, itemId, newProjectId });

    try {
      if (itemType === "employee") {
        moveEmployee(itemId, newProjectId);
      } else if (itemType === "equipment") {
        moveEquipment(itemId, newProjectId);
      }
    } catch (error) {
      console.error("Error moving item:", error);
    }
  };

  // Reset dismissal when new conflicts appear
  useEffect(() => {
    const hasConflicts =
      conflicts.employeeConflicts.length > 0 || conflicts.equipmentConflicts.length > 0;
    if (hasConflicts) {
      setDismissedConflicts(false);
    }
  }, [conflicts]);

  return (
    <Box position="relative">
      {!dismissedConflicts && (
        <ConflictAlert
          conflicts={conflicts}
          onClose={() => setDismissedConflicts(true)}
        />
      )}

      {/* Endorsement Animation Pop-up */}
      {endorsementAnimation.show && (
        <Box
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={9999}
          bg="rgba(0,0,0,0.8)"
          color="yellow.300"
          p={6}
          rounded="lg"
          textAlign="center"
          minWidth="200px"
          animation="endorsementPulse 2s ease-in-out"
          boxShadow="0 0 40px rgba(255, 235, 59, 0.6)"
        >
          <VStack spacing={2}>
            <StarIcon boxSize={8} color="yellow.300" />
            <Text fontSize="lg" fontWeight="bold">
              {endorsementAnimation.text}
            </Text>
            <Text fontSize="sm" color="gray.300">
              Performance Recognized!
            </Text>
          </VStack>
        </Box>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Flex height="calc(100vh - 120px)">
          <ProjectList />
          <EmployeeList onEndorse={handleSkillEndorsement} />
          <EquipmentList onEndorse={handleSkillEndorsement} />
        </Flex>
      </DragDropContext>
    </Box>
  );
}

/** ======= Enhanced Settings Page ======= **/
function SettingsPage() {
  const { navigateToDashboard } = useNavigation();
  const { projects, employees, equipment, addProject, addEmployee, addEquipment, updateProject, updateEmployee, updateEquipment } = useApp();
  const [activeTab, setActiveTab] = useState('projects');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    location: '',
    status: 'Planning',
    budget: '',
    startDate: '',
    dueDate: '',
    description: '',
    progress: 0
  });
  const [newEmployeeData, setNewEmployeeData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    department: 'Construction'
  });
  const [newEquipmentData, setNewEquipmentData] = useState({
    name: '',
    type: 'Heavy Machinery',
    serialNumber: '',
    condition: 'Excellent'
  });

  const tabs = [
    { id: 'projects', label: 'Project Details', icon: '🏗️' },
    { id: 'team', label: 'Team Management', icon: '👥' },
    { id: 'equipment', label: 'Equipment Settings', icon: '🚜' },
    { id: 'company-contacts', label: 'Company Contacts', icon: '🏢' },
    { id: 'project-contacts', label: 'Project Contacts', icon: '📞' }
  ];

  // Creation handlers
  const handleCreateProject = async () => {
    try {
      const projectData = {
        projectNumber: `PRJ-${Date.now()}`,
        name: newProjectData.name,
        location: newProjectData.location,
        description: newProjectData.description,
        status: newProjectData.status,
        progress: newProjectData.progress
      };

      await addProject(projectData);
      setIsCreatingNew(false);
      setNewProjectData({
        name: '',
        location: '',
        status: 'Planning',
        budget: '',
        startDate: '',
        dueDate: '',
        description: '',
        progress: 0
      });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleCreateEmployee = async () => {
    try {
      const employeeData = {
        name: newEmployeeData.name,
        role: newEmployeeData.role,
        email: newEmployeeData.email,
        phone: newEmployeeData.phone
      };

      await addEmployee(employeeData);
      setIsCreatingNew(false);
      setNewEmployeeData({
        name: '',
        role: '',
        email: '',
        phone: '',
        department: 'Construction'
      });
    } catch (error) {
      console.error('Error creating employee:', error);
    }
  };

  const handleCreateEquipment = async () => {
    try {
      const equipmentData = {
        name: newEquipmentData.name,
        type: newEquipmentData.type,
        serialNumber: newEquipmentData.serialNumber
      };

      await addEquipment(equipmentData);
      setIsCreatingNew(false);
      setNewEquipmentData({
        name: '',
        type: 'Heavy Machinery',
        serialNumber: '',
        condition: 'Excellent'
      });
    } catch (error) {
      console.error('Error creating equipment:', error);
    }
  };

  return (
    <Box p={6} minH="100vh">
      <HStack mb={6} spacing={4}>
        <UIButton onClick={navigateToDashboard} variant="outline" size="sm">
          ← Back to Dashboard
        </UIButton>
        <Heading color="white">Settings & Configuration</Heading>
      </HStack>

      {/* Tab Navigation */}
      <Box mb={6}>
        <HStack spacing={1} bg="#1E1E2F" p={1} borderRadius="md" wrap="wrap">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'solid' : 'ghost'}
              colorScheme={activeTab === tab.id ? 'brand' : 'gray'}
              onClick={() => setActiveTab(tab.id)}
              leftIcon={<Text>{tab.icon}</Text>}
              size="sm"
              minW="fit-content"
            >
              {tab.label}
            </Button>
          ))}
        </HStack>
      </Box>

      {/* Tab Content */}
      <Box bg="#1E1E2F" p={6} borderRadius="md" minH="600px">
        {activeTab === 'projects' && (
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
              <Heading size="lg" color="white">Project Details Management</Heading>
              <UIButton 
                colorScheme="brand" 
                size="sm"
                onClick={() => {
                  setIsCreatingNew(true);
                  setSelectedProject(null);
                }}
              >
                + Add New Project
              </UIButton>
            </HStack>

            <Flex gap={6}>
              {/* Project List */}
              <Box w="300px">
                <Text fontWeight="bold" mb={3} color="gray.300">Select Project to Edit</Text>
                <VStack spacing={2} align="stretch">
                  {projects.map(project => (
                    <Box
                      key={project.id}
                      p={3}
                      bg={selectedProject?.id === project.id ? "brand.600" : "#2D2D44"}
                      border="1px solid"
                      borderColor={selectedProject?.id === project.id ? "brand.400" : "#4A4A5E"}
                      borderRadius="md"
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ bg: "brand.500" }}
                      onClick={() => setSelectedProject(project)}
                    >
                      <Text fontWeight="bold" color="white" fontSize="sm">{project.name}</Text>
                      <Text color="gray.400" fontSize="xs">{project.status} • {project.location}</Text>
                    </Box>
                  ))}
                </VStack>
              </Box>

              {/* Project Details Form */}
              <Box flex="1" bg="#2D2D44" p={4} borderRadius="md">
                {isCreatingNew ? (
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="white">Create New Project</Heading>

                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Project Name *</Text>
                        <UIInput
                          value={newProjectData.name} 
                          onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                          bg="#1E1E2F" 
                          color="white" 
                          placeholder="Enter project name"
                        />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Status</Text>
                        <UISelect 
                          bg="#1E1E2F" 
                          color="white" 
                          value={newProjectData.status}
                          onChange={(e) => setNewProjectData({...newProjectData, status: e.target.value})}
                        >
                          <option style={{background: '#1E1E2F'}} value="Planning">Planning</option>
                          <option style={{background: '#1E1E2F'}} value="In Progress">In Progress</option>
                          <option style={{background: '#1E1E2F'}} value="On Hold">On Hold</option>
                          <option style={{background: '#1E1E2F'}} value="Completed">Completed</option>
                        </UISelect>
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Location *</Text>
                        <UIInput
                          value={newProjectData.location} 
                          onChange={(e) => setNewProjectData({...newProjectData, location: e.target.value})}
                          bg="#1E1E2F" 
                          color="white" 
                          placeholder="Enter project location"
                        />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Budget</Text>
                        <UIInput
                          value={newProjectData.budget} 
                          onChange={(e) => setNewProjectData({...newProjectData, budget: e.target.value})}
                          bg="#1E1E2F" 
                          color="white" 
                          placeholder="e.g. $50,000"
                        />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Start Date</Text>
                        <UIInput
                          type="date" 
                          value={newProjectData.startDate} 
                          onChange={(e) => setNewProjectData({...newProjectData, startDate: e.target.value})}
                          bg="#1E1E2F" 
                          color="white" 
                        />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Due Date</Text>
                        <UIInput
                          type="date" 
                          value={newProjectData.dueDate} 
                          onChange={(e) => setNewProjectData({...newProjectData, dueDate: e.target.value})}
                          bg="#1E1E2F" 
                          color="white" 
                        />
                      </Box>
                    </SimpleGrid>

                    <Box>
                      <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Description</Text>
                      <UITextarea 
                        value={newProjectData.description} 
                        onChange={(e) => setNewProjectData({...newProjectData, description: e.target.value})}
                        bg="#1E1E2F" 
                        color="white" 
                        rows={3} 
                        placeholder="Project description..."
                      />
                    </Box>

                    <HStack>
                      <UIButton 
                        colorScheme="brand" 
                        onClick={handleCreateProject}
                        isDisabled={!newProjectData.name || !newProjectData.location}
                      >
                        Create Project
                      </UIButton>
                      <UIButton 
                        variant="outline" 
                        onClick={() => setIsCreatingNew(false)}
                      >
                        Cancel
                      </UIButton>
                    </HStack>
                  </VStack>
                ) : selectedProject ? (
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="white">Edit: {selectedProject.name}</Heading>

                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Project Name</Text>
                        <UIInput value={selectedProject.name} bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Status</Text>
                        <UISelect bg="#1E1E2F" color="white" value={selectedProject.status}>
                          <option style={{background: '#1E1E2F'}} value="Planning">Planning</option>
                          <option style={{background: '#1E1E2F'}} value="In Progress">In Progress</option>
                          <option style={{background: '#1E1E2F'}} value="On Hold">On Hold</option>
                          <option style={{background: '#1E1E2F'}} value="Completed">Completed</option>
                        </UISelect>
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Location</Text>
                        <UIInput value={selectedProject.location} bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Budget</Text>
                        <UIInput value={selectedProject.budget} bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Start Date</Text>
                        <UIInput type="date" value={selectedProject.startDate} bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Due Date</Text>
                        <UIInput type="date" value={selectedProject.dueDate} bg="#1E1E2F" color="white" />
                      </Box>
                    </SimpleGrid>

                    <Box>
                      <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Description</Text>
                      <UITextarea value={selectedProject.description} bg="#1E1E2F" color="white" rows={3} />
                    </Box>

                    <Box>
                      <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Progress (%)</Text>
                      <Slider value={selectedProject.progress} colorScheme="brand">
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                      <Text color="gray.400" fontSize="sm" mt={1}>{selectedProject.progress}% Complete</Text>
                    </Box>

                    <HStack>
                      <UIButton colorScheme="brand">Save Changes</UIButton>
                      <UIButton variant="outline">Cancel</UIButton>
                      <Spacer />
                      <UIButton colorScheme="red" variant="outline">Delete Project</UIButton>
                    </HStack>
                  </VStack>
                ) : (
                  <Box textAlign="center" py={12}>
                    <Text color="gray.400">Select a project from the list to edit its details or click "Add New Project" to create one</Text>
                  </Box>
                )}
              </Box>
            </Flex>
          </VStack>
        )}

        {activeTab === 'team' && (
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
              <Heading size="lg" color="white">Team Management</Heading>
              <UIButton 
                colorScheme="brand" 
                size="sm"
                onClick={() => {
                  setIsCreatingNew(true);
                  setSelectedEmployee(null);
                }}
              >
                + Add Team Member
              </UIButton>
            </HStack>

            <Flex gap={6}>
              {/* Employee List */}
              <Box w="300px">
                <Text fontWeight="bold" mb={3} color="gray.300">Team Members</Text>
                <VStack spacing={2} align="stretch">
                  {employees.map(employee => (
                    <Box
                      key={employee.id}
                      p={3}
                      bg={selectedEmployee?.id === employee.id ? "green.600" : "#2D2D44"}
                      border="1px solid"
                      borderColor={selectedEmployee?.id === employee.id ? "green.400" : "#4A4A5E"}
                      borderRadius="md"
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ bg: "green.500" }}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <Text fontWeight="bold" color="white" fontSize="sm">{employee.name}</Text>
                      <Text color="gray.400" fontSize="xs">{employee.role}</Text>
                      <Text color="gray.500" fontSize="xs">
                        Project: {employee.currentProjectId || 'Unassigned'}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </Box>

              {/* Employee Details Form */}
              <Box flex="1" bg="#2D2D44" p={4} borderRadius="md">
                {isCreatingNew && activeTab === 'team' ? (
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="white">Add New Team Member</Heading>

                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Full Name *</Text>
                        <UIInput
                          value={newEmployeeData.name} 
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, name: e.target.value})}
                          bg="#1E1E2F" 
                          color="white" 
                          placeholder="Enter employee name"
                        />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Job Title *</Text>
                        <UIInput
                          value={newEmployeeData.role} 
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, role: e.target.value})}
                          bg="#1E1E2F" 
                          color="white" 
                          placeholder="e.g. Site Manager, Heavy Operator"
                        />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Email</Text>
                        <UIInput
                          value={newEmployeeData.email} 
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, email: e.target.value})}
                          type="email" 
                          bg="#1E1E2F" 
                          color="white" 
                          placeholder="employee@company.com"
                        />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Phone</Text>
                        <UIInput
                          value={newEmployeeData.phone} 
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, phone: e.target.value})}
                          type="tel" 
                          bg="#1E1E2F" 
                          color="white" 
                          placeholder="(555) 123-4567"
                        />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Department</Text>
                        <UISelect 
                          bg="#1E1E2F" 
                          color="white" 
                          value={newEmployeeData.department}
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, department: e.target.value})}
                        >
                          <option style={{background: '#1E1E2F'}} value="Construction">Construction</option>
                          <option style={{background: '#1E1E2F'}} value="Demolition">Demolition</option>
                          <option style={{background: '#1E1E2F'}} value="Management">Management</option>
                          <option style={{background: '#1E1E2F'}} value="Safety">Safety</option>
                        </UISelect>
                      </Box>
                    </SimpleGrid>

                    <HStack>
                      <UIButton 
                        colorScheme="green" 
                        onClick={handleCreateEmployee}
                        isDisabled={!newEmployeeData.name || !newEmployeeData.role}
                      >
                        Add Employee
                      </UIButton>
                      <UIButton 
                        variant="outline" 
                        onClick={() => setIsCreatingNew(false)}
                      >
                        Cancel
                      </UIButton>
                    </HStack>
                  </VStack>
                ) : selectedEmployee ? (
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="white">Edit: {selectedEmployee.name}</Heading>

                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Full Name</Text>
                        <UIInput value={selectedEmployee.name} bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Job Title</Text>
                        <UIInput value={selectedEmployee.role} bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Email</Text>
                        <UIInput type="email" value={selectedEmployee.email || ""} bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Phone</Text>
                        <UIInput type="tel" value={selectedEmployee.phone || ""} bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Hire Date</Text>
                        <UIInput type="date" bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Department</Text>
                        <UISelect bg="#1E1E2F" color="white">
                          <option style={{background: '#1E1E2F'}} value="Construction">Construction</option>
                          <option style={{background: '#1E1E2F'}} value="Demolition">Demolition</option>
                          <option style={{background: '#1E1E2F'}} value="Management">Management</option>
                          <option style={{background: '#1E1E2F'}} value="Safety">Safety</option>
                        </UISelect>
                      </Box>
                    </SimpleGrid>

                    <Box>
                      <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Skills & Certifications</Text>
                      <UITextarea placeholder="List employee skills and certifications..." bg="#1E1E2F" color="white" rows={3} />
                    </Box>

                    <HStack>
                      <UIButton colorScheme="green">Save Changes</UIButton>
                      <UIButton variant="outline">Cancel</UIButton>
                      <Spacer />
                      <UIButton colorScheme="red" variant="outline">Remove Employee</UIButton>
                    </HStack>
                  </VStack>
                ) : (
                  <Box textAlign="center" py={12}>
                    <Text color="gray.400">Select a team member to edit their details or click "Add Team Member" to create one</Text>
                  </Box>
                )}
              </Box>
            </Flex>
          </VStack>
        )}

        {activeTab === 'equipment' && (
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
              <Heading size="lg" color="white">Equipment Settings</Heading>
              <UIButton 
                colorScheme="brand" 
                size="sm"
                onClick={() => {
                  setIsCreatingNew(true);
                  setSelectedEquipment(null);
                }}
              >
                + Add Equipment
              </UIButton>
            </HStack>

            <Flex gap={6}>
              {/* Equipment List */}
              <Box w="300px">
                <Text fontWeight="bold" mb={3} color="gray.300">Equipment Inventory</Text>
                <VStack spacing={2} align="stretch">
                  {equipment.map(item => (
                    <Box
                      key={item.id}
                      p={3}
                      bg={selectedEquipment?.id === item.id ? "purple.600" : "#2D2D44"}
                      border="1px solid"
                      borderColor={selectedEquipment?.id === item.id ? "purple.400" : "#4A4A5E"}
                      borderRadius="md"
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ bg: "purple.500" }}
                      onClick={() => setSelectedEquipment(item)}
                    >
                      <Text fontWeight="bold" color="white" fontSize="sm">{item.name}</Text>
                      <Text color="gray.400" fontSize="xs">{item.type}</Text>
                      <Text color="gray.500" fontSize="xs">
                        Project: {item.currentProjectId || 'Available'}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </Box>

              {/* Equipment Details Form */}
              <Box flex="1" bg="#2D2D44" p={4} borderRadius="md">
                {isCreatingNew && activeTab === 'equipment' ? (
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="white">Add New Equipment</Heading>

                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Equipment Name *</Text>
                        <UIInput
                          value={newEquipmentData.name} 
                          onChange={(e) => setNewEquipmentData({...newEquipmentData, name: e.target.value})}
                          bg="#1E1E2F" 
                          color="white" 
                          placeholder="e.g. Excavator CAT-320"
                        />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Type/Category *</Text>
                        <UISelect 
                          bg="#1E1E2F" 
                          color="white" 
                          value={newEquipmentData.type}
                          onChange={(e) => setNewEquipmentData({...newEquipmentData, type: e.target.value})}
                        >
                          <option style={{background: '#1E1E2F'}} value="Heavy Machinery">Heavy Machinery</option>
                          <option style={{background: '#1E1E2F'}} value="Construction Tools">Construction Tools</option>
                          <option style={{background: '#1E1E2F'}} value="Safety Equipment">Safety Equipment</option>
                          <option style={{background: '#1E1E2F'}} value="Vehicles">Vehicles</option>
                        </UISelect>
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Serial Number</Text>
                        <UIInput
                          value={newEquipmentData.serialNumber} 
                          onChange={(e) => setNewEquipmentData({...newEquipmentData, serialNumber: e.target.value})}
                          placeholder="SN-123456" 
                          bg="#1E1E2F" 
                          color="white" 
                        />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Condition</Text>
                        <UISelect 
                          bg="#1E1E2F" 
                          color="white"
                          value={newEquipmentData.condition}
                          onChange={(e) => setNewEquipmentData({...newEquipmentData, condition: e.target.value})}
                        >
                          <option style={{background: '#1E1E2F'}} value="Excellent">Excellent</option>
                          <option style={{background: '#1E1E2F'}} value="Good">Good</option>
                          <option style={{background: '#1E1E2F'}} value="Fair">Fair</option>
                          <option style={{background: '#1E1E2F'}} value="Needs Maintenance">Needs Maintenance</option>
                        </UISelect>
                      </Box>
                    </SimpleGrid>

                    <HStack>
                      <UIButton 
                        colorScheme="purple" 
                        onClick={handleCreateEquipment}
                        isDisabled={!newEquipmentData.name || !newEquipmentData.type}
                      >
                        Add Equipment
                      </UIButton>
                      <UIButton 
                        variant="outline" 
                        onClick={() => setIsCreatingNew(false)}
                      >
                        Cancel
                      </UIButton>
                    </HStack>
                  </VStack>
                ) : selectedEquipment ? (
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="white">Edit: {selectedEquipment.name}</Heading>

                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Equipment Name</Text>
                        <UIInput value={selectedEquipment.name} bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Type/Category</Text>
                        <UISelect bg="#1E1E2F" color="white" value={selectedEquipment.type}>
                          <option style={{background: '#1E1E2F'}} value="Heavy Machinery">Heavy Machinery</option>
                          <option style={{background: '#1E1E2F'}} value="Construction Tools">Construction Tools</option>
                          <option style={{background: '#1E1E2F'}} value="Safety Equipment">Safety Equipment</option>
                          <option style={{background: '#1E1E2F'}} value="Vehicles">Vehicles</option>
                        </UISelect>
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Serial Number</Text>
                        <UIInput value={selectedEquipment.serialNumber || ""} bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Purchase Date</Text>
                        <UIInput type="date" bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Warranty Expires</Text>
                        <UIInput type="date" bg="#1E1E2F" color="white" />
                      </Box>

                      <Box>
                        <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Condition</Text>
                        <UISelect bg="#1E1E2F" color="white">
                          <option style={{background: '#1E1E2F'}} value="Excellent">Excellent</option>
                          <option style={{background: '#1E1E2F'}} value="Good">Good</option>
                          <option style={{background: '#1E1E2F'}} value="Fair">Fair</option>
                          <option style={{background: '#1E1E2F'}} value="Needs Maintenance">Needs Maintenance</option>
                        </UISelect>
                      </Box>
                    </SimpleGrid>

                    <Box>
                      <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={1}>Maintenance Notes</Text>
                      <UITextarea placeholder="Maintenance history and notes..." bg="#1E1E2F" color="white" rows={3} />
                    </Box>

                    <HStack>
                      <UIButton colorScheme="purple">Save Changes</UIButton>
                      <UIButton variant="outline">Cancel</UIButton>
                      <Spacer />
                      <UIButton colorScheme="red" variant="outline">Remove EquipmentRemove Equipment</UIButton>
                    </HStack>
                  </VStack>
                ) : (
                  <Box textAlign="center" py={12}>
                    <Text color="gray.400">Select equipment to edit its details or click "Add Equipment" to create one</Text>
                  </Box>
                )}
              </Box>
            </Flex>
          </VStack>
        )}

        {activeTab === 'company-contacts' && (
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
              <Heading size="lg" color="white">Company Contacts</Heading>
              <UIButton colorScheme="brand" size="sm">+ Add Contact+ Add Contact</UIButton>
            </HStack>

            <SimpleGrid columns={2} spacing={6}>
              <Box bg="#2D2D44" p={4} borderRadius="md">
                <Text fontWeight="bold" color="white" mb={3}>Key Personnel</Text>
                <VStack spacing={3} align="stretch">
                  <Box p={3} bg="#1E1E2F" borderRadius="md">
                    <Text fontWeight="bold" color="white" fontSize="sm">CEO - John Anderson</Text>
                    <Text color="gray.400" fontSize="xs">j.anderson@company.com</Text>
                    <Text color="gray.400" fontSize="xs">(555) 001-1001</Text>
                  </Box>
                  <Box p={3} bg="#1E1E2F" borderRadius="md">
                    <Text fontWeight="bold" color="white" fontSize="sm">Operations Manager - Sarah Wilson</Text>
                    <Text color="gray.400" fontSize="xs">s.wilson@company.com</Text>
                    <Text color="gray.400" fontSize="xs">(555) 001-1002</Text>
                  </Box>
                  <Box p={3} bg="#1E1E2F" borderRadius="md">
                    <Text fontWeight="bold" color="white" fontSize="sm">Safety Director - Mike Johnson</Text>
                    <Text color="gray.400" fontSize="xs">m.johnson@company.com</Text>
                    <Text color="gray.400" fontSize="xs">(555) 001-1003</Text>
                  </Box>
                </VStack>
              </Box>

              <Box bg="#2D2D44" p={4} borderRadius="md">
                <Text fontWeight="bold" color="white" mb={3}>Vendors & Suppliers</Text>
                <VStack spacing={3} align="stretch">
                  <Box p={3} bg="#1E1E2F" borderRadius="md">
                    <Text fontWeight="bold" color="white" fontSize="sm">ABC Equipment Rentals</Text>
                    <Text color="gray.400" fontSize="xs">rentals@abcequipment.com</Text>
                    <Text color="gray.400" fontSize="xs">(555) 200-2001</Text>
                  </Box>
                  <Box p={3} bg="#1E1E2F" borderRadius="md">
                    <Text fontWeight="bold" color="white" fontSize="sm">Materials Plus Supply</Text>
                    <Text color="gray.400" fontSize="xs">orders@materialsplus.com</Text>
                    <Text color="gray.400" fontSize="xs">(555) 200-2002</Text>
                  </Box>
                  <Box p={3} bg="#1E1E2F" borderRadius="md">
                    <Text fontWeight="bold" color="white" fontSize="sm">Safety First Solutions</Text>
                    <Text color="gray.400" fontSize="xs">info@safetyfirst.com</Text>
                    <Text color="gray.400" fontSize="xs">(555) 200-2003</Text>
                  </Box>
                </VStack>
              </Box>
            </SimpleGrid>

            <Box bg="#2D2D44" p={4} borderRadius="md">
              <Text fontWeight="bold" color="white" mb={3}>Emergency Contacts</Text>
              <SimpleGrid columns={3} spacing={4}>
                <Box p={3} bg="#1E1E2F" borderRadius="md" border="2px solid red.400">
                  <Text fontWeight="bold" color="red.300" fontSize="sm">Emergency Services</Text>
                  <Text color="white" fontSize="lg" fontWeight="bold">911</Text>
                </Box>
                <Box p={3} bg="#1E1E2F" borderRadius="md">
                  <Text fontWeight="bold" color="white" fontSize="sm">Site Security</Text>
                  <Text color="gray.400" fontSize="xs">(555) 911-1111</Text>
                </Box>
                <Box p={3} bg="#1E1E2F" borderRadius="md">
                  <Text fontWeight="bold" color="white" fontSize="sm">Medical Emergency</Text>
                  <Text color="gray.400" fontSize="xs">(555) 911-1112</Text>
                </Box>
              </SimpleGrid>
            </Box>
          </VStack>
        )}

        {activeTab === 'project-contacts' && (
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between">
              <Heading size="lg" color="white">Project Contacts</Heading>
              <UIButton colorScheme="brand" size="sm">+ Add Project Contact+ Add Project Contact</UIButton>
            </HStack>

            <VStack spacing={4} align="stretch">
              {projects.map(project => (
                <Box key={project.id} bg="#2D2D44" p={4} borderRadius="md">
                  <Text fontWeight="bold" color="white" mb={3} fontSize="lg">{project.name}</Text>

                  <SimpleGrid columns={3} spacing={4}>
                    <Box>
                      <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={2}>Project Manager</Text>
                      <Box p={3} bg="#1E1E2F" borderRadius="md">
                        <Text fontWeight="bold" color="white" fontSize="sm">David Martinez</Text>
                        <Text color="gray.400" fontSize="xs">d.martinez@company.com</Text>
                        <Text color="gray.400" fontSize="xs">(555) 300-3001</Text>
                      </Box>
                    </Box>

                    <Box>
                      <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={2}>Site Supervisor</Text>
                      <Box p={3} bg="#1E1E2F" borderRadius="md">
                        <Text fontWeight="bold" color="white" fontSize="sm">Lisa Chen</Text>
                        <Text color="gray.400" fontSize="xs">l.chen@company.com</Text>
                        <Text color="gray.400" fontSize="xs">(555) 300-3002</Text>
                      </Box>
                    </Box>

                    <Box>
                      <Text fontWeight="bold" color="gray.300" fontSize="sm" mb={2}>Client Contact</Text>
                      <Box p={3} bg="#1E1E2F" borderRadius="md">
                        <Text fontWeight="bold" color="white" fontSize="sm">Robert Taylor</Text>
                        <Text color="gray.400" fontSize="xs">r.taylor@client.com</Text>
                        <Text color="gray.400" fontSize="xs">(555) 400-4001</Text>
                      </Box>
                    </Box>
                  </SimpleGrid>
                </Box>
              ))}
            </VStack>
          </VStack>
        )}
      </Box>
    </Box>
  );
}

/** ======= Simple Project Profile Component ======= **/
function ProjectProfilePage() {
  const { navigateToDashboard, currentProjectId } = useNavigation();
  const { projects } = useApp();

  const project = projects.find(p => p.id === currentProjectId);

  return (
    <Box p={6}>
      <UIButton onClick={navigateToDashboard} mb={4}>
        ← Back to Dashboard
      </UIButton>
      <Heading mb={4}>Project Profile</Heading>
      {project ? (
        <VStack align="start" spacing={4}>
          <Text><strong>Name:</strong> {project.name}</Text>
          <Text><strong>Location:</strong> {project.location}</Text>
          <Text><strong>Status:</strong> {project.status}</Text>
          <Text><strong>Progress:</strong> {project.progress}%</Text>
        </VStack>
      ) : (
        <Text>Project not found</Text>
      )}
    </Box>
  );
}

/** ======= Individual Settings Pages ======= **/
function ProjectSettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showAddProject, setShowAddProject] = useState(false);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const projectForm = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      projectNumber: "",
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "planning",
      location: "",
      budget: 0,
      supervisorId: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      return apiRequest("/api/projects", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      projectForm.reset();
      setShowAddProject(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <SettingsIcon className="w-6 h-6 mr-3" />
          <h1 className="text-2xl font-bold">Project Settings</h1>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>Create and manage construction projects</CardDescription>
              </div>
              <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
                <DialogTrigger asChild>
                  <UIButton data-testid="button-add-project">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </UIButton>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Project</DialogTitle>
                    <DialogDescription>
                      Add a new construction or demolition project with GPS location and details.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={projectForm.handleSubmit((data) => createProjectMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="projectNumber">Project Number</Label>
                        <UIInput
                          {...projectForm.register("projectNumber")} 
                          placeholder="PROJ-001" 
                          data-testid="input-new-project-number" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Project Name</Label>
                        <UIInput
                          {...projectForm.register("name")} 
                          placeholder="Downtown Office Complex" 
                          data-testid="input-new-project-name" 
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <UITextarea 
                        {...projectForm.register("description")} 
                        placeholder="Project details and scope of work..."
                        className="min-h-[100px]" 
                        data-testid="input-new-project-description" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <UIInput
                          {...projectForm.register("startDate")} 
                          type="date" 
                          data-testid="input-new-project-start-date" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <UIInput
                          {...projectForm.register("endDate")} 
                          type="date" 
                          data-testid="input-new-project-end-date" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <UIInput
                          {...projectForm.register("location")} 
                          placeholder="123 Main St, City, State" 
                          data-testid="input-new-project-location" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="budget">Budget ($)</Label>
                        <UIInput
                          {...projectForm.register("budget", { valueAsNumber: true })} 
                          type="number" 
                          placeholder="250000" 
                          data-testid="input-new-project-budget" 
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <UIButton
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddProject(false)}
                        data-testid="button-cancel-project"
                      >
                        Cancel
                      </UIButton>
                      <UIButton 
                        type="submit" 
                        disabled={createProjectMutation.isPending}
                        data-testid="button-create-project"
                      >
                        {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                      </UIButton>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{project.name}</h3>
                      <UIBadge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </UIBadge>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{project.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>📍 {project.location || 'Location TBD'}</span>
                      <span>💰 ${project.budget?.toLocaleString() || 'Budget TBD'}</span>
                      <span>📅 {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Start TBD'}</span>
                    </div>
                  </div>
                  <UIButton variant="ghost" size="sm" data-testid={`button-edit-project-${project.id}`}>
                    <Edit className="w-4 h-4" />
                  </UIButton>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmployeeProfilesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const employeeForm = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      role: "",
      email: "",
      phone: "",
      skills: [],
    },
  });

  const employeeUpdateForm = useForm<UpdateEmployee>({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      name: "",
      role: "",
      email: "",
      phone: "",
      skills: [],
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      return apiRequest("/api/employees", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Success",
        description: "Employee created successfully",
      });
      employeeForm.reset();
      setShowAddEmployee(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create employee",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEmployee }) => {
      return apiRequest(`/api/employees/${id}`, { method: "PATCH", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      setSelectedEmployee(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <SettingsIcon className="w-6 h-6 mr-3" />
          <h1 className="text-2xl font-bold">Employee Profiles</h1>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Manage employee profiles and skills</CardDescription>
              </div>
              <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
                <DialogTrigger asChild>
                  <UIButton data-testid="button-add-employee">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employee
                  </UIButton>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add New Employee</DialogTitle>
                    <DialogDescription>
                      Create a new employee profile with contact information and skills.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={employeeForm.handleSubmit((data) => createEmployeeMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <UIInput
                          {...employeeForm.register("name")} 
                          placeholder="John Smith" 
                          data-testid="input-new-employee-name" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <UIInput
                          {...employeeForm.register("role")} 
                          placeholder="Heavy Equipment Operator" 
                          data-testid="input-new-employee-role" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <UIInput
                          {...employeeForm.register("email")} 
                          type="email" 
                          placeholder="john@company.com" 
                          data-testid="input-new-employee-email" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <UIInput
                          {...employeeForm.register("phone")} 
                          placeholder="(555) 123-4567" 
                          data-testid="input-new-employee-phone" 
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <UIButton
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddEmployee(false)}
                        data-testid="button-cancel-employee"
                      >
                        Cancel
                      </UIButton>
                      <UIButton 
                        type="submit" 
                        disabled={createEmployeeMutation.isPending}
                        data-testid="button-create-employee"
                      >
                        {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
                      </UIButton>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{emp.name}</h3>
                      <UIBadge>{emp.role}</UIBadge>
                      {emp.currentProjectId && <UIBadge variant="outline">Assigned</UIBadge>}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>📧 {emp.email || 'No email'}</span>
                      <span>📞 {emp.phone || 'No phone'}</span>
                    </div>
                    {emp.skills && emp.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {emp.skills.map((skill, index) => (
                          <UIBadge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </UIBadge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <UIButton 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedEmployee(emp);
                          employeeUpdateForm.reset({
                            name: emp.name,
                            role: emp.role,
                            email: emp.email || "",
                            phone: emp.phone || "",
                            skills: emp.skills || [],
                          });
                        }}
                        data-testid={`button-edit-employee-${emp.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </UIButton>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Edit Employee</DialogTitle>
                        <DialogDescription>
                          Update employee information and skills.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={employeeUpdateForm.handleSubmit((data) => 
                        updateEmployeeMutation.mutate({ id: emp.id, data })
                      )} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Full Name</Label>
                            <UIInput
                              {...employeeUpdateForm.register("name")} 
                              placeholder="John Smith" 
                              data-testid="input-edit-employee-name" 
                            />
                          </div>
                          <div>
                            <Label htmlFor="role">Role</Label>
                            <UIInput
                              {...employeeUpdateForm.register("role")} 
                              placeholder="Heavy Equipment Operator" 
                              data-testid="input-edit-employee-role" 
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <UIInput
                              {...employeeUpdateForm.register("email")} 
                              type="email" 
                              placeholder="john@company.com" 
                              data-testid="input-edit-employee-email" 
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <UIInput
                              {...employeeUpdateForm.register("phone")} 
                              placeholder="(555) 123-4567" 
                              data-testid="input-edit-employee-phone" 
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                          <UIButton
                            type="submit"
                            disabled={updateEmployeeMutation.isPending}
                            data-testid="button-update-employee"
                          >
                            {updateEmployeeMutation.isPending ? "Updating..." : "Update Employee"}
                          </UIButton>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EquipmentManagementPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const equipmentForm = useForm<InsertEquipment>({
    resolver: zodResolver(insertEquipmentSchema),
    defaultValues: {
      name: "",
      type: "",
      make: "",
      model: "",
      assetNumber: "",
      serialNumber: "",
      status: "available",
    },
  });

  const equipmentUpdateForm = useForm<UpdateEquipment>({
    resolver: zodResolver(updateEquipmentSchema),
    defaultValues: {
      make: "",
      model: "",
      assetNumber: "",
      status: "available",
    },
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async (data: InsertEquipment) => {
      return apiRequest("POST", "/api/equipment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Success",
        description: "Equipment created successfully",
      });
      equipmentForm.reset();
      setShowAddEquipment(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create equipment",
        variant: "destructive",
      });
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEquipment }) => {
      return apiRequest(`/api/equipment/${id}`, { method: "PATCH", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Success",
        description: "Equipment updated successfully",
      });
      setSelectedEquipment(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update equipment",
        variant: "destructive",
      });
    },
  });

  const exportToExcel = () => {
    // Implementation will be added if needed
    toast({
      title: "Export Started",
      description: "Equipment data export to Excel initiated",
    });
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus(null);

      // Read the file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Get first worksheet
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length <= 1) {
        throw new Error('No data found in the Excel file');
      }

      // Get headers from first row
      const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());

      // Process each row of data
      const equipmentToCreate: InsertEquipment[] = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        try {
          // Map row data to equipment object with flexible column mapping
          const equipmentData: Partial<InsertEquipment> = {
            name: '',
            type: '',
            status: 'available' as const
          };

          // Flexible mapping for different possible column names
          headers.forEach((header, index) => {
            const value = row[index] ? String(row[index]).trim() : '';
            if (!value) return;

            // Map common column names to equipment fields
            if (header.includes('name') || header.includes('equipment') || header === 'item') {
              equipmentData.name = value;
            } else if (header.includes('type') || header.includes('category')) {
              equipmentData.type = value;
            } else if (header.includes('make') || header.includes('manufacturer')) {
              equipmentData.make = value;
            } else if (header.includes('model')) {
              equipmentData.model = value;
            } else if (header.includes('asset') || header.includes('tag')) {
              equipmentData.assetNumber = value;
            } else if (header.includes('serial')) {
              equipmentData.serialNumber = value;
            } else if (header.includes('status') || header.includes('condition')) {
              // Map status values
              const lowerStatus = value.toLowerCase();
              if (lowerStatus.includes('available') || lowerStatus.includes('ready')) {
                equipmentData.status = 'available';
              } else if (lowerStatus.includes('use') || lowerStatus.includes('active')) {
                equipmentData.status = 'in-use';
              } else if (lowerStatus.includes('maintenance') || lowerStatus.includes('repair')) {
                equipmentData.status = 'maintenance';
              } else if (lowerStatus.includes('broken') || lowerStatus.includes('damaged')) {
                equipmentData.status = 'broken';
              }
            }
          });

          // Ensure required fields have values - create equipment even with minimal data
          if (!equipmentData.name || equipmentData.name.length === 0) {
            // Use type or a generic name if name is missing
            equipmentData.name = equipmentData.type || `Equipment ${i}`;
          }

          if (!equipmentData.type || equipmentData.type.length === 0) {
            equipmentData.type = 'General Equipment';
          }

          equipmentToCreate.push(equipmentData as InsertEquipment);
          successCount++;

        } catch (rowError) {
          console.warn(`Error processing row ${i}:`, rowError);
          errorCount++;
        }
      }

      // Create equipment profiles
      for (const equipmentData of equipmentToCreate) {
        try {
          await createEquipmentMutation.mutateAsync(equipmentData);
        } catch (createError) {
          console.warn('Error creating equipment:', createError);
          errorCount++;
          successCount--;
        }
      }

      // Show results
      if (successCount > 0) {
        setImportStatus({ 
          type: 'success', 
          message: `Successfully imported ${successCount} equipment profiles${errorCount > 0 ? ` (${errorCount} rows had issues)` : ''}` 
        });

        toast({
          title: "Import Successful",
          description: `Created ${successCount} equipment profiles from Excel file`,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      } else {
        throw new Error('No equipment profiles could be created from the Excel file');
      }

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Auto-dismiss status after 8 seconds
      setTimeout(() => setImportStatus(null), 8000);

    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Import failed';

      setImportStatus({ type: 'error', message: errorMessage });

      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Clear file input on error too
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Auto-dismiss error after 10 seconds
      setTimeout(() => setImportStatus(null), 10000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <SettingsIcon className="w-6 h-6 mr-3" />
          <h1 className="text-2xl font-bold">Equipment Management</h1>
        </div>

        {/* Bulk Equipment Management */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle>Bulk Equipment Management</CardTitle>
            <CardDescription>Import and export equipment data via Excel files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <UIButton onClick={exportToExcel} variant="outline" data-testid="button-export-equipment">
                <Download className="w-4 h-4 mr-2" />
                Export to Excel
              </UIButton>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileImport}
                  className="hidden"
                  data-testid="input-import-equipment"
                />
                <UIButton
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  data-testid="button-import-equipment"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import from Excel
                </UIButton>
              </div>
            </div>
            {importStatus && (
              <UIAlert className={`mt-4 ${importStatus.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
                <AlertTriangle className="h-4 w-4" />
                <UIAlertDescription>{importStatus.message}</UIAlertDescription>
              </UIAlert>
            )}
          </CardContent>
        </Card>

        {/* Equipment Management */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Equipment Management</CardTitle>
                <CardDescription>Manage construction and demolition equipment</CardDescription>
              </div>
              <Dialog open={showAddEquipment} onOpenChange={setShowAddEquipment}>
                <DialogTrigger asChild>
                  <UIButton data-testid="button-add-equipment">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Equipment
                  </UIButton>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add New Equipment</DialogTitle>
                    <DialogDescription>
                      Add new construction or demolition equipment to inventory.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={equipmentForm.handleSubmit((data) => createEquipmentMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Equipment Name</Label>
                        <UIInput
                          {...equipmentForm.register("name")} 
                          placeholder="Excavator CAT-320" 
                          data-testid="input-new-equipment-name" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <UIInput
                          {...equipmentForm.register("type")} 
                          placeholder="Excavator" 
                          data-testid="input-new-equipment-type" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="make">Make</Label>
                        <UIInput
                          {...equipmentForm.register("make")} 
                          placeholder="Caterpillar" 
                          data-testid="input-new-equipment-make" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <UIInput
                          {...equipmentForm.register("model")} 
                          placeholder="320" 
                          data-testid="input-new-equipment-model" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="assetNumber">Asset Number</Label>
                        <UIInput
                          {...equipmentForm.register("assetNumber")} 
                          placeholder="AST-001" 
                          data-testid="input-new-equipment-asset" 
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <UIInput
                        {...equipmentForm.register("serialNumber")} 
                        placeholder="EXC-001" 
                        data-testid="input-new-equipment-serial" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <UISelect onValueChange={(value) => equipmentForm.setValue("status", value as any)}>
                        <SelectTrigger data-testid="select-new-equipment-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="in-use">In Use</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="broken">Broken</SelectItem>
                        </SelectContent>
                      </UISelect>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <UIButton
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddEquipment(false)}
                        data-testid="button-cancel-equipment"
                      >
                        Cancel
                      </UIButton>
                      <UIButton 
                        type="submit" 
                        disabled={createEquipmentMutation.isPending}
                        data-testid="button-create-equipment"
                      >
                        {createEquipmentMutation.isPending ? "Creating..." : "Create Equipment"}
                      </UIButton>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {equipment.map((eq) => (
                <div key={eq.id} className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{eq.name}</h3>
                      <UIBadge variant={eq.status === 'available' ? 'default' : 'secondary'}>
                        {eq.status}
                      </UIBadge>
                      {eq.currentProjectId && <UIBadge variant="outline">Assigned</UIBadge>}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>🔧 {eq.make} {eq.model}</span>
                      <span>📋 {eq.assetNumber}</span>
                      <span>🔢 {eq.serialNumber}</span>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <UIButton 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedEquipment(eq);
                          equipmentUpdateForm.reset({
                            make: eq.make || "",
                            model: eq.model || "",
                            assetNumber: eq.assetNumber || "",
                            status: eq.status,
                          });
                        }}
                        data-testid={`button-edit-equipment-${eq.id}`}
                      >
                        <Wrench className="w-4 h-4" />
                      </UIButton>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Edit Equipment</DialogTitle>
                        <DialogDescription>
                          Update equipment details and specifications.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={equipmentUpdateForm.handleSubmit((data) => 
                        updateEquipmentMutation.mutate({ id: eq.id, data })
                      )} className="space-y-4">
                        <div>
                          <Label htmlFor="make">Make</Label>
                          <UIInput
                            {...equipmentUpdateForm.register("make")} 
                            placeholder="Caterpillar" 
                            data-testid="input-edit-equipment-make" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="model">Model</Label>
                          <UIInput
                            {...equipmentUpdateForm.register("model")} 
                            placeholder="320" 
                            data-testid="input-edit-equipment-model" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="assetNumber">Asset Number</Label>
                          <UIInput
                            {...equipmentUpdateForm.register("assetNumber")} 
                            placeholder="AST-001" 
                            data-testid="input-edit-equipment-asset" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <UISelect onValueChange={(value) => equipmentUpdateForm.setValue("status", value as any)} value={equipmentUpdateForm.watch("status")}>
                            <SelectTrigger data-testid="select-edit-equipment-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="in-use">In Use</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="broken">Broken</SelectItem>
                            </SelectContent>
                          </UISelect>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                          <UIButton
                            type="submit"
                            disabled={updateEquipmentMutation.isPending}
                            data-testid="button-update-equipment"
                          >
                            {updateEquipmentMutation.isPending ? "Updating..." : "Update Equipment"}
                          </UIButton>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** ======= Main Content Routing ======= **/
function MainContent() {
  const { currentView } = useNavigation();

  switch (currentView) {
    case 'projects':
      return <ProjectSettingsPage />;
    case 'employees':
      return <EmployeeProfilesPage />;
    case 'equipment':
      return <EquipmentManagementPage />;
    case 'project-profile':
      return <ProjectProfilePage />;
    case 'dashboard':
    default:
      return <MainApp />;
  }
}

/** ======= Main App Component ======= **/
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading, brandConfig } = useAuth();

  if (loading) {
    return (
      <ChakraProvider theme={createTheme(defaultBrandConfig)}>
        <Box
          minH="100vh"
          bg="#121212"
          color="#E0E0E0"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text>Loading...</Text>
        </Box>
      </ChakraProvider>
    );
  }

  if (!user) {
    return (
      <ChakraProvider theme={createTheme(defaultBrandConfig)}>
        <LoginForm />
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={createTheme(brandConfig)}>
      <NavigationProvider>
        <ProjectFilterProvider>
          <AppProvider>
            <Box minH="100vh" bg="#121212" color="#E0E0E0">
              <Header />
              <MainContent />
            </Box>
          </AppProvider>
        </ProjectFilterProvider>
      </NavigationProvider>
    </ChakraProvider>
  );
}

export default App;