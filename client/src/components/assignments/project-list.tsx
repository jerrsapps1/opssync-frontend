import { Box, VStack, Text, Heading, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { Droppable } from "react-beautiful-dnd";
import { useSelection } from "@/state/selection";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ProjectStatusDropdown } from "../ProjectStatusDropdown";
import type { Project } from "@shared/schema";

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const { projectId, setProjectId } = useSelection();
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: Project } | null>(null);
  
  return (
    <Box
      width="300px"
      borderRight="1px solid"
      borderColor="gray.700"
      p={4}
      overflowY="auto"
      bg="gray.800"
    >
      <Heading size="md" mb={4} color="white">Projects</Heading>
      
      {/* Unassigned Area */}
      <Droppable droppableId="unassigned">
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            p={4}
            bg={snapshot.isDraggingOver ? "red.700" : "gray.700"}
            border="2px dashed"
            borderColor={snapshot.isDraggingOver ? "red.400" : "gray.600"}
            rounded="md"
            mb={4}
            minHeight="80px"
            transition="all 0.2s"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="sm" color="gray.400" textAlign="center">
              Drop here to unassign
            </Text>
            {provided.placeholder}
          </Box>
        )}
      </Droppable>

      {/* Project List */}
      <VStack spacing={3} align="stretch">
        {projects.map((project) => (
          <Droppable key={project.id} droppableId={project.id}>
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                p={4}
                bg={
                  projectId === project.id 
                    ? "blue.600" 
                    : snapshot.isDraggingOver 
                    ? "blue.700" 
                    : "gray.700"
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
                minHeight="100px"
                transition="all 0.2s"
                cursor="pointer"
                _hover={{
                  borderColor: "blue.500",
                  transform: "translateY(-1px)",
                }}
                onClick={() => setProjectId(project.id)}
                onDoubleClick={() => navigate(`/projects/${project.id}`)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, project });
                }}
              >
                <Text fontWeight="bold" fontSize="sm" mb={2} color="white">
                  {project.name}
                </Text>
                <Text fontSize="xs" color="gray.400" mb={2}>
                  {project.location}
                </Text>
                <Box mb={2}>
                  <ProjectStatusDropdown project={project} size="sm" />
                </Box>
                
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