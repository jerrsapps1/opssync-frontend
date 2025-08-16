import { Box, VStack, Text, Heading, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { useSelection } from "@/state/selection";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import type { Project } from "@shared/schema";

interface ProjectListProps {
  projects: Project[];
  employees?: any[];
  equipment?: any[];
}

export function ProjectList({ projects, employees = [], equipment = [] }: ProjectListProps) {
  const { projectId, setProjectId } = useSelection();
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: Project } | null>(null);
  
  // Repair shop for equipment
  const repairShop = {
    id: "repair-shop", 
    name: "🔧 Repair Shop",
    description: "Equipment Under Repair",
    icon: "🔧",
    color: "orange"
  };
  
  // Get equipment assigned to repair shop
  const repairShopEquipment = equipment.filter(eq => eq.currentProjectId === "repair-shop");
  
  return (
    <Box
      flex="1"
      borderRight="1px solid"
      borderColor="gray.700"
      p={4}
      overflowY="auto"
      bg="gray.800"
    >
      <Heading size="md" mb={4} color="white">Projects</Heading>
      
      {/* Repair Shop */}
      <Box mb={4}>
        <Droppable droppableId={repairShop.id}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              px={3}
              py={2}
              bg={
                projectId === repairShop.id 
                  ? "orange.600"
                  : snapshot.isDraggingOver 
                  ? "orange.700"
                  : "#1F2937"
              }
              border="2px solid"
              borderColor={
                projectId === repairShop.id
                  ? "orange.400"
                  : snapshot.isDraggingOver 
                  ? "orange.400"
                  : "orange.700"
              }
              rounded="md"
              minHeight="45px"
              transition="all 0.2s"
              cursor="pointer"
              _hover={{
                borderColor: "orange.500",
                transform: "translateY(-1px)",
              }}
              onClick={() => {
                if (repairShop.id === "repair-shop") {
                  navigate("/repair-shop");
                } else {
                  setProjectId(repairShop.id);
                }
              }}
            >
              <Text fontWeight="bold" fontSize="sm" mb={0.5} color="white" lineHeight="1.2">
                {repairShop.name}
              </Text>
              <Text fontSize="xs" color="#C0C0D8" mb={0.5} lineHeight="1.1">
                {repairShop.description}
              </Text>
              
              {/* Equipment Count */}
              <Box>
                <Box 
                  h="2px" 
                  rounded="full" 
                  bg="orange.400"
                  mb={0.5}
                />
                <Text fontSize="xs" color="orange.300" fontWeight="medium" lineHeight="1.1">
                  {repairShopEquipment.length} equipment
                </Text>
              </Box>
              
              {/* Show assigned equipment when repair shop is focused */}
              {projectId === repairShop.id && (
                <Box mb={2}>
                  {repairShopEquipment.map((eq, index) => (
                    <Draggable key={eq.id} draggableId={eq.id} index={index}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          bg={snapshot.isDragging ? "blue.600" : "blue.800"}
                          p={1}
                          mb={1}
                          rounded="sm"
                          cursor="grab"
                          _active={{ cursor: "grabbing" }}
                          border="1px solid"
                          borderColor={snapshot.isDragging ? "blue.400" : "blue.700"}
                        >
                          <Text fontSize="xs" color="blue.200">
                            🔧 {eq.name}
                          </Text>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                </Box>
              )}
              
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </Box>
      
      {/* Divider */}
      <Box borderTop="1px solid" borderColor="gray.600" mb={4} />
      
      {/* Regular Projects */}
      <VStack spacing={2} align="stretch">
        {projects.map((project) => (
          <Droppable key={project.id} droppableId={project.id}>
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                px={3}
                py={2}
                bg={
                  projectId === project.id 
                    ? "blue.600" 
                    : snapshot.isDraggingOver 
                    ? "blue.700" 
                    : "#1E1E2F"
                }
                border="2px solid"
                borderColor={
                  projectId === project.id
                    ? "blue.400"
                    : snapshot.isDraggingOver 
                    ? "blue.400" 
                    : "gray.600"
                }
                rounded="md"
                minHeight="45px"
                transition="all 0.2s"
                cursor="pointer"
                _hover={{
                  borderColor: "blue.500",
                  transform: "translateY(-1px)",
                }}
                onClick={() => {
                  if (project.id === "repair-shop") {
                    navigate("/repair-shop");
                  } else {
                    navigate(`/projects/${project.id}`);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, project });
                }}
              >
                <Text fontWeight="bold" fontSize="sm" mb={0.5} color="white" lineHeight="1.2">
                  {project.name}
                </Text>
                <Text fontSize="xs" color="#C0C0D8" mb={0.5} lineHeight="1.1">
                  {project.location}
                </Text>
                
                {/* Status Bar */}
                <Box>
                  <Box 
                    h="2px" 
                    rounded="full" 
                    bg={
                      project.status === "Active" ? "green.400" :
                      project.status === "Completed" ? "blue.400" :
                      project.status === "Paused" ? "yellow.400" :
                      "gray.400" // Planned or default
                    }
                    mb={0.5}
                  />
                  <Text fontSize="xs" color="blue.300" fontWeight="medium" lineHeight="1.1">
                    {project.status || "Planned"}
                  </Text>
                </Box>
                
                {/* Show assigned employees and equipment only when project is focused */}
                {projectId === project.id && (
                  <Box mb={2}>
                    {employees.filter(emp => emp.currentProjectId === project.id).map((emp, index) => (
                      <Draggable key={emp.id} draggableId={emp.id} index={index}>
                        {(provided, snapshot) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            bg={snapshot.isDragging ? "green.600" : "green.800"}
                            p={1}
                            mb={1}
                            rounded="sm"
                            cursor="grab"
                            _active={{ cursor: "grabbing" }}
                            border="1px solid"
                            borderColor={snapshot.isDragging ? "green.400" : "green.700"}
                          >
                            <Text fontSize="xs" color="green.200">
                              👤 {emp.name}
                            </Text>
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {equipment.filter(eq => eq.currentProjectId === project.id).map((eq, index) => (
                      <Draggable key={eq.id} draggableId={eq.id} index={employees.filter(emp => emp.currentProjectId === project.id).length + index}>
                        {(provided, snapshot) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            bg={snapshot.isDragging ? "blue.600" : "blue.800"}
                            p={1}
                            mb={1}
                            rounded="sm"
                            cursor="grab"
                            _active={{ cursor: "grabbing" }}
                            border="1px solid"
                            borderColor={snapshot.isDragging ? "blue.400" : "blue.700"}
                          >
                            <Text fontSize="xs" color="blue.200">
                              🔧 {eq.name}
                            </Text>
                          </Box>
                        )}
                      </Draggable>
                    ))}
                  </Box>
                )}
                
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        ))}
      </VStack>
      
      {/* Context Menu */}
      {contextMenu && (
        <Box
          position="fixed"
          top={`${contextMenu.y}px`}
          left={`${contextMenu.x}px`}
          bg="gray.800"
          border="1px solid"
          borderColor="gray.600"
          borderRadius="md"
          py={2}
          boxShadow="lg"
          zIndex={1000}
          onClick={() => setContextMenu(null)}
        >
          <VStack spacing={0} align="stretch">
            <Box
              px={4}
              py={2}
              _hover={{ bg: "gray.700" }}
              cursor="pointer"
              onClick={() => {
                navigate(`/projects/${contextMenu.project.id}`);
                setContextMenu(null);
              }}
            >
              <Text fontSize="sm" color="white">Open Project Profile</Text>
            </Box>
            <Box
              px={4}
              py={2}
              _hover={{ bg: "gray.700" }}
              cursor="pointer"
              onClick={() => {
                setProjectId(contextMenu.project.id);
                setContextMenu(null);
              }}
            >
              <Text fontSize="sm" color="white">Focus Project</Text>
            </Box>
          </VStack>
        </Box>
      )}
      
      {/* Click outside to close context menu */}
      {contextMenu && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={999}
          onClick={() => setContextMenu(null)}
        />
      )}
    </Box>
  );
}