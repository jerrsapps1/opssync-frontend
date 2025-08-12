import { Select } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Project } from "@shared/schema";

interface ProjectStatusDropdownProps {
  project: Project;
  size?: "sm" | "md" | "lg";
}

export function ProjectStatusDropdown({ project, size = "sm" }: ProjectStatusDropdownProps) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/projects/${project.id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch project data
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", project.id] });
    },
  });

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value;
    updateStatusMutation.mutate(newStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planned": return "gray.400";
      case "Active": return "green.400";
      case "Paused": return "yellow.400";
      case "Completed": return "blue.400";
      default: return "gray.400";
    }
  };

  return (
    <Select
      value={project.status || "Planned"}
      onChange={handleStatusChange}
      size={size}
      variant="filled"
      bg="gray.800"
      borderColor="gray.600"
      color={getStatusColor(project.status || "Planned")}
      _hover={{ borderColor: "gray.500" }}
      _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
      fontSize="xs"
      isDisabled={updateStatusMutation.isPending}
      onClick={(e) => e.stopPropagation()} // Prevent project selection when clicking dropdown
    >
      <option value="Planned" style={{ backgroundColor: "#2D3748", color: "#A0AEC0" }}>
        Planned
      </option>
      <option value="Active" style={{ backgroundColor: "#2D3748", color: "#68D391" }}>
        Active
      </option>
      <option value="Paused" style={{ backgroundColor: "#2D3748", color: "#F6E05E" }}>
        Paused
      </option>
      <option value="Completed" style={{ backgroundColor: "#2D3748", color: "#63B3ED" }}>
        Completed
      </option>
    </Select>
  );
}