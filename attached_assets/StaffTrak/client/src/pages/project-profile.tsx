import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProjectSchema, type UpdateProject, type Project, type Employee, type Equipment } from "@shared/schema";
import { ArrowLeft, MapPin, Settings, Trash2, Upload, Map } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ProjectProfile() {
  const [, params] = useRoute("/projects/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", params?.id],
    enabled: !!params?.id,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const form = useForm<UpdateProject>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      projectNumber: project?.projectNumber || "",
      name: project?.name || "",
      location: project?.location || "",
      gpsLatitude: project?.gpsLatitude || "",
      gpsLongitude: project?.gpsLongitude || "",
      description: project?.description || "",
      status: project?.status || "active",
      progress: project?.progress || 0,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProject) => {
      return apiRequest(`/api/projects/${params?.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowEditDialog(false);
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/projects/${params?.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation("/dashboard");
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-4"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <Button onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const assignedEmployees = employees.filter(emp => emp.currentProjectId === project.id);
  const assignedEquipment = equipment.filter(eq => eq.currentProjectId === project.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "planning": return "bg-blue-500";
      case "completed": return "bg-gray-500";
      case "paused": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-project-name">{project.name}</h1>
              <p className="text-gray-400" data-testid="text-project-number">Project #{project.projectNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-edit-project">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Edit Project</DialogTitle>
                  <DialogDescription>
                    Update project details, location, and settings.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="projectNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="PRJ-2025-001" data-testid="input-project-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-project-status">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="planning">Planning</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Downtown Mall Renovation" data-testid="input-project-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Seattle, WA" data-testid="input-project-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="gpsLatitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GPS Latitude</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="47.6062" data-testid="input-gps-latitude" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gpsLongitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GPS Longitude</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="-122.3321" data-testid="input-gps-longitude" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Project description..." data-testid="textarea-project-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="progress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Progress (%)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              max="100"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-project-progress"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowEditDialog(false)}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateMutation.isPending}
                        data-testid="button-save-project"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" data-testid="button-delete-project">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Delete Project</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{project.name}"? This action cannot be undone.
                    All assigned employees and equipment will be unassigned.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                    data-testid="button-cancel-delete"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Status</Label>
                    <div className="flex items-center mt-1">
                      
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Progress</Label>
                    <div className="mt-1">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm" data-testid="text-project-progress">{project.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-400">Location</Label>
                  <p className="mt-1" data-testid="text-project-location">{project.location}</p>
                </div>
                {project.gpsLatitude && project.gpsLongitude && (
                  <div>
                    <Label className="text-gray-400">GPS Coordinates</Label>
                    <p className="mt-1" data-testid="text-gps-coordinates">
                      {project.gpsLatitude}, {project.gpsLongitude}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open(`https://maps.google.com?q=${project.gpsLatitude},${project.gpsLongitude}`, '_blank')}
                      data-testid="button-view-map"
                    >
                      <Map className="w-4 h-4 mr-2" />
                      View on Google Maps
                    </Button>
                  </div>
                )}
                {project.description && (
                  <div>
                    <Label className="text-gray-400">Description</Label>
                    <p className="mt-1" data-testid="text-project-description">{project.description}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-400">KMZ File Attachment</Label>
                  <div className="mt-2">
                    {project.kmzFileUrl ? (
                      <Button variant="outline" size="sm" data-testid="button-download-kmz">
                        <Upload className="w-4 h-4 mr-2" />
                        Download KMZ File
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" data-testid="button-upload-kmz">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload KMZ File
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assigned Resources */}
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Assigned Employees</CardTitle>
                <CardDescription>{assignedEmployees.length} assigned</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignedEmployees.length > 0 ? (
                  assignedEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-2 bg-gray-700 rounded" data-testid={`employee-${employee.id}`}>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-gray-400">{employee.role}</p>
                      </div>
                      
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4" data-testid="text-no-employees">No employees assigned</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Assigned Equipment</CardTitle>
                <CardDescription>{assignedEquipment.length} assigned</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignedEquipment.length > 0 ? (
                  assignedEquipment.map((eq) => (
                    <div key={eq.id} className="flex items-center justify-between p-2 bg-gray-700 rounded" data-testid={`equipment-${eq.id}`}>
                      <div>
                        <p className="font-medium">{eq.name}</p>
                        <p className="text-sm text-gray-400">{eq.type}</p>
                      </div>
                      
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4" data-testid="text-no-equipment">No equipment assigned</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}