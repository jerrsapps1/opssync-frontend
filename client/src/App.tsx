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
  useToast,
} from "@chakra-ui/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

/** ======= White Label Brand Config ======= **/
const brandConfig = {
  appName: "TrackPro",
  primaryColor: "#4A90E2",
  secondaryColor: "#BB86FC",
  logoUrl:
    "https://cdn-icons-png.flaticon.com/512/2920/2920579.png", // example logo URL
};

/** ======= Chakra UI Dark Theme based on brand colors ======= **/
const theme = extendTheme({
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

/** ======= App Context ======= **/
const AppContext = createContext();
function useApp() {
  return useContext(AppContext);
}

/** ======= App Provider ======= **/
function AppProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const toast = useToast();

  // Load all data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [projRes, empRes, eqRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/employees"),
          fetch("/api/equipment"),
        ]);
        if (!projRes.ok || !empRes.ok || !eqRes.ok)
          throw new Error("Failed to load data");
        setProjects(await projRes.json());
        setEmployees(await empRes.json());
        setEquipment(await eqRes.json());
      } catch (e) {
        toast({
          title: "Error loading data",
          description: e.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    }
    fetchData();
  }, [toast]);

  // Update employee assignment (project)
  async function moveEmployee(empId, newProjectId) {
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
    } catch (e) {
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
  async function moveEquipment(eqId, newProjectId) {
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
    } catch (e) {
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

/** ======= Header with Branding ======= **/
function Header() {
  return (
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
      />
      <Heading size="md" color="white">
        {brandConfig.appName}
      </Heading>
    </Flex>
  );
}

/** ======= Project List (Left Panel) ======= **/
function ProjectList() {
  const { projects } = useApp();
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
        {projects.map((proj) => (
          <Box
            key={proj.id}
            px={3}
            py={1}
            bg="brand.600"
            rounded="md"
            width="100%"
            _hover={{ bg: "brand.500", cursor: "pointer" }}
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
  const grouped = {};
  projects.forEach((p) => (grouped[p.id] = []));
  grouped["unassigned"] = [];
  employees.forEach((emp) => {
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
      {Object.entries(grouped).map(([projId, emps]) => (
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
                  : projects.find((p) => p.id === projId)?.name}
              </Text>
              {emps.map((emp, index) => (
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
  const grouped = {};
  projects.forEach((p) => (grouped[p.id] = []));
  grouped["unassigned"] = [];
  equipment.forEach((eq) => {
    (eq.currentProjectId && grouped[eq.currentProjectId]
      ? grouped[eq.currentProjectId]
      : grouped["unassigned"]
    ).push(eq);
  });

  return (
    <Box
      width="300px"
      borderLeft="1px solid"
      borderColor="brand.700"
      p={3}
      overflowY="auto"
      bg="#1E1E2F"
    >
      <Heading size="sm" mb={3}>
        Equipment
      </Heading>
      {Object.entries(grouped).map(([projId, eqs]) => (
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
                  : projects.find((p) => p.id === projId)?.name}
              </Text>
              {eqs.map((eq, index) => (
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
                      bg={snapshot.isDragging ? "secondary" : "brand.600"}
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

/** ======= Main App with Drag & Drop ======= **/
function MainApp() {
  const { moveEmployee, moveEquipment } = useApp();

  function onDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId // same list, no move
    )
      return;

    // ID format: emp-<id> or eq-<id>
    const [type, id] = draggableId.split("-");
    const sourceParts = source.droppableId.split("-");
    const destParts = destination.droppableId.split("-");

    if (
      type === "emp" &&
      sourceParts[0] === "employee" &&
      destParts[0] === "employee"
    ) {
      const newProjectId = destParts[1] === "unassigned" ? null : destParts[1];
      moveEmployee(id, newProjectId);
    }
    if (
      type === "eq" &&
      sourceParts[0] === "equipment" &&
      destParts[0] === "equipment"
    ) {
      const newProjectId = destParts[1] === "unassigned" ? null : destParts[1];
      moveEquipment(id, newProjectId);
    }
  }

  return (
    <>
      <Header />
      <DragDropContext onDragEnd={onDragEnd}>
        <Flex height="calc(100vh - 72px)">
          <ProjectList />
          <EmployeeList />
          <EquipmentList />
        </Flex>
      </DragDropContext>
    </>
  );
}

export default function App() {
  return (
    <ChakraProvider theme={theme}>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ChakraProvider>
  );
}