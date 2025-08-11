import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertProjectSchema, 
  insertEmployeeSchema, 
  insertEquipmentSchema,
  updateEmployeeSchema,
  updateEquipmentSchema,
  type InsertProject, 
  type InsertEmployee, 
  type InsertEquipment,
  type UpdateEmployee,
  type UpdateEquipment,
  type Project, 
  type Employee, 
  type Equipment 
} from "@shared/schema";
import { Settings as SettingsIcon, Plus, Edit, UserCheck, UserX, AlertTriangle, Wrench, Download, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("projects");
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  // Forms
  const projectForm = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      projectNumber: "",
      name: "",
      location: "",
      gpsLatitude: "",
      gpsLongitude: "",
      description: "",
      status: "planning",
      progress: 0,
    },
  });

  const employeeForm = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      role: "",
      email: "",
      phone: "",
      employmentStatus: "active",
      status: "available",
    },
  });

  const equipmentForm = useForm<InsertEquipment>({
    resolver: zodResolver(insertEquipmentSchema),
    defaultValues: {
      name: "",
      type: "",
      make: "",
      model: "",
      assetNumber: "",
      serialNumber: "",
      status: "available",
    },
  });

  const employeeUpdateForm = useForm<UpdateEmployee>({
    resolver: zodResolver(updateEmployeeSchema),
  });

  const equipmentUpdateForm = useForm<UpdateEquipment>({
    resolver: zodResolver(updateEquipmentSchema),
  });

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      return apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowAddProject(false);
      projectForm.reset();
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      return apiRequest("/api/employees", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setShowAddEmployee(false);
      employeeForm.reset();
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      });
    },
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async (data: InsertEquipment) => {
      return apiRequest("/api/equipment", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      setShowAddEquipment(false);
      equipmentForm.reset();
      toast({
        title: "Success",
        description: "Equipment added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add equipment",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEmployee }) => {
      return apiRequest(`/api/employees/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setSelectedEmployee(null);
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEquipment }) => {
      return apiRequest(`/api/equipment/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      setSelectedEquipment(null);
      toast({
        title: "Success",
        description: "Equipment updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update equipment",
        variant: "destructive",
      });
    },
  });

  const getEmploymentStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "terminated": return "bg-red-500";
      case "standby": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "busy": case "in-use": return "bg-blue-500";
      case "offline": case "maintenance": return "bg-yellow-500";
      case "broken": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  // Excel Import/Export Functions
  const exportEquipmentToExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/equipment/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equipment-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Equipment data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export equipment data",
        variant: "destructive",
      });
    }
  };

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('excel', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/equipment/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setImportStatus({ type: 'error', message: result.message || 'Import failed' });
        return;
      }

      setImportStatus({ 
        type: 'success', 
        message: result.message 
      });

      // Refresh equipment data
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });

      toast({
        title: "Import Completed",
        description: result.message,
      });

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear status after 5 seconds
      setTimeout(() => setImportStatus(null), 5000);

    } catch (error) {
      setImportStatus({ type: 'error', message: 'Import failed' });
      toast({
        title: "Error",
        description: "Failed to import equipment data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <SettingsIcon className="w-6 h-6 mr-3" />
          <h1 className="text-2xl font-bold" data-testid="text-settings-title">Settings</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="projects" data-testid="tab-projects">Project Settings</TabsTrigger>
            <TabsTrigger value="employees" data-testid="tab-employees">Employee Profiles</TabsTrigger>
            <TabsTrigger value="equipment" data-testid="tab-equipment">Equipment Management</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Management</CardTitle>
                    <CardDescription>Create and manage construction projects</CardDescription>
                  </div>
                  <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-project">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create New Project</DialogTitle>
                        <DialogDescription>
                          Add a new construction or demolition project with GPS location and details.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...projectForm}>
                        <form onSubmit={projectForm.handleSubmit((data) => createProjectMutation.mutate(data))} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={projectForm.control}
                              name="projectNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Number *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="PRJ-2025-001" data-testid="input-new-project-number" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={projectForm.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-new-project-status">
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="planning">Planning</SelectItem>
                                      <SelectItem value="active">Active</SelectItem>
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
                            control={projectForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Downtown Mall Renovation" data-testid="input-new-project-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={projectForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Seattle, WA" data-testid="input-new-project-location" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={projectForm.control}
                              name="gpsLatitude"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>GPS Latitude</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="47.6062" data-testid="input-new-gps-latitude" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={projectForm.control}
                              name="gpsLongitude"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>GPS Longitude</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="-122.3321" data-testid="input-new-gps-longitude" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={projectForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="Project description..." data-testid="textarea-new-project-description" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowAddProject(false)}
                              data-testid="button-cancel-add-project"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createProjectMutation.isPending}
                              data-testid="button-save-new-project"
                            >
                              {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg" data-testid={`project-card-${project.id}`}>
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-gray-400">#{project.projectNumber} • {project.location}</p>
                        {project.gpsLatitude && project.gpsLongitude && (
                          <p className="text-xs text-gray-500">GPS: {project.gpsLatitude}, {project.gpsLongitude}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(project.status)} text-white`}>
                          {project.status}
                        </Badge>
                        <span className="text-sm text-gray-400">{project.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Employee Management</CardTitle>
                    <CardDescription>Add, terminate, and manage employee status</CardDescription>
                  </div>
                  <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-employee">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Employee
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add New Employee</DialogTitle>
                        <DialogDescription>
                          Add a new employee to the workforce.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...employeeForm}>
                        <form onSubmit={employeeForm.handleSubmit((data) => createEmployeeMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={employeeForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="John Smith" data-testid="input-new-employee-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={employeeForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Heavy Equipment Operator" data-testid="input-new-employee-role" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={employeeForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="email" placeholder="john@company.com" data-testid="input-new-employee-email" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={employeeForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="(555) 123-4567" data-testid="input-new-employee-phone" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={employeeForm.control}
                            name="employmentStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employment Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-new-employee-status">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="standby">Standby</SelectItem>
                                    <SelectItem value="terminated">Terminated</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowAddEmployee(false)}
                              data-testid="button-cancel-add-employee"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createEmployeeMutation.isPending}
                              data-testid="button-save-new-employee"
                            >
                              {createEmployeeMutation.isPending ? "Adding..." : "Add Employee"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg" data-testid={`employee-card-${employee.id}`}>
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">{employee.name}</h3>
                          <p className="text-sm text-gray-400">{employee.role}</p>
                          {employee.email && <p className="text-xs text-gray-500">{employee.email}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getEmploymentStatusColor(employee.employmentStatus)} text-white`}>
                          {employee.employmentStatus}
                        </Badge>
                        <Badge className={`${getStatusColor(employee.status)} text-white`}>
                          {employee.status}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                employeeUpdateForm.reset({
                                  name: employee.name,
                                  role: employee.role,
                                  email: employee.email || "",
                                  phone: employee.phone || "",
                                  employmentStatus: employee.employmentStatus,
                                  status: employee.status,
                                });
                              }}
                              data-testid={`button-edit-employee-${employee.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-800 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white">Edit Employee</DialogTitle>
                              <DialogDescription>
                                Update employee information and status.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...employeeUpdateForm}>
                              <form onSubmit={employeeUpdateForm.handleSubmit((data) => 
                                updateEmployeeMutation.mutate({ id: employee.id, data })
                              )} className="space-y-4">
                                <FormField
                                  control={employeeUpdateForm.control}
                                  name="employmentStatus"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Employment Status</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-edit-employee-status">
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="active">Active</SelectItem>
                                          <SelectItem value="standby">Standby</SelectItem>
                                          <SelectItem value="terminated">Terminated</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end space-x-2 pt-4">
                                  <Button
                                    type="submit"
                                    disabled={updateEmployeeMutation.isPending}
                                    data-testid="button-save-employee-changes"
                                  >
                                    {updateEmployeeMutation.isPending ? "Saving..." : "Save Changes"}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-6">
            {/* Excel Import/Export Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Bulk Equipment Management</CardTitle>
                <CardDescription>Import and export equipment data using Excel files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Button 
                    onClick={exportEquipmentToExcel} 
                    variant="outline"
                    className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                    data-testid="button-export-equipment"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export to Excel
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={handleExcelImport}
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="outline"
                    className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                    data-testid="button-import-equipment"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import from Excel
                  </Button>
                </div>
                {importStatus && (
                  <Alert className={importStatus.type === 'success' ? 'border-green-600' : 'border-red-600'}>
                    <AlertDescription>{importStatus.message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Equipment Management</CardTitle>
                    <CardDescription>Add and edit equipment details, type, make, model, and asset numbers</CardDescription>
                  </div>
                  <Dialog open={showAddEquipment} onOpenChange={setShowAddEquipment}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-equipment">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Equipment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add New Equipment</DialogTitle>
                        <DialogDescription>
                          Add new equipment with detailed specifications.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...equipmentForm}>
                        <form onSubmit={equipmentForm.handleSubmit((data) => createEquipmentMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={equipmentForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Equipment Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Excavator CAT-320" data-testid="input-new-equipment-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={equipmentForm.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Type *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Heavy Machinery" data-testid="input-new-equipment-type" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={equipmentForm.control}
                              name="make"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Make</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Caterpillar" data-testid="input-new-equipment-make" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={equipmentForm.control}
                              name="model"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Model</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="320" data-testid="input-new-equipment-model" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={equipmentForm.control}
                              name="assetNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Asset Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="AST-001" data-testid="input-new-equipment-asset" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={equipmentForm.control}
                            name="serialNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Serial Number</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="EXC-001" data-testid="input-new-equipment-serial" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={equipmentForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-new-equipment-status">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="in-use">In Use</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                    <SelectItem value="broken">Broken</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowAddEquipment(false)}
                              data-testid="button-cancel-add-equipment"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createEquipmentMutation.isPending}
                              data-testid="button-save-new-equipment"
                            >
                              {createEquipmentMutation.isPending ? "Adding..." : "Add Equipment"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {equipment.map((eq) => (
                    <div key={eq.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg" data-testid={`equipment-card-${eq.id}`}>
                      <div>
                        <h3 className="font-semibold">{eq.name}</h3>
                        <p className="text-sm text-gray-400">{eq.type} • {eq.make} {eq.model}</p>
                        <div className="flex space-x-4 text-xs text-gray-500">
                          {eq.assetNumber && <span>Asset: {eq.assetNumber}</span>}
                          {eq.serialNumber && <span>Serial: {eq.serialNumber}</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(eq.status)} text-white`}>
                          {eq.status}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEquipment(eq);
                                equipmentUpdateForm.reset({
                                  name: eq.name,
                                  type: eq.type,
                                  make: eq.make || "",
                                  model: eq.model || "",
                                  assetNumber: eq.assetNumber || "",
                                  serialNumber: eq.serialNumber || "",
                                  status: eq.status,
                                });
                              }}
                              data-testid={`button-edit-equipment-${eq.id}`}
                            >
                              <Wrench className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-800 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white">Edit Equipment</DialogTitle>
                              <DialogDescription>
                                Update equipment details and specifications.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...equipmentUpdateForm}>
                              <form onSubmit={equipmentUpdateForm.handleSubmit((data) => 
                                updateEquipmentMutation.mutate({ id: eq.id, data })
                              )} className="space-y-4">
                                <FormField
                                  control={equipmentUpdateForm.control}
                                  name="make"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Make</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="Caterpillar" data-testid="input-edit-equipment-make" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={equipmentUpdateForm.control}
                                  name="model"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Model</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="320" data-testid="input-edit-equipment-model" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={equipmentUpdateForm.control}
                                  name="assetNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Asset Number</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="AST-001" data-testid="input-edit-equipment-asset" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={equipmentUpdateForm.control}
                                  name="status"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Status</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-edit-equipment-status">
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="available">Available</SelectItem>
                                          <SelectItem value="in-use">In Use</SelectItem>
                                          <SelectItem value="maintenance">Maintenance</SelectItem>
                                          <SelectItem value="broken">Broken</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end space-x-2 pt-4">
                                  <Button
                                    type="submit"
                                    disabled={updateEquipmentMutation.isPending}
                                    data-testid="button-save-equipment-changes"
                                  >
                                    {updateEquipmentMutation.isPending ? "Saving..." : "Save Changes"}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}