import React, { useEffect, useState, createContext, useContext } from "react";
import {
  ChakraProvider,
  extendTheme,
  Box,
  Flex,
  Heading,
  Image,
  HStack,
  Spacer,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button
} from "@chakra-ui/react";
import { SettingsIcon } from "@chakra-ui/icons";
import { Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import pages
import Dashboard from "./pages/dashboard";
import Settings from "./pages/settings";
import AcceptInvite from "./pages/AcceptInvite";

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

/** ======= App Provider ======= **/
function AppProvider({ children }: { children: React.ReactNode }) {
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
    }, 15000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <AppContext.Provider value={{
      conflicts,
      alertDismissed,
      setAlertDismissed
    }}>
      {children}
    </AppContext.Provider>
  );
}

/** ======= Main Layout Component ======= **/
function MainLayout() {
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
          <Image src={defaultBrandConfig.logoUrl} alt="Logo" boxSize="40px" />
          <Heading size="md" color={defaultBrandConfig.primaryColor}>
            {defaultBrandConfig.appName}
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
              <MenuItem bg="#1E1E2F" _hover={{ bg: "#4A4A5E" }}>
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

/** ======= Root App with Providers ======= **/
export default function App() {
  const theme = createTheme(defaultBrandConfig);

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <AppProvider>
          <MainLayout />
        </AppProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}