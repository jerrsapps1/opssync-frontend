import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";
import { useDragDrop } from "@/hooks/use-drag-drop";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, Calendar, User, Wrench, DollarSign, Clock, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import type { Equipment, WorkOrder, WorkOrderComment, InsertWorkOrderComment } from "@shared/schema";

async function getRepairShopEquipment(): Promise<Equipment[]> {
  const response = await apiRequest("GET", "/api/equipment");
  const allEquipment = await response.json();
  
  // Equipment in repair shop has null projectId but status 'maintenance'
  // OR currentProjectId === "repair-shop" (fallback)
  const repairEquipment = allEquipment.filter((eq: Equipment) => 
    eq.currentProjectId === "repair-shop" || 
    (!eq.currentProjectId && eq.status === "maintenance")
  );
  
  console.log('Repair shop equipment found:', repairEquipment.length);
  
  return repairEquipment;
}

async function getWorkOrders(equipmentId?: string): Promise<WorkOrder[]> {
  const url = equipmentId ? `/api/work-orders?equipmentId=${equipmentId}` : "/api/work-orders";
  const response = await apiRequest("GET", url);
  return response.json();
}

async function getWorkOrderComments(workOrderId: string): Promise<WorkOrderComment[]> {
  const response = await apiRequest("GET", `/api/work-orders/${workOrderId}/comments`);
  return response.json();
}

async function createWorkOrderComment(workOrderId: string, comment: string): Promise<WorkOrderComment> {
  const response = await apiRequest("POST", `/api/work-orders/${workOrderId}/comments`, {
    comment
  });
  return response.json();
}

