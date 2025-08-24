import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, MessageCircle, Clock, User, ChevronDown, ChevronUp } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { WorkOrder, WorkOrderComment, Equipment } from "@shared/schema";

async function getWorkOrders(): Promise<WorkOrder[]> {
  const response = await apiRequest("GET", "/api/work-orders");
  return response.json();
}

async function getEquipment(): Promise<Equipment[]> {
  const response = await apiRequest("GET", "/api/equipment");
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

export default function MessageCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // State for filtering and sorting
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [expandedWorkOrder, setExpandedWorkOrder] = useState<string | null>(null);
  
  // Comments state
  const [workOrderComments, setWorkOrderComments] = useState<Record<string, WorkOrderComment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [loadedComments, setLoadedComments] = useState<Set<string>>(new Set());

  const { data: workOrders = [] } = useQuery({
    queryKey: ["/api", "work-orders"],
    queryFn: getWorkOrders,
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ["/api", "equipment"],
    queryFn: getEquipment,
  });

  // Load comments mutation
  const loadCommentsMutation = useMutation({
    mutationFn: async (workOrderId: string) => {
      const comments = await getWorkOrderComments(workOrderId);
      return { workOrderId, comments };
    },
    onSuccess: (data) => {
      setWorkOrderComments(prev => ({
        ...prev,
        [data.workOrderId]: data.comments
      }));
      setLoadedComments(prev => new Set(prev).add(data.workOrderId));
    }
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ workOrderId, comment }: { workOrderId: string; comment: string }) => {
      const newComment = await createWorkOrderComment(workOrderId, comment);
      return { workOrderId, newComment };
    },
    onSuccess: (data) => {
      setWorkOrderComments(prev => ({
        ...prev,
        [data.workOrderId]: [data.newComment, ...(prev[data.workOrderId] || [])]
      }));
      setNewComment("");
      toast({
        title: "Comment Added",
        description: "Your message has been added to the work order.",
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
  const handleToggleExpanded = (workOrderId: string) => {
    if (expandedWorkOrder === workOrderId) {
      setExpandedWorkOrder(null);
    } else {
      setExpandedWorkOrder(workOrderId);
      if (!loadedComments.has(workOrderId)) {
        loadCommentsMutation.mutate(workOrderId);
      }
    }
  };

  // Helper function to get equipment name
  const getEquipmentName = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq?.name || "Unknown Equipment";
  };

  // Filter work orders
  const filteredWorkOrders = workOrders.filter(workOrder => {
    const equipmentName = getEquipmentName(workOrder.equipmentId);
    const matchesSearch = !searchFilter || 
      workOrder.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      equipmentName.toLowerCase().includes(searchFilter.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || workOrder.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || workOrder.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'on-hold': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            Message Center
          </h1>
          <p className="text-gray-400">View and manage work order messages and comments</p>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filter Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="Search work orders..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Showing {filteredWorkOrders.length} of {workOrders.length} work orders
            </div>
          </CardContent>
        </Card>

        {/* Work Orders with Messages */}
        <div className="space-y-4">
          {filteredWorkOrders.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400 text-center">No work orders found</p>
              </CardContent>
            </Card>
          ) : (
            filteredWorkOrders.map((workOrder) => {
              const isExpanded = expandedWorkOrder === workOrder.id;
              const comments = workOrderComments[workOrder.id] || [];
              
              return (
                <Card key={workOrder.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => handleToggleExpanded(workOrder.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{workOrder.title}</h3>
                          <Badge className={`text-xs border ${getPriorityColor(workOrder.priority)}`}>
                            {workOrder.priority}
                          </Badge>
                          <Badge className={`text-xs border ${getStatusColor(workOrder.status)}`}>
                            {workOrder.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{getEquipmentName(workOrder.equipmentId)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {workOrder.dateCreated ? formatDistanceToNow(new Date(workOrder.dateCreated), { addSuffix: true }) : "No date"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {comments.length} messages
                          </span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent>
                      <div className="border-t border-gray-700 pt-4">
                        {/* Comments Section */}
                        <div className="space-y-4 mb-4">
                          {loadCommentsMutation.isPending && !loadedComments.has(workOrder.id) && (
                            <div className="text-center py-4 text-gray-400">
                              Loading messages...
                            </div>
                          )}
                          
                          {loadedComments.has(workOrder.id) && comments.length === 0 && (
                            <div className="text-center py-4 text-gray-400">
                              No messages yet. Be the first to add a comment!
                            </div>
                          )}

                          {comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-white">
                                      {comment.createdBy || user?.username || 'Unknown'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {format(new Date(comment.createdAt), 'MMM d, yyyy at h:mm a')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                                    {comment.comment}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Comment */}
                        <div className="bg-gray-800 rounded-lg p-3">
                          <div className="flex gap-3 items-end">
                            <div className="flex-1">
                              <Textarea
                                placeholder="Type a message..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (newComment.trim()) {
                                      createCommentMutation.mutate({
                                        workOrderId: workOrder.id,
                                        comment: newComment.trim()
                                      });
                                    }
                                  }
                                }}
                                className="bg-gray-700 border-gray-600 text-white text-sm resize-none rounded-lg"
                                rows={1}
                              />
                            </div>
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
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shrink-0"
                            >
                              {createCommentMutation.isPending ? "..." : "Send"}
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Press Enter to send, Shift+Enter for new line
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}