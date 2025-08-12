import { Box, VStack, Text, Heading } from "@chakra-ui/react";
import { Droppable } from "react-beautiful-dnd";
import { useSelection } from "@/state/selection";
import type { Project } from "@shared/schema";

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const { projectId, setProjectId } = useSelection();
  
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
              >
                <Text fontWeight="bold" fontSize="sm" mb={2} color="white">
                  {project.name}
                </Text>
                <Text fontSize="xs" color="gray.400" mb={2}>
                  {project.location}
                </Text>
                <Text fontSize="xs" color="green.400">
                  Status: {project.status}
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