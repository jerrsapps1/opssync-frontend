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

/** ======= Employee List (Middle Panel) ======= **/
function EmployeeList() {
  const appContext = useApp();
  const { selectedProjectId } = useProjectFilter();
  
  if (!appContext) return null;
  const { employees } = appContext;

  // Apply project filtering if selected
  const filteredEmployees = selectedProjectId && selectedProjectId !== 'all'
    ? employees.filter((emp: any) => emp.currentProjectId === selectedProjectId)
    : employees;

  return (
    <Box
      width="250px"
      borderRight="1px solid"
      borderColor="brand.700"
      p={3}
      overflowY="auto"
      bg="#1E1E2F"
    >
      <HStack justify="space-between" mb={3}>
        <Heading size="sm">
          Employees
          {selectedProjectId && (
            <Text as="span" fontSize="xs" color="gray.400" ml={2}>
              (Filtered: {filteredEmployees.length})
            </Text>
          )}
        </Heading>
        {selectedProjectId && filteredEmployees.length === 0 && (
          <Text fontSize="xs" color="yellow.400">
            No employees assigned
          </Text>
        )}
      </HStack>

      <Droppable droppableId="employee-list">
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            p={3}
            bg={snapshot.isDraggingOver ? "blue.800" : "#2A2A3D"}
            border="2px dashed"
            borderColor={snapshot.isDraggingOver ? "blue.400" : "#4A4A5E"}
            rounded="md"
            minHeight="200px"
            transition="all 0.2s"
          >
            {filteredEmployees.map((employee: any, index: number) => (
              <Draggable
                key={employee.id}
                draggableId={`employee-${employee.id}`}
                index={index}
              >
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    p={2}
                    mb={2}
                    bg={snapshot.isDragging ? "blue.500" : "#4A90E2"}
                    rounded="md"
                    boxShadow={snapshot.isDragging ? "2xl" : "sm"}
                    color="white"
                    userSelect="none"
                    cursor="grab"
                    transform={snapshot.isDragging ? "rotate(-2deg) scale(1.05)" : "none"}
                    transition="all 0.2s ease-in-out"
                    _hover={{
                      transform: "scale(1.02)",
                      boxShadow: "lg"
                    }}
                    _active={{ cursor: "grabbing" }}
                  >
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="sm">{employee.name}</Text>
                      <Text fontSize="xs" color="gray.300">{employee.role}</Text>
                    </VStack>
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {filteredEmployees.length === 0 && (
              <Text color="gray.500" fontSize="sm" fontStyle="italic" textAlign="center" py={8}>
                {selectedProjectId ? "No employees assigned to this project" : "No employees available"}
              </Text>
            )}
          </Box>
        )}
      </Droppable>
    </Box>
  );
}

/** ======= Equipment List (Right Panel) ======= **/
function EquipmentList() {
  const appContext = useApp();
  const { selectedProjectId } = useProjectFilter();
  
  if (!appContext) return null;
  const { equipment } = appContext;

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

      <Droppable droppableId="equipment-list">
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
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="sm">{eq.name}</Text>
                      <Text fontSize="xs" color="gray.300">{eq.type}</Text>
                    </VStack>
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
            <EmployeeList />
            <EquipmentList />
          </Flex>
        </DragDropContext>
      </Box>
    </ProjectFilterProvider>
  );
}