import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { User, Package } from "lucide-react";
import { StatusIndicator, StatusDot } from "@/components/ui/status-indicator";
import type { Employee, Equipment } from "@shared/schema";

interface UnassignedAssetsProps {
  employees: Employee[];
  equipment: Equipment[];
  isLoading: boolean;
}

export function UnassignedAssets({ employees, equipment, isLoading }: UnassignedAssetsProps) {
  const unassignedEmployees = employees.filter(emp => !emp.currentProjectId);
  // Show ALL equipment except those in repair shop (maintenance status)
  // This includes available, active, broken, etc. - all can go to repair shop
  const unassignedEquipment = equipment.filter(eq => !eq.currentProjectId && eq.status !== "maintenance");

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Unassigned Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Unassigned Assets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Unassigned Employees */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Employees ({unassignedEmployees.length})</h4>
            <Droppable droppableId="unassigned-employees">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 min-h-[40px]">
                  {unassignedEmployees.map((employee, index) => (
                    <Draggable key={employee.id} draggableId={`employee-${employee.id}`} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-grab"
                          data-testid={`employee-${employee.id}`}
                        >
                          <User size={16} className="text-blue-400" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-white">{employee.name}</p>
                              <StatusDot status={employee.status} type="employee" />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <StatusIndicator status={employee.role} type="role" size="sm" />
                              <StatusIndicator status={employee.status} type="employee" size="sm" />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Unassigned Equipment */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Equipment ({unassignedEquipment.length})</h4>
            <Droppable droppableId="unassigned-equipment">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 min-h-[40px]">
                  {unassignedEquipment.map((item, index) => (
                    <Draggable key={item.id} draggableId={`equipment-${item.id}`} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-grab"
                          data-testid={`equipment-${item.id}`}
                        >
                          <Package size={16} className="text-green-400" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-white">{item.name}</p>
                              <StatusDot status={item.status} type="equipment" />
                            </div>
                            <p className="text-xs text-gray-400 mb-1">{item.type}</p>
                            <StatusIndicator status={item.status} type="equipment" size="sm" />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}