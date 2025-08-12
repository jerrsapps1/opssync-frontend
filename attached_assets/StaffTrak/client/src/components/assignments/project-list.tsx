import { Card } from "@/components/ui/card";
import type { Project } from "@shared/schema";

interface ProjectListProps {
  projects: Project[];
  isLoading?: boolean;
}

export function ProjectList({ projects, isLoading }: ProjectListProps) {
  if (isLoading) {
    return (
      <div className="w-48 border-r border-blue-700 p-3 overflow-y-auto bg-gray-800">
        <h2 className="text-sm font-medium mb-3">Projects</h2>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-3 py-2 bg-gray-700 rounded-md h-8 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-48 border-r border-blue-700 p-3 overflow-y-auto bg-gray-800">
      <h2 className="text-sm font-medium mb-3">Projects</h2>
      <div className="space-y-2">
        {projects.map((proj) => (
          <Card
            key={proj.id}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 cursor-pointer transition-colors border-none"
            data-testid={`project-card-${proj.id}`}
          >
            <div className="text-white text-sm">{proj.name}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}