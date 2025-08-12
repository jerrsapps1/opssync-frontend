import { Box, VStack, Text, Heading, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { Droppable } from "react-beautiful-dnd";
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
      

      {/* Project List */}
      <VStack spacing={2} align="stretch">
        {projects.map((project) => (
          <Droppable key={project.id} droppableId={project.id}>
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                p={3}
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
                minHeight="60px"
                transition="all 0.2s"
                cursor="pointer"
                _hover={{
                  borderColor: "blue.500",
                  transform: "translateY(-1px)",
                }}
                onClick={() => navigate(`/projects/${project.id}`)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, project });
                }}
              >
                <Text fontWeight="bold" fontSize="sm" mb={1} color="white">
                  {project.name}
                </Text>
                <Text fontSize="xs" color="#C0C0D8" mb={1}>
                  {project.location}
                </Text>
                
                {/* Status Bar */}
                <Box mb={1}>
                  <Box 
                    h="2px" 
                    rounded="full" 
                    bg={
                      project.status === "Active" ? "green.400" :
                      project.status === "Completed" ? "blue.400" :
                      project.status === "Paused" ? "yellow.400" :
                      "gray.400" // Planned or default
                    }
                    mb={1}
                  />
                  <Text fontSize="xs" color="blue.300" fontWeight="medium">
                    {project.status || "Planned"}
                  </Text>
                </Box>
                
                {/* Show assigned employees and equipment only when project is focused */}
                {projectId === project.id && (
                  <Box mb={2}>
                    {employees.filter(emp => emp.currentProjectId === project.id).map(emp => (
                      <Text key={emp.id} fontSize="xs" color="green.400" mb={1}>
                        👤 {emp.name}
                      </Text>
                    ))}
                    {equipment.filter(eq => eq.currentProjectId === project.id).map(eq => (
                      <Text key={eq.id} fontSize="xs" color="blue.400" mb={1}>
                        🔧 {eq.name}
                      </Text>
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