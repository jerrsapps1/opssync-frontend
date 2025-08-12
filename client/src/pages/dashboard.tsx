import React from "react";
import { 
  Box, 
  Flex, 
  VStack, 
  Text, 
  Heading, 
  HStack
} from "@chakra-ui/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useApp } from "../App";
import { EmployeeList } from "../components/assignments/employee-list";
import { EquipmentList } from "../components/assignments/equipment-list";

/** ======= Project Filter Context ======= **/
const ProjectFilterContext = React.createContext<any>(null);
export function useProjectFilter() {
  return React.useContext(ProjectFilterContext);
}

export function ProjectFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  
  return (
    <ProjectFilterContext.Provider value={{ selectedProjectId, setSelectedProjectId }}>
      {children}
    </ProjectFilterContext.Provider>
  );
}

/** ======= Project List (Left Panel) ======= **/
function ProjectList() {
  const appContext = useApp();
  const { selectedProjectId, setSelectedProjectId } = useProjectFilter();
  
  if (!appContext) return null;
  const { projects } = appContext;

  return (
    <Box
      width="250px"
      borderRight="1px solid"
      borderColor="brand.700"
      p={3}
      overflowY="auto"
      bg="#1E1E2F"
    >
      <Heading size="sm" mb={3}>Projects</Heading>
      
      <Droppable droppableId="unassigned">
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            p={3}
            bg={snapshot.isDraggingOver ? "red.800" : "#2A2A3D"}
            border="2px dashed"
            borderColor={snapshot.isDraggingOver ? "red.400" : "#4A4A5E"}
            rounded="md"
            mb={3}
            minHeight="60px"
            transition="all 0.2s"
          >
            <Text fontSize="sm" color="gray.400" textAlign="center">
              Unassigned Area
            </Text>
            {provided.placeholder}
          </Box>
        )}
      </Droppable>

      <VStack spacing={2} align="stretch">
        {projects.map((project: any) => (
          <Droppable key={project.id} droppableId={project.id}>
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                p={3}
                bg={
                  selectedProjectId === project.id
                    ? "brand.600"
                    : snapshot.isDraggingOver
                    ? "brand.800"
                    : "#2A2A3D"
                }
                border="1px solid"
                borderColor={
                  selectedProjectId === project.id
                    ? "brand.400"
                    : snapshot.isDraggingOver
                    ? "brand.400"
                    : "#4A4A5E"
                }
                rounded="md"
                minHeight="80px"
                cursor="pointer"
                onClick={() => setSelectedProjectId(
                  selectedProjectId === project.id ? null : project.id
                )}
                transition="all 0.2s"
                _hover={{
                  borderColor: "brand.500",
                  transform: "translateY(-1px)",
                }}
              >
                <Text fontWeight="bold" fontSize="sm" mb={1}>
                  {project.name}
                </Text>
                <Text fontSize="xs" color="gray.400" mb={2}>
                  {project.description}
                </Text>
                
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        ))}
      </VStack>
    </Box>
  );
}

/** ======= Employee List Wrapper (Middle Panel) ======= **/
function EmployeeListWrapper() {
  const appContext = useApp();
  
  if (!appContext) return null;
  const { employees, projects } = appContext;

  return (
    <Box
      width="250px"
      borderRight="1px solid"
      borderColor="brand.700"
      bg="#1E1E2F"
    >
      <EmployeeList employees={employees} projects={projects} />
    </Box>
  );
}

/** ======= Equipment List Wrapper (Right Panel) ======= **/
function EquipmentListWrapper() {
  const appContext = useApp();
  
  if (!appContext) return null;
  const { equipment, projects } = appContext;

  return (
    <Box
      width="250px"
      borderLeft="1px solid"
      borderColor="brand.700"
      bg="#1E1E2F"
    >
      <EquipmentList equipment={equipment} projects={projects} />
    </Box>
  );
}

export default function Dashboard() {
  const appContext = useApp();
  
  // Add null check for context
  if (!appContext) {
    return (
      <Box height="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white">Loading...</Text>
      </Box>
    );
  }
  
  const { onDragEnd } = appContext;

  return (
    <ProjectFilterProvider>
      <Box height="100%" overflow="hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <Flex height="calc(100vh - 120px)">
            <ProjectList />
            <EmployeeListWrapper />
            <EquipmentListWrapper />
          </Flex>
        </DragDropContext>
      </Box>
    </ProjectFilterProvider>
  );
}