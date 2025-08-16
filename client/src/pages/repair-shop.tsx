import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";
import { useDragDrop } from "@/hooks/use-drag-drop";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkOrderWizard } from "@/components/work-orders/work-order-wizard";
import type { Equipment, WorkOrder } from "@shared/schema";

async function getRepairShopEquipment(): Promise<Equipment[]> {
  const response = await apiRequest("GET", "/api/equipment");
  const allEquipment = await response.json();
  return allEquipment.filter((eq: Equipment) => eq.currentProjectId === "repair-shop");
}

async function getWorkOrders(equipmentId?: string): Promise<WorkOrder[]> {
  const url = equipmentId ? `/api/work-orders?equipmentId=${equipmentId}` : "/api/work-orders";
  const response = await apiRequest("GET", url);
  return response.json();
}

export default function RepairShop() {
  const navigate = useNavigate();
  const { handleDragEnd, isAssigning } = useDragDrop();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showWorkOrderWizard, setShowWorkOrderWizard] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const previousEquipmentCount = useRef(0);

  const { data: repairEquipment = [], isLoading } = useQuery({
    queryKey: ["/api", "repair-shop", "equipment"],
    queryFn: getRepairShopEquipment,
  });

  // Auto-open work order wizard when new equipment is dragged to repair shop
  useEffect(() => {
    if (!isLoading && repairEquipment.length > 0) {
      // If this is the first load, just set the previous count
      if (previousEquipmentCount.current === 0) {
        previousEquipmentCount.current = repairEquipment.length;
        return;
      }
      
      // If we have more equipment than before, auto-open wizard for the newest one
      if (repairEquipment.length > previousEquipmentCount.current) {
        const newestEquipment = repairEquipment[repairEquipment.length - 1];
        setSelectedEquipment(newestEquipment);
        setShowWorkOrderWizard(true);
      }
      
      previousEquipmentCount.current = repairEquipment.length;
    }
  }, [repairEquipment, isLoading]);

  const { data: workOrders = [] } = useQuery({
    queryKey: ["/api", "work-orders"],
    queryFn: () => getWorkOrders(),
  });

  const completeRepairMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      // Move equipment back to unassigned (available for service)
      const response = await apiRequest("PATCH", `/api/equipment/${equipmentId}/assignment`, {
        projectId: null
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "repair-shop", "equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api", "equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api", "work-orders"] });
      toast({
        title: "Repair Completed",
        description: "Equipment has been returned to service and is available for assignment.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete repair",
        variant: "destructive",
      });
    }
  });

  const getWorkOrdersForEquipment = (equipmentId: string) => {
    return workOrders.filter(wo => wo.equipmentId === equipmentId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "in-progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "open": return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleCreateWorkOrder = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowWorkOrderWizard(true);
  };

  const handleWorkOrderCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["/api", "work-orders"] });
    setShowWorkOrderWizard(false);
    setSelectedEquipment(null);
  };

  const handleCompleteRepair = (equipmentId: string) => {
    completeRepairMutation.mutate(equipmentId);
  };

  const toggleSelection = (equipmentId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(equipmentId)) {
      newSelected.delete(equipmentId);
    } else {
      newSelected.add(equipmentId);
    }
    setSelectedItems(newSelected);
  };

  if (isLoading) {
    return <div className="p-6 text-gray-400">Loading repair shop...</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="text-gray-300 border-gray-600 hover:bg-gray-800"
              >
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  🔧 Repair Shop
                </h1>
                <p className="text-gray-400 mt-1">Equipment Under Repair</p>
              </div>
            </div>
            <div className="text-right text-gray-300">
              <div className="text-2xl font-bold">{repairEquipment.length}</div>
              <div className="text-sm text-gray-400">Equipment in Repair</div>
            </div>
          </div>

          {isAssigning && (
            <div className="text-center text-sm text-orange-400 p-3 bg-orange-900/20 rounded mb-6">
              Moving equipment...
            </div>
          )}

          {/* Assigned Equipment Section */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">
                Assigned Equipment ({repairEquipment.length})
              </h3>
              {selectedItems.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const equipment = repairEquipment.find(eq => selectedItems.has(eq.id));
                      if (equipment) handleCreateWorkOrder(equipment);
                    }}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-500"
                  >
                    Create Work Order
                  </Button>
                  <Button
                    onClick={() => {
                      selectedItems.forEach(id => handleCompleteRepair(id));
                      setSelectedItems(new Set());
                    }}
                    size="sm"
                    variant="outline"
                    className="text-green-400 border-green-600 hover:bg-green-900"
                  >
                    Return to Service
                  </Button>
                </div>
              )}
            </div>
            
            {repairEquipment.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Equipment in Repair</h3>
                <p className="text-gray-400">
                  Equipment will appear here when assigned to the repair shop from the dashboard.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {repairEquipment.map((equipment) => {
                  const equipmentWorkOrders = getWorkOrdersForEquipment(equipment.id);
                  const isSelected = selectedItems.has(equipment.id);
                  
                  return (
                    <div
                      key={equipment.id}
                      className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                      onClick={() => {
                        const newSelected = new Set(selectedItems);
                        if (isSelected) {
                          newSelected.delete(equipment.id);
                        } else {
                          newSelected.add(equipment.id);
                        }
                        setSelectedItems(newSelected);
                      }}
                      data-testid={`equipment-card-${equipment.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedItems);
                            if (checked) {
                              newSelected.add(equipment.id);
                            } else {
                              newSelected.delete(equipment.id);
                            }
                            setSelectedItems(newSelected);
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm leading-tight">
                            {equipment.name}
                          </h4>
                          <p className="text-gray-400 text-xs mt-1">
                            {equipment.type}
                          </p>
                          {equipmentWorkOrders.length > 0 && (
                            <div className="mt-2">
                              <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                                {equipmentWorkOrders.length} Work Order{equipmentWorkOrders.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Droppable area for new equipment */}
          <Droppable droppableId="repair-shop">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`mt-8 p-6 rounded-lg border-2 border-dashed transition-colors ${
                  snapshot.isDraggingOver
                    ? "border-orange-400 bg-orange-900/20"
                    : "border-gray-600 bg-gray-800/50"
                }`}
              >
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">🔧</div>
                  <p>Drop equipment here to send to repair shop</p>
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>

      {/* Work Order Wizard */}
      {showWorkOrderWizard && selectedEquipment && (
        <WorkOrderWizard
          equipment={selectedEquipment}
          onClose={() => {
            setShowWorkOrderWizard(false);
            setSelectedEquipment(null);
          }}
          onWorkOrderCreated={handleWorkOrderCreated}
        />
      )}
    </DragDropContext>
  );
}