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
} from "@chakra-ui/react";
import { HamburgerIcon, SettingsIcon } from "@chakra-ui/icons";
import { Route, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import pages
import Dashboard from "./pages/dashboard";
import Settings from "./pages/settings";
import AcceptInvite from "./pages/AcceptInvite";

/** ======= Auth Context ======= **/
const AuthContext = createContext<any>(null);
export function useAuth() {
  return useContext(AuthContext);
}

/** ======= App Context ======= **/
const AppContext = createContext<any>(null);
export function useApp() {
  return useContext(AppContext);
}

/** ======= Default Brand Config ======= **/
const defaultBrandConfig = {
  appName: "OpsSync.ai",
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

/** ======= Conflict Polling Hook ======= **/
function useConflictPolling(interval = 15000) {
  const [conflicts, setConflicts] = useState<any>({ employeeConflicts: [], equipmentConflicts: [] });
  const [alertDismissed, setAlertDismissed] = useState(false);

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

  return { conflicts, alertDismissed, setAlertDismissed };
}

/** ======= Auth Provider ======= **/
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [brandConfig, setBrandConfig] = useState(defaultBrandConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  return (
    <AuthContext.Provider value={{
      user,
      brandConfig,
      login,
      register,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/** ======= App Provider ======= **/
function AppProvider({ children }: { children: React.ReactNode }) {
  const conflictData = useConflictPolling();

  return (
    <AppContext.Provider value={conflictData}>
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
            {isRegister ? "Create Account" : `Welcome to ${defaultBrandConfig.appName}`}
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

/** ======= Main Layout Component ======= **/
function MainLayout() {
  const { brandConfig, logout } = useAuth();
  const [location, navigate] = useLocation();
  
  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/" },
    { id: "settings", label: "Settings", path: "/settings" },
  ];

  return (
    <Box bg="#121212" color="#E0E0E0" minH="100vh">
      {/* Header */}
      <Flex
        bg="#1E1E2F"
        p={4}
        alignItems="center"
        borderBottom="1px solid #4A4A5E"
      >
        <HStack spacing={3}>
          <Image src={brandConfig.logoUrl} alt="Logo" boxSize="40px" />
          <Heading size="md" color={brandConfig.primaryColor}>
            {brandConfig.appName}
          </Heading>
        </HStack>
        
        <Spacer />
        
        {/* Navigation */}
        <HStack spacing={4}>
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={location === item.path ? "solid" : "ghost"}
              colorScheme={location === item.path ? "blue" : "gray"}
              size="sm"
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </Button>
          ))}
          
          <Menu>
            <MenuButton as={IconButton} icon={<SettingsIcon />} variant="ghost" />
            <MenuList bg="#1E1E2F" borderColor="#4A4A5E">
              <MenuItem onClick={logout} bg="#1E1E2F" _hover={{ bg: "#4A4A5E" }}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Content */}
      <Box>
        <Route path="/accept-invite" component={AcceptInvite} />
        <Route path="/settings" component={Settings} />
        <Route path="/" component={Dashboard} />
      </Box>
    </Box>
  );
}

/** ======= Query Client ======= **/
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

/** ======= Main App Component ======= **/
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        minH="100vh"
        bg="#121212"
        color="#E0E0E0"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        Loading...
      </Box>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

/** ======= Root App with Providers ======= **/
export default function RootApp() {
  const theme = createTheme(defaultBrandConfig);

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}