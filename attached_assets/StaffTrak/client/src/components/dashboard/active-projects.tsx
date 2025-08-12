import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droppable } from "react-beautiful-dnd";
import { FolderOpen, Plus, MoreVertical, Truck, Hammer } from "lucide-react";
import type { Project, Employee, Equipment } from "@shared/schema";

interface ActiveProjectsProps {
  projects: Project[];
  employees: Employee[];
  equipment: Equipment[];
  isLoading?: boolean;
}

export function ActiveProjects({ projects, employees, equipment, isLoading }: ActiveProjectsProps) {
  if (isLoading) {
    return (
      <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <FolderOpen className="mr-2 text-blue-500" size={20} />
              Active Projects
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-700 rounded-lg p-4 min-h-48 animate-pulse">
                <div className="h-4 bg-gray-600 rounded mb-2"></div>
                <div className="h-8 bg-gray-600 rounded mb-4"></div>
                <div className="h-2 bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500 text-white";
      case "planning": return "bg-orange-500 text-white";
      case "completed": return "bg-blue-500 text-white";
      case "paused": return "bg-gray-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-500";
      case "planning": return "bg-orange-500";
      case "completed": return "bg-green-500";
      case "paused": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getProjectAssets = (projectId: string) => {
    const projectEmployees = employees.filter(emp => emp.currentProjectId === projectId);
    const projectEquipment = equipment.filter(eq => eq.currentProjectId === projectId);
    return { employees: projectEmployees, equipment: projectEquipment };
  };

  return (
    <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <FolderOpen className="mr-2 text-blue-500" size={20} />
            Active Projects
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600" data-testid="new-project-btn">
              <Plus size={16} className="mr-1" />
              New Project
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => {
            const assets = getProjectAssets(project.id);
            const totalAssets = assets.employees.length + assets.equipment.length;
            
            return (
              <Droppable key={project.id} droppableId={project.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-gray-700 border-2 border-dashed rounded-lg p-4 min-h-48 transition-colors ${
                      snapshot.isDraggingOver 
                        ? "border-teal-500 bg-teal-500 bg-opacity-10" 
                        : "border-gray-600"
                    }`}
                    data-testid={`project-${project.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white">{project.name}</h4>
                        <p className="text-xs text-gray-400">{project.location}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <MoreVertical size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(project.status)}`}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Assigned Assets */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-400">Assigned Assets</span>
                        <span className="text-xs text-gray-500">{totalAssets} total</span>
                      </div>
                      
                      {/* Assigned Employees */}
                      {assets.employees.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {assets.employees.slice(0, 3).map((emp) => (
                            <div key={emp.id} className="flex items-center bg-gray-600 rounded-full px-2 py-1">
                              <Avatar className="w-4 h-4 mr-1">
                                {emp.avatarUrl && (
                                  <AvatarImage 
                                    src={emp.avatarUrl}
                                    className="object-cover"
                                  />
                                )}
                                <AvatarFallback className="text-xs">
                                  {emp.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-white">{emp.name.split(' ')[0]} {emp.name.split(' ')[1]?.[0]}.</span>
                            </div>
                          ))}
                          {assets.employees.length > 3 && (
                            <div className="flex items-center bg-gray-600 rounded-full px-2 py-1">
                              <span className="text-xs text-gray-300">+{assets.employees.length - 3} more</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Assigned Equipment */}
                      {assets.equipment.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {assets.equipment.slice(0, 3).map((eq) => {
                            const isHeavy = eq.type.toLowerCase().includes("heavy");
                            const IconComponent = isHeavy ? Truck : Hammer;
                            const iconColor = isHeavy ? "text-orange-500" : "text-blue-500";
                            const bgColor = isHeavy ? "bg-orange-500 bg-opacity-20" : "bg-blue-500 bg-opacity-20";
                            
                            return (
                              <div key={eq.id} className={`flex items-center ${bgColor} rounded px-2 py-1`}>
                                <IconComponent className={`${iconColor} mr-1`} size={12} />
                                <span className="text-xs text-white">{eq.name.split(' ')[0]}</span>
                              </div>
                            );
                          })}
                          {assets.equipment.length > 3 && (
                            <div className="flex items-center bg-gray-600 rounded px-2 py-1">
                              <span className="text-xs text-gray-300">+{assets.equipment.length - 3} more</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Drop hint */}
                    <div className="mt-3 text-center text-xs text-gray-500 border-t border-gray-600 pt-2">
                      Drop assets here to assign
                    </div>
                    
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