export default function RepairShop() {
  const navigate = useNavigate();
  const { handleDragEnd, isAssigning } = useDragDrop();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const previousEquipmentCount = useRef(0);
  
  // Work Order Log state
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"dateCreated" | "priority" | "status" | "equipment">("dateCreated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedWorkOrder, setExpandedWorkOrder] = useState<string | null>(null);
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<Set<string>>(new Set());
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateData, setUpdateData] = useState({ status: "", comments: "" });
  
  // Comments state for progressive commenting
  const [workOrderComments, setWorkOrderComments] = useState<Record<string, WorkOrderComment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [loadedComments, setLoadedComments] = useState<Set<string>>(new Set());

  const { data: repairEquipment = [], isLoading } = useQuery({
    queryKey: ["/api", "repair-shop", "equipment"],
    queryFn: getRepairShopEquipment,
  });


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

  // Comments query and mutation
  const loadCommentsMutation = useMutation({
    mutationFn: async (workOrderId: string) => {
      const comments = await getWorkOrderComments(workOrderId);
      setWorkOrderComments(prev => ({ ...prev, [workOrderId]: comments }));
      setLoadedComments(prev => new Set(prev).add(workOrderId));
      return comments;
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ workOrderId, comment }: { workOrderId: string, comment: string }) => {
      const newComment = await createWorkOrderComment(workOrderId, comment);
      setWorkOrderComments(prev => ({
        ...prev,
        [workOrderId]: [newComment, ...(prev[workOrderId] || [])]
      }));
      return newComment;
    },
    onSuccess: () => {
      setNewComment(""); // Clear the comment box after successful submission
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the work order.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    }
  });

  // Load comments when work order is expanded
  useEffect(() => {
    if (expandedWorkOrder && !loadedComments.has(expandedWorkOrder)) {
      loadCommentsMutation.mutate(expandedWorkOrder);
    }
  }, [expandedWorkOrder]);

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


  const handleCompleteRepair = (equipmentId: string) => {
    completeRepairMutation.mutate(equipmentId);
  };

  const updateWorkOrderMutation = useMutation({
    mutationFn: async ({ workOrderIds, updates }: { workOrderIds: string[]; updates: { status?: string; comments?: string } }) => {
      // Update multiple work orders efficiently
      const promises = workOrderIds.map(id => {
        const updateData: any = {};
        if (updates.status) updateData.status = updates.status;
        if (updates.comments !== undefined) updateData.comments = updates.comments;
        
        return apiRequest("PATCH", `/api/work-orders/${id}`, updateData);
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "work-orders"] });
      setShowUpdateDialog(false);
      setSelectedWorkOrders(new Set());
      setUpdateData({ status: "", comments: "" });
      toast({
        title: "Work Orders Updated",
        description: `Successfully updated ${selectedWorkOrders.size} work order(s).`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update work orders",
        variant: "destructive",
      });
    }
  });

  const handleUpdateClick = () => {
    const selectedIds = Array.from(selectedWorkOrders);
    if (selectedIds.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one work order to update.",
        variant: "destructive",
      });
      return;
    }
    
    // Pre-fill with existing data if only one work order is selected
    if (selectedIds.length === 1) {
      const workOrder = workOrders.find(wo => wo.id === selectedIds[0]);
      setUpdateData({
        status: workOrder?.status || "",
        comments: workOrder?.comments || ""
      });
    } else {
      setUpdateData({ status: "", comments: "" });
    }
    
    setShowUpdateDialog(true);
  };

  const handleSaveUpdate = () => {
    const { status, comments } = updateData;
    
    if ((!status || status === "no-change") && !comments.trim()) {
      toast({
        title: "No Changes",
        description: "Please update at least one field.",
        variant: "destructive",
      });
      return;
    }
    
    const selectedIds = Array.from(selectedWorkOrders);
    const updates: { status?: string; comments?: string } = {};
    
    if (status && status !== "no-change") updates.status = status;
    if (comments.trim()) updates.comments = comments;
    
    updateWorkOrderMutation.mutate({
      workOrderIds: selectedIds,
      updates
    });
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

  // Filter and sort work orders for the log
  const filteredAndSortedWorkOrders = workOrders
    .filter(wo => {
      // Search filter
      const equipment = repairEquipment.find(eq => eq.id === wo.equipmentId);
      const searchMatch = searchFilter === "" || 
        wo.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        wo.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        wo.assignedTo?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (equipment?.name?.toLowerCase().includes(searchFilter.toLowerCase()) || false);
      
      // Status filter
      const statusMatch = statusFilter === "all" || wo.status === statusFilter;
      
      // Priority filter
      const priorityMatch = priorityFilter === "all" || wo.priority === priorityFilter;
      
      return searchMatch && statusMatch && priorityMatch;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "dateCreated":
          aValue = a.dateCreated ? new Date(a.dateCreated) : new Date(0);
          bValue = b.dateCreated ? new Date(b.dateCreated) : new Date(0);
          break;
        case "priority":
          const priorityOrder = { "urgent": 4, "high": 3, "medium": 2, "low": 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "equipment":
          const aEquipment = repairEquipment.find(eq => eq.id === a.equipmentId);
          const bEquipment = repairEquipment.find(eq => eq.id === b.equipmentId);
          aValue = aEquipment?.name || "";
          bValue = bEquipment?.name || "";
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
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
                Assets Needing Repairs or PM ({repairEquipment.length})
              </h3>
              {selectedItems.size > 0 && (
                <div className="flex gap-2">
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
                <p className="text-gray-400 mb-4">
                  Equipment will appear here when assigned to the repair shop from the dashboard.
                </p>
                <div className="mt-6 p-4 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/50">
                  <div className="text-4xl mb-2">🔧</div>
                  <p className="text-gray-400">Drop equipment here to send to repair shop</p>
                </div>
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
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium text-sm leading-tight">
                              {equipment.name}
                            </h4>
                          </div>
                          <p className="text-gray-400 text-xs mb-2">
                            {equipment.type}
                          </p>
                          
                          {/* Work Order Details */}
                          {equipmentWorkOrders.length > 0 ? (
                            <div className="space-y-2">
                              {equipmentWorkOrders.map((workOrder) => (
                                <div key={workOrder.id} className="bg-gray-600 p-2 rounded text-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-white font-medium">{workOrder.title}</span>
                                    <div className="flex gap-1">
                                      <Badge className={`${getPriorityColor(workOrder.priority)} text-xs px-1 py-0`}>
                                        {workOrder.priority.toUpperCase()}
                                      </Badge>
                                      <Badge className={`${getStatusColor(workOrder.status)} text-xs px-1 py-0`}>
                                        {workOrder.status.toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-gray-300 text-xs mb-1">{workOrder.description}</p>
                                  <div className="text-gray-400 text-xs">
                                    <div><strong>Reason:</strong> {workOrder.reason}</div>
                                    {workOrder.assignedTo && (
                                      <div><strong>Assigned to:</strong> {workOrder.assignedTo}</div>
                                    )}
                                    {workOrder.notes && (
                                      <div><strong>Notes:</strong> {workOrder.notes}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-600 p-2 rounded text-xs text-gray-300">
                              <p className="text-center">No work orders yet</p>
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

          {/* Work Order Activity Log */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-lg font-semibold flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Work Order Activity Log ({filteredAndSortedWorkOrders.length})
              </h3>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search work orders..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-64 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  data-testid="input-search-workorders"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white" data-testid="select-priority-filter">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleUpdateClick}
                size="sm"
                variant="outline"
                className="flex items-center gap-2 bg-blue-700 border-blue-600 text-white hover:bg-blue-600"
                disabled={selectedWorkOrders.size === 0}
                data-testid="button-update-workorders"
              >
                <Wrench className="h-4 w-4" />
                Update ({selectedWorkOrders.size})
              </Button>
              
              <div className="text-sm text-gray-400">
                Showing {filteredAndSortedWorkOrders.length} of {workOrders.length} work orders
              </div>
            </div>

            {/* Sort Headers */}
            <div className="bg-gray-700 border border-gray-600 rounded-t-lg p-3">
              <div className="grid grid-cols-10 gap-4 text-sm font-medium text-gray-300">
                <div className="col-span-1 flex items-center gap-1">
                  <Checkbox
                    checked={filteredAndSortedWorkOrders.length > 0 && filteredAndSortedWorkOrders.every(wo => selectedWorkOrders.has(wo.id))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedWorkOrders(new Set(filteredAndSortedWorkOrders.map(wo => wo.id)));
                      } else {
                        setSelectedWorkOrders(new Set());
                      }
                    }}
                    data-testid="checkbox-select-all"
                  />
                  Select
                </div>
                <button
                  onClick={() => handleSort("dateCreated")}
                  className="col-span-2 flex items-center gap-1 hover:text-white transition-colors text-left"
                  data-testid="button-sort-date"
                >
                  <Calendar className="h-4 w-4" />
                  Date
                  {sortBy === "dateCreated" && (
                    sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                
                
                <div className="col-span-5 flex items-center gap-1">
                  Details
                </div>
                
                <button
                  onClick={() => handleSort("priority")}
                  className="col-span-1 flex items-center gap-1 hover:text-white transition-colors text-left"
                  data-testid="button-sort-priority"
                >
                  Priority
                  {sortBy === "priority" && (
                    sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                
                <button
                  onClick={() => handleSort("status")}
                  className="col-span-1 flex items-center gap-1 hover:text-white transition-colors text-left"
                  data-testid="button-sort-status"
                >
                  Status
                  {sortBy === "status" && (
                    sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                
                <div className="col-span-2 flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  Comments
                </div>
                
              </div>
            </div>

            {/* Work Order Log Items */}
            <div className="border border-gray-600 border-t-0 rounded-b-lg bg-gray-800 max-h-96 overflow-y-auto">
              {filteredAndSortedWorkOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No work orders found</p>
                  {(searchFilter || statusFilter !== "all" || priorityFilter !== "all") && (
                    <p className="text-sm mt-2">Try adjusting your filters</p>
                  )}
                </div>
              ) : (
                filteredAndSortedWorkOrders.map((workOrder) => {
                  const equipment = repairEquipment.find(eq => eq.id === workOrder.equipmentId);
                  const isExpanded = expandedWorkOrder === workOrder.id;
                  
                  return (
                    <div key={workOrder.id} className="border-b border-gray-700 last:border-b-0">
                      <div 
                        className="grid grid-cols-10 gap-4 p-3 hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => setExpandedWorkOrder(isExpanded ? null : workOrder.id)}
                        data-testid={`workorder-row-${workOrder.id}`}
                      >
                        <div className="col-span-1 flex items-center">
                          <Checkbox
                            checked={selectedWorkOrders.has(workOrder.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedWorkOrders);
                              if (checked) {
                                newSelected.add(workOrder.id);
                              } else {
                                newSelected.delete(workOrder.id);
                              }
                              setSelectedWorkOrders(newSelected);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`checkbox-select-${workOrder.id}`}
                          />
                        </div>
                        
                        <div className="col-span-2 text-sm">
                          <div className="text-white font-medium">
                            {format(new Date(workOrder.dateCreated || new Date()), "MMM dd, yyyy")}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {format(new Date(workOrder.dateCreated || new Date()), "h:mm a")}
                          </div>
                        </div>
                        
                        
                        <div className="col-span-5">
                          <div className="text-white font-medium text-sm mb-1">
                            {workOrder.title}
                          </div>
                          <div className="text-gray-400 text-xs mb-1">
                            {workOrder.description}
                          </div>
                          <div className="flex items-center gap-2">
                            <Wrench className="h-3 w-3 text-orange-400" />
                            <span className="text-gray-400 text-xs">{equipment?.name || "Unknown Equipment"}</span>
                          </div>
                        </div>
                        
                        <div className="col-span-1">
                          <Badge className={`${getPriorityColor(workOrder.priority)} text-xs`}>
                            {workOrder.priority.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="col-span-1">
                          <Badge className={`${getStatusColor(workOrder.status)} text-xs`}>
                            {workOrder.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="col-span-2 text-sm">
                          <div className="text-gray-400 text-xs">
                            {workOrder.comments ? (
                              <div className="text-gray-300 truncate">{workOrder.comments}</div>
                            ) : (
                              <span className="italic">No comments</span>
                            )}
                          </div>
                        </div>
                        
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="bg-gray-750 p-4 border-t border-gray-600">
                          
                          <div className="grid grid-cols-1 gap-6">
                            <div>
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                Comments Thread
                              </h4>
                              
                              {/* Comments will load automatically via useEffect when expanded */}
                              
                              <div className="space-y-3">
                                {/* Comment History */}
                                {workOrderComments[workOrder.id] && workOrderComments[workOrder.id].length > 0 ? (
                                  workOrderComments[workOrder.id].map((comment, index) => (
                                    <div key={comment.id} className="bg-gray-700 p-3 rounded border-l-2 border-blue-400">
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="text-blue-400 text-xs font-medium">
                                          Comment #{workOrderComments[workOrder.id].length - index}
                                        </span>
                                        <span className="text-gray-400 text-xs">
                                          {format(new Date(comment.createdAt || new Date()), "MMM dd, yyyy 'at' h:mm a")} by {user?.username || comment.createdBy}
                                        </span>
                                      </div>
                                      <div className="text-gray-300 text-sm">
                                        {comment.comment}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-gray-400 italic text-sm">No comments yet. Add the first comment below.</div>
                                )}
                                
                                {/* Add New Comment */}
                                <div className="border-t border-gray-600 pt-3">
                                  <div className="flex gap-2">
                                    <Textarea
                                      placeholder="Add a comment..."
                                      value={newComment}
                                      onChange={(e) => setNewComment(e.target.value)}
                                      className="bg-gray-800 border-gray-600 text-white text-sm resize-none"
                                      rows={2}
                                      data-testid={`textarea-comment-${workOrder.id}`}
                                    />
                                    <Button
                                      onClick={() => {
                                        if (newComment.trim()) {
                                          createCommentMutation.mutate({
                                            workOrderId: workOrder.id,
                                            comment: newComment.trim()
                                          });
                                        }
                                      }}
                                      disabled={!newComment.trim() || createCommentMutation.isPending}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 shrink-0"
                                      data-testid={`button-add-comment-${workOrder.id}`}
                                    >
                                      {createCommentMutation.isPending ? "Adding..." : "Add Comment"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Hidden droppable area for drag and drop functionality */}
          <Droppable droppableId="repair-shop">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="hidden"
              >
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>

      {/* Combined Update Dialog */}
      <Dialog 
        open={showUpdateDialog} 
        onClose={() => setShowUpdateDialog(false)}
        title={
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-400" />
            Update Work Orders ({selectedWorkOrders.size})
          </div>
        }
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowUpdateDialog(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUpdate}
              disabled={updateWorkOrderMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500"
              data-testid="button-save-update"
            >
              {updateWorkOrderMutation.isPending ? "Updating..." : "Update Work Orders"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Status Update */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Status (optional)
            </label>
            <Select value={updateData.status} onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-update-status">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-change">No change</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Comments Update */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Comments (optional)
            </label>
            <Textarea
              value={updateData.comments}
              onChange={(e) => setUpdateData(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Add or update comments for these work orders..."
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[80px]"
              data-testid="textarea-update-comments"
            />
          </div>
          
          <div className="text-xs text-gray-400 bg-gray-700 p-2 rounded">
            💡 You can update status, comments, or both. Changes will be applied to all {selectedWorkOrders.size} selected work order(s).
          </div>
        </div>
      </Dialog>

    </DragDropContext>
  );
}