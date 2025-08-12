import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { MapPin, User, Package, Calendar } from "lucide-react";
import type { Project, Employee, Equipment } from "@shared/schema";

interface ActiveProjectsProps {
  projects: Project[];
  employees: Employee[];
  equipment: Equipment[];
  isLoading: boolean;
}

export function ActiveProjects({ projects, employees, equipment, isLoading }: ActiveProjectsProps) {
  const activeProjects = projects.filter(p => p.status === "active");

  if (isLoading) {
    return (
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-8 bg-gray-700 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
      {activeProjects.map((project) => {
        const projectEmployees = employees.filter(emp => emp.currentProjectId === project.id);
        const projectEquipment = equipment.filter(eq => eq.currentProjectId === project.id);

        return (
          <Card key={project.id} className="bg-gray-800 border-gray-700" data-testid={`project-${project.id}`}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <MapPin size={16} className="text-blue-400" />
                <span>{project.name}</span>
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'No date'}</span>
                </div>
                <span className="capitalize px-2 py-1 bg-green-600 text-white rounded-full text-xs">
                  {project.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Assigned Employees */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                    <User size={14} className="mr-1" />
                    Employees ({projectEmployees.length})
                  </h4>
                  <Droppable droppableId={`project-${project.id}-employees`}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-2 min-h-[60px] p-2 border-2 border-dashed rounded-lg transition-colors ${
                          snapshot.isDraggingOver 
                            ? "border-blue-400 bg-blue-900/20" 
                            : "border-gray-600"
                        }`}
                      >
                        {projectEmployees.map((employee, index) => (
                          <Draggable key={employee.id} draggableId={`employee-${employee.id}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="flex items-center space-x-2 p-2 bg-gray-700 rounded text-sm"
                                data-testid={`assigned-employee-${employee.id}`}
                              >
                                <User size={12} className="text-blue-400" />
                                <span className="text-white">{employee.name}</span>
                                <span className="text-gray-400">({employee.role})</span>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {projectEmployees.length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            Drop employees here
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Assigned Equipment */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                    <Package size={14} className="mr-1" />
                    Equipment ({projectEquipment.length})
                  </h4>
                  <Droppable droppableId={`project-${project.id}-equipment`}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-2 min-h-[60px] p-2 border-2 border-dashed rounded-lg transition-colors ${
                          snapshot.isDraggingOver 
                            ? "border-green-400 bg-green-900/20" 
                            : "border-gray-600"
                        }`}
                      >
                        {projectEquipment.map((item, index) => (
                          <Draggable key={item.id} draggableId={`equipment-${item.id}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="flex items-center space-x-2 p-2 bg-gray-700 rounded text-sm"
                                data-testid={`assigned-equipment-${item.id}`}
                              >
                                <Package size={12} className="text-green-400" />
                                <span className="text-white">{item.name}</span>
                                <span className="text-gray-400">({item.type})</span>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {projectEquipment.length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            Drop equipment here
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}