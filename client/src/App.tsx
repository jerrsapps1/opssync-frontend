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
import { ObjectUploader } from "./components/ObjectUploader";

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
          <Button colorScheme="blue" mr={3} onClick={handleSave}>
            Save Changes
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
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
            variant={currentView === 'dashboard' ? 'solid' : 'ghost'}
            colorScheme={currentView === 'dashboard' ? 'blue' : 'whiteAlpha'}
            size="sm"
            onClick={navigateToDashboard}
          >
            Dashboard
          </Button>
          
          <Button
            variant={currentView === 'settings' ? 'solid' : 'ghost'}
            colorScheme={currentView === 'settings' ? 'blue' : 'whiteAlpha'}
            size="sm"
            onClick={navigateToSettings}
          >
            Settings
          </Button>

          <Button
            variant="ghost"
            colorScheme="whiteAlpha"
            size="sm"
            onClick={onOpen}
            leftIcon={<SettingsIcon />}
          >
            Brand Config
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
                Brand Settings
              </MenuItem>
              <MenuItem 
                onClick={navigateToSettings}
                bg="#1E1E2F"
                _hover={{ bg: "brand.600" }}
              >
                System Settings
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
          <Button size="xs" variant="outline" onClick={clearSelection}>
            Show All
          </Button>
        )}
      </HStack>
      
      <VStack align="start" spacing={2}>
        {projects.map((proj: any) => (
          <Box
            key={proj.id}
            px={3}
            py={2}
            bg={selectedProjectId === proj.id ? "brand.500" : "brand.600"}
            border="2px solid"
            borderColor={selectedProjectId === proj.id ? "brand.300" : "transparent"}
            rounded="md"
            width="100%"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ bg: selectedProjectId === proj.id ? "brand.400" : "brand.500" }}
            onClick={() => handleProjectClick(proj)}
            onDoubleClick={() => navigateToProject(proj.id)}
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
              <Text fontSize="xs" color="gray.300">
                {proj.status}
              </Text>
            </VStack>
          </Box>
        ))}
      </VStack>
      
      <Text fontSize="xs" color="gray.500" mt={3} textAlign="center">
        Click to filter • Double-click for details
      </Text>
    </Box>
  );
}

/** ======= Employee List (Center Panel) ======= **/
function EmployeeList() {
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
                {selectedProjectId === projId && (
                  <Text fontSize="xs" color="brand.200" fontWeight="bold">
                    SELECTED PROJECT
                  </Text>
                )}
              </HStack>
              
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
                      cursor="grab"
                      _active={{ cursor: "grabbing" }}
                      transition="all 0.2s"
                      position="relative"
                    >
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="sm">{emp.name}</Text>
                          <Text fontSize="xs" color="gray.300">{emp.role}</Text>
                        </VStack>
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
function EquipmentList() {
  const { equipment, projects } = useApp();
  const { selectedProjectId } = useProjectFilter();

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

  // Filter groups based on selected project
  const filteredGroups = selectedProjectId 
    ? { [selectedProjectId]: grouped[selectedProjectId] || [] }
    : grouped;

  // Count filtered equipment
  const filteredCount = Object.values(filteredGroups).reduce((total: number, eqs: any) => total + eqs.length, 0);

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
              (Filtered: {filteredCount})
            </Text>
          )}
        </Heading>
        {selectedProjectId && filteredCount === 0 && (
          <Text fontSize="xs" color="yellow.400">
            No equipment assigned
          </Text>
        )}
      </HStack>
      
      {Object.entries(filteredGroups).map(([projId, eqs]: [string, any]) => (
        <Droppable key={projId} droppableId={`equipment-${projId}`}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              mb={6}
              p={3}
              bg={snapshot.isDraggingOver ? "purple.800" : "#2A2A3D"}
              border="2px dashed"
              borderColor={snapshot.isDraggingOver ? "purple.400" : "#4A4A5E"}
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
                {selectedProjectId === projId && (
                  <Text fontSize="xs" color="purple.200" fontWeight="bold">
                    SELECTED PROJECT
                  </Text>
                )}
              </HStack>
              
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
                      bg={snapshot.isDragging ? "purple.500" : "#BB86FC"}
                      rounded="md"
                      boxShadow={snapshot.isDragging ? "lg" : "sm"}
                      color="white"
                      userSelect="none"
                      cursor="grab"
                      _active={{ cursor: "grabbing" }}
                      transition="all 0.2s"
                      position="relative"
                    >
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="sm">{eq.name}</Text>
                          <Text fontSize="xs" color="gray.300">{eq.type}</Text>
                        </VStack>
                        {selectedProjectId && eq.currentProjectId === selectedProjectId && (
                          <Box
                            bg="purple.400"
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
              
              {eqs.length === 0 && (
                <Text color="gray.500" fontSize="sm" fontStyle="italic" textAlign="center" py={2}>
                  No equipment {projId === "unassigned" ? "unassigned" : "assigned to this project"}
                </Text>
              )}
            </Box>
          )}
        </Droppable>
      ))}
      
      {selectedProjectId && filteredCount === 0 && (
        <Box textAlign="center" py={8} bg="#2A2A3D" rounded="md">
          <Text color="gray.400" fontSize="sm">
            No equipment assigned to this project
          </Text>
          <Text color="gray.500" fontSize="xs" mt={1}>
            Drag equipment here to assign it
          </Text>
        </Box>
      )}
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

/** ======= System Settings Page ======= **/
function SettingsPage() {
  const { navigateToDashboard } = useNavigation();
  const { projects, employees, equipment } = useApp();
  const [activeSection, setActiveSection] = useState('projects');
  
  const sections = [
    { id: 'projects', label: 'Project Management', icon: '🏗️' },
    { id: 'employees', label: 'Employee Profiles', icon: '👥' },
    { id: 'equipment', label: 'Equipment Settings', icon: '🚜' },
    { id: 'system', label: 'System Configuration', icon: '⚙️' }
  ];

  return (
    <Box p={6}>
      <HStack mb={6} spacing={4}>
        <Button onClick={navigateToDashboard} variant="outline" size="sm">
          ← Back to Dashboard
        </Button>
        <Heading>System Settings</Heading>
      </HStack>

      <Flex gap={6}>
        {/* Sidebar */}
        <Box width="250px">
          <VStack spacing={2} align="stretch">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'solid' : 'ghost'}
                justifyContent="flex-start"
                onClick={() => setActiveSection(section.id)}
                leftIcon={<Text>{section.icon}</Text>}
                size="sm"
              >
                {section.label}
              </Button>
            ))}
          </VStack>
        </Box>

        {/* Content */}
        <Box flex="1" bg="#1E1E2F" p={6} borderRadius="md">
          {activeSection === 'projects' && (
            <VStack spacing={4} align="stretch">
              <Heading size="md">Project Management</Heading>
              <Text color="gray.400">
                Manage project settings, default configurations, and project templates.
              </Text>
              
              <Box p={4} bg="#2D2D44" borderRadius="md">
                <Text fontWeight="bold" mb={2}>Active Projects: {projects.length}</Text>
                <VStack spacing={2} align="start">
                  {projects.slice(0, 5).map(project => (
                    <Text key={project.id} fontSize="sm">
                      • {project.name} - {project.status}
                    </Text>
                  ))}
                  {projects.length > 5 && (
                    <Text fontSize="sm" color="gray.500">
                      ...and {projects.length - 5} more
                    </Text>
                  )}
                </VStack>
              </Box>
            </VStack>
          )}

          {activeSection === 'employees' && (
            <VStack spacing={4} align="stretch">
              <Heading size="md">Employee Profiles</Heading>
              <Text color="gray.400">
                Configure employee settings, roles, and permissions.
              </Text>
              
              <Box p={4} bg="#2D2D44" borderRadius="md">
                <Text fontWeight="bold" mb={2}>Total Employees: {employees.length}</Text>
                <VStack spacing={2} align="start">
                  {employees.slice(0, 5).map(employee => (
                    <Text key={employee.id} fontSize="sm">
                      • {employee.name} - {employee.role}
                    </Text>
                  ))}
                  {employees.length > 5 && (
                    <Text fontSize="sm" color="gray.500">
                      ...and {employees.length - 5} more
                    </Text>
                  )}
                </VStack>
              </Box>
            </VStack>
          )}

          {activeSection === 'equipment' && (
            <VStack spacing={4} align="stretch">
              <Heading size="md">Equipment Settings</Heading>
              <Text color="gray.400">
                Manage equipment configurations, maintenance schedules, and categories.
              </Text>
              
              <Box p={4} bg="#2D2D44" borderRadius="md">
                <Text fontWeight="bold" mb={2}>Total Equipment: {equipment.length}</Text>
                <VStack spacing={2} align="start">
                  {equipment.slice(0, 5).map(item => (
                    <Text key={item.id} fontSize="sm">
                      • {item.name} - {item.status}
                    </Text>
                  ))}
                  {equipment.length > 5 && (
                    <Text fontSize="sm" color="gray.500">
                      ...and {equipment.length - 5} more
                    </Text>
                  )}
                </VStack>
              </Box>
            </VStack>
          )}

          {activeSection === 'system' && (
            <VStack spacing={4} align="stretch">
              <Heading size="md">System Configuration</Heading>
              <Text color="gray.400">
                Configure system-wide settings, notifications, and integrations.
              </Text>
              
              <VStack spacing={4} align="stretch">
                <Box p={4} bg="#2D2D44" borderRadius="md">
                  <Text fontWeight="bold" mb={2}>Conflict Detection</Text>
                  <Text fontSize="sm" color="gray.300">
                    Real-time monitoring every 15 seconds for assignment conflicts
                  </Text>
                  <Button size="xs" mt={2} variant="outline">
                    Configure Alerts
                  </Button>
                </Box>

                <Box p={4} bg="#2D2D44" borderRadius="md">
                  <Text fontWeight="bold" mb={2}>Data Backup</Text>
                  <Text fontSize="sm" color="gray.300">
                    Automatic backup of projects, employees, and equipment data
                  </Text>
                  <Button size="xs" mt={2} variant="outline">
                    Backup Settings
                  </Button>
                </Box>

                <Box p={4} bg="#2D2D44" borderRadius="md">
                  <Text fontWeight="bold" mb={2}>API Integration</Text>
                  <Text fontSize="sm" color="gray.300">
                    Connect with external systems and third-party services
                  </Text>
                  <Button size="xs" mt={2} variant="outline">
                    Manage Integrations
                  </Button>
                </Box>
              </VStack>
            </VStack>
          )}
        </Box>
      </Flex>
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