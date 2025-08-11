import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Users, Wrench, Inbox, Truck, Hammer } from "lucide-react";
import type { Employee, Equipment } from "@shared/schema";

interface UnassignedAssetsProps {
  employees: Employee[];
  equipment: Equipment[];
  isLoading?: boolean;
}

export function UnassignedAssets({ employees, equipment, isLoading }: UnassignedAssetsProps) {
  const unassignedEmployees = employees.filter(emp => !emp.currentProjectId);
  const allEquipment = equipment; // Show all equipment regardless of assignment

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Inbox className="mr-2 text-gray-400" size={20} />
            Unassigned Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getEquipmentIcon = (type: string) => {
    if (type.toLowerCase().includes("heavy")) return Truck;
    if (type.toLowerCase().includes("tool") || type.toLowerCase().includes("drill")) return Hammer;
    return Wrench;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "maintenance": return "bg-orange-500";
      case "busy": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available": return "Available";
      case "maintenance": return "Maintenance";
      case "busy": return "Busy";
      default: return status;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Wrench className="mr-2 text-gray-400" size={20} />
          Equipment
        </CardTitle>
        <p className="text-sm text-gray-400">Drag to assign to projects</p>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        <Droppable droppableId="unassigned" isDropDisabled={true}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {/* Unassigned Employees */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                  <Users size={16} className="mr-2" />
                  Employees ({unassignedEmployees.length})
                </h4>
                <div className="space-y-2">
                  {unassignedEmployees.map((employee, index) => (
                    <Draggable 
                      key={employee.id} 
                      draggableId={`employee-${employee.id}`} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-gray-700 border border-gray-600 rounded-lg p-3 cursor-move hover:bg-gray-600 transition-colors ${
                            snapshot.isDragging ? "shadow-lg ring-2 ring-blue-500" : ""
                          }`}
                          data-testid={`employee-${employee.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              {employee.avatarUrl && (
                                <AvatarImage 
                                  src={employee.avatarUrl}
                                  className="object-cover"
                                />
                              )}
                              <AvatarFallback>
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{employee.name}</p>
                              <p className="text-xs text-gray-400">{employee.role}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 ${getStatusColor(employee.status)} rounded-full`}></div>
                              <span className="text-xs text-gray-400">{getStatusText(employee.status)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              </div>

              {/* All Equipment */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                  <Wrench size={16} className="mr-2" />
                  Equipment ({allEquipment.length})
                </h4>
                <div className="space-y-2">
                  {allEquipment.map((item, index) => {
                    const IconComponent = getEquipmentIcon(item.type);
                    return (
                      <Draggable 
                        key={item.id} 
                        draggableId={`equipment-${item.id}`} 
                        index={index + unassignedEmployees.length}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-gray-700 border border-gray-600 rounded-lg p-3 cursor-move hover:bg-gray-600 transition-colors ${
                              snapshot.isDragging ? "shadow-lg ring-2 ring-blue-500" : ""
                            }`}
                            data-testid={`equipment-${item.id}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-orange-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                                <IconComponent className="text-orange-500" size={16} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{item.name}</p>
                                <p className="text-xs text-gray-400">ID: {item.serialNumber}</p>
                                {item.currentProjectId ? (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    Assigned: {item.currentProjectId}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Unassigned
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className={`w-2 h-2 ${getStatusColor(item.status)} rounded-full`}></div>
                                <span className="text-xs text-gray-400">{getStatusText(item.status)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                </div>
              </div>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
}
