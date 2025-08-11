import React, { useEffect, useState, createContext, useContext } from "react";
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
} from "@chakra-ui/react";
import { HamburgerIcon, SettingsIcon } from "@chakra-ui/icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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
      const res = await fetch(`/api/employees/${empId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProjectId: newProjectId }),
      });
      if (!res.ok) throw new Error("Failed to update employee");
      setEmployees((emps) =>
        emps.map((e) =>
          e.id === empId ? { ...e, currentProjectId: newProjectId } : e
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
      const res = await fetch(`/api/equipment/${eqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentProjectId: newProjectId }),
      });
      if (!res.ok) throw new Error("Failed to update equipment");
      setEquipment((eqs) =>
        eqs.map((e) => (e.id === eqId ? { ...e, currentProjectId: newProjectId } : e))
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

  return (
    <AppContext.Provider
      value={{ projects, employees, equipment, moveEmployee, moveEquipment }}
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
              
              <Button type="submit" colorScheme="blue" width="full">
                {isRegister ? "Create Account" : "Login"}
              </Button>
              
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

/** ======= Settings Modal ======= **/
function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { brandConfig, updateBrandConfig } = useAuth();
  const [formData, setFormData] = useState(brandConfig);
  const toast = useToast();

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="#1E1E2F" color="#E0E0E0">
        <ModalHeader>White-Label Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>App Name</FormLabel>
              <Input
                value={formData.appName}
                onChange={(e) => setFormData({...formData, appName: e.target.value})}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Primary Color</FormLabel>
              <Input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Secondary Color</FormLabel>
              <Input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Logo URL</FormLabel>
              <Input
                value={formData.logoUrl}
                onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** ======= Header with Branding and Auth ======= **/
function Header() {
  const { brandConfig, user, logout } = useAuth();
  const { navigateToSettings, navigateToDashboard, currentView } = useNavigation();
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
        <Image
          src={brandConfig.logoUrl}
          alt={`${brandConfig.appName} Logo`}
          height="40px"
          mr={4}
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
        
        <Spacer />
        
        <HStack spacing={2}>
          <Text color="white">Welcome, {user?.username}</Text>
          
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<HamburgerIcon />}
              variant="ghost"
              colorScheme="whiteAlpha"
            />
            <MenuList bg="#1E1E2F" borderColor="brand.500">
              <MenuItem 
                icon={<SettingsIcon />} 
                onClick={navigateToSettings}
                bg="#1E1E2F"
                _hover={{ bg: "brand.600" }}
              >
                Settings
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
      
      {currentView === 'dashboard' && <SettingsModal isOpen={isOpen} onClose={onClose} />}
    </>
  );
}

/** ======= Project List (Left Panel) ======= **/
function ProjectList() {
  const { projects } = useApp();
  const { navigateToProject } = useNavigation();
  
  return (
    <Box
      width="200px"
      borderRight="1px solid"
      borderColor="brand.700"
      p={3}
      overflowY="auto"
      bg="#1E1E2F"
    >
      <Heading size="sm" mb={3}>
        Projects
      </Heading>
      <VStack align="start" spacing={2}>
        {projects.map((proj: any) => (
          <Box
            key={proj.id}
            px={3}
            py={1}
            bg="brand.600"
            rounded="md"
            width="100%"
            _hover={{ bg: "brand.500", cursor: "pointer" }}
            onClick={() => navigateToProject(proj.id)}
          >
            {proj.name}
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

/** ======= Employee List (Center Panel) ======= **/
function EmployeeList() {
  const { employees, projects } = useApp();

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

  return (
    <Box flex="1" p={3} overflowY="auto">
      <Heading size="sm" mb={3}>
        Employees
      </Heading>
      {Object.entries(grouped).map(([projId, emps]: [string, any]) => (
        <Droppable key={projId} droppableId={`employee-${projId}`}>
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              mb={6}
              p={3}
              bg="#1E1E2F"
              rounded="md"
              minHeight="80px"
            >
              <Text fontWeight="bold" mb={2}>
                {projId === "unassigned"
                  ? "Unassigned"
                  : projects.find((p: any) => p.id === projId)?.name}
              </Text>
              {emps.map((emp: any, index: number) => (
                <Draggable
                  key={emp.id}
                  draggableId={`emp-${emp.id}`}
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
                      boxShadow={snapshot.isDragging ? "lg" : "sm"}
                      color="white"
                      userSelect="none"
                    >
                      {emp.name}
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      ))}
    </Box>
  );
}

/** ======= Equipment List (Right Panel) ======= **/
function EquipmentList() {
  const { equipment, projects } = useApp();

  // Group equipment by project or unassigned
  const grouped: any = {};
  projects.forEach((p: any) => (grouped[p.id] = []));
  grouped["unassigned"] = [];
  equipment.forEach((eq: any) => {
    (eq.currentProjectId && grouped[eq.currentProjectId]
      ? grouped[eq.currentProjectId]
      : grouped["unassigned"]
    ).push(eq);
  });

  return (
    <Box
      width="250px"
      borderLeft="1px solid"
      borderColor="brand.700"
      p={3}
      overflowY="auto"
      bg="#1E1E2F"
    >
      <Heading size="sm" mb={3}>
        Equipment
      </Heading>
      {Object.entries(grouped).map(([projId, eqs]: [string, any]) => (
        <Droppable key={projId} droppableId={`equipment-${projId}`}>
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              mb={6}
              p={3}
              bg="#2A2A3D"
              rounded="md"
              minHeight="80px"
            >
              <Text fontWeight="bold" mb={2}>
                {projId === "unassigned"
                  ? "Unassigned"
                  : projects.find((p: any) => p.id === projId)?.name}
              </Text>
              {eqs.map((eq: any, index: number) => (
                <Draggable
                  key={eq.id}
                  draggableId={`eq-${eq.id}`}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      p={2}
                      mb={2}
                      bg={snapshot.isDragging ? "secondary" : "#BB86FC"}
                      rounded="md"
                      boxShadow={snapshot.isDragging ? "lg" : "sm"}
                      color="white"
                      userSelect="none"
                    >
                      {eq.name}
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      ))}
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
    <Alert status="error" mb={4} onClick={handleAlertClick}>
      <AlertIcon />
      <Box flex="1">
        <AlertTitle mr={2}>Assignment Conflicts Detected!</AlertTitle>
        <AlertDescription>
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
        </AlertDescription>
      </Box>
      <CloseButton onClick={handleClose} />
    </Alert>
  );
}

/** ======= Main App Content ======= **/
function MainApp() {
  const { moveEmployee, moveEquipment } = useApp();
  const [conflicts, setConflicts] = useConflictPolling(15000);
  const [dismissedConflicts, setDismissedConflicts] = useState(false);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    if (sourceId === destId) return;

    // Extract item type and new project ID
    const [itemType, sourceProjectId] = sourceId.split("-");
    const [, destProjectId] = destId.split("-");
    const itemId = draggableId.split("-")[1];

    const newProjectId = destProjectId === "unassigned" ? null : destProjectId;

    if (itemType === "employee") {
      moveEmployee(itemId, newProjectId);
    } else if (itemType === "equipment") {
      moveEquipment(itemId, newProjectId);
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
    <Box>
      {!dismissedConflicts && (
        <ConflictAlert
          conflicts={conflicts}
          onClose={() => setDismissedConflicts(true)}
        />
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Flex height="calc(100vh - 120px)">
          <ProjectList />
          <EmployeeList />
          <EquipmentList />
        </Flex>
      </DragDropContext>
    </Box>
  );
}

/** ======= Simple Settings Component ======= **/
function SettingsPage() {
  const { navigateToDashboard } = useNavigation();
  
  return (
    <Box p={6}>
      <Button onClick={navigateToDashboard} mb={4}>
        ← Back to Dashboard
      </Button>
      <Heading mb={4}>Settings</Heading>
      <Text>Settings page is under construction. Use the hamburger menu Settings for brand configuration.</Text>
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
      <Button onClick={navigateToDashboard} mb={4}>
        ← Back to Dashboard
      </Button>
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

/** ======= Main Content Routing ======= **/
function MainContent() {
  const { currentView } = useNavigation();

  switch (currentView) {
    case 'settings':
      return <SettingsPage />;
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
        <AppProvider>
          <Box minH="100vh" bg="#121212" color="#E0E0E0">
            <Header />
            <MainContent />
          </Box>
        </AppProvider>
      </NavigationProvider>
    </ChakraProvider>
  );
}

export default App;