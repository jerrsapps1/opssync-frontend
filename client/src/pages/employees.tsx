import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

import { Plus, Edit3, Trash2, User, MapPin, Phone, Mail, Calendar, Wrench, Upload, Download } from "lucide-react";

type Employee = { 
  id: string; 
  name: string; 
  role?: string;
  email?: string; 
  phone?: string;
  yearsExperience?: number; 
  operates?: string[]; 
  currentProjectId?: string | null;
  employmentStatus?: string;
  status?: string;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Project = { id: string; name: string };

async function fetchEmployees(): Promise<Employee[]> { 
  const r = await apiRequest("GET", "/api/employees"); 
  return r.json(); 
}

async function fetchProjects(): Promise<Project[]> { 
  const r = await apiRequest("GET", "/api/projects"); 
  return r.json(); 
}

const EQUIPMENT_OPTIONS = [
  "Excavator", "Bulldozer", "Loader", "Crane", "Dump Truck", "Grader", 
  "Backhoe", "Skid Steer", "Roller", "Scraper", "Forklift", "Trencher"
];

export default function EmployeeManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: employees = [], isLoading, refetch } = useQuery({ 
    queryKey: ["employees"], 
    queryFn: fetchEmployees, 
    refetchOnWindowFocus: true 
  });
  
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state for creation/editing
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    yearsExperience: 0,
    operates: [] as string[],
    employmentStatus: "active"
  });

  const projName = React.useMemo(() => Object.fromEntries(projects.map(p => [p.id, p.name])), [projects]);

  const sortedEmployees = React.useMemo(() => {
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: any) => {
      const response = await apiRequest("POST", "/api/employees", employeeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      resetForm();
      setShowCreateDialog(false);
      toast({
        title: "Employee Created",
        description: "New employee has been successfully added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create employee.",
        variant: "destructive",
      });
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/employees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      resetForm();
      setEditingEmployee(null);
      toast({
        title: "Employee Updated",
        description: "Employee information has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update employee.",
        variant: "destructive",
      });
    }
  });

  function resetForm() {
    setFormData({
      name: "",
      role: "",
      email: "",
      phone: "",
      yearsExperience: 0,
      operates: [],
      employmentStatus: "active"
    });
    setCurrentStep(1);
  }

  function openCreateDialog() {
    resetForm();
    setShowCreateDialog(true);
  }

  function openEditDialog(employee: Employee) {
    setFormData({
      name: employee.name || "",
      role: employee.role || "",
      email: employee.email || "",
      phone: employee.phone || "",
      yearsExperience: employee.yearsExperience || 0,
      operates: employee.operates || [],
      employmentStatus: employee.employmentStatus || "active"
    });
    setEditingEmployee(employee);
    setCurrentStep(1);
  }

  function handleNext() {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  }

  function handleSubmit() {
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data: formData });
    } else {
      createEmployeeMutation.mutate(formData);
    }
  }

  function toggleEquipment(equipment: string) {
    setFormData(prev => ({
      ...prev,
      operates: prev.operates.includes(equipment)
        ? prev.operates.filter(e => e !== equipment)
        : [...prev.operates, equipment]
    }));
  }

  function downloadTemplate() {
    window.location.href = "/api/employees/template";
  }

  function handleImport() {
    if (!importFile) return;
    const body = new FormData();
    body.append("file", importFile);
    fetch("/api/employees/import", { method: "POST", body })
      .then(() => {
        refetch();
        setShowImportDialog(false);
        setImportFile(null);
        toast({
          title: "Import Successful",
          description: "Employees have been imported successfully.",
        });
      })
      .catch(() => {
        toast({
          title: "Import Failed",
          description: "Failed to import employees.",
          variant: "destructive",
        });
      });
  }


  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.name.trim() && formData.role.trim();
      case 2: return formData.email.trim() || formData.phone.trim();
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#121212] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Management</h1>
          <p className="text-gray-400 text-sm">Create, edit, and manage your workforce</p>
        </div>
        <div className="flex gap-3">
          <Button
            data-testid="button-download-template"
            onClick={downloadTemplate}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            <Download size={16} />
            Download Template
          </Button>
          <Button
            data-testid="button-import-employees"
            onClick={() => setShowImportDialog(true)}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            <Upload size={16} />
            Import
          </Button>
          <Button
            data-testid="button-create-employee"
            onClick={openCreateDialog}
            className="bg-[#4A90E2] hover:bg-[#357ABD] text-white flex items-center gap-2"
          >
            <Plus size={16} />
            Add Employee
          </Button>
        </div>
      </div>



      {/* Employee Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Current Employees ({sortedEmployees.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="p-4 bg-[#1E1E2F] border-gray-700">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-700 rounded w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedEmployees.map((employee: Employee) => (
              <Card 
                key={employee.id} 
                className="p-4 bg-[#1E1E2F] border-gray-700 hover:border-[#4A90E2] transition-colors cursor-pointer"
                data-testid={`card-employee-${employee.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4A90E2] flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{employee.name}</h3>
                      <p className="text-sm text-gray-400">{employee.role || "No role assigned"}</p>
                    </div>
                  </div>
                  <Button
                    data-testid={`button-edit-${employee.id}`}
                    onClick={() => openEditDialog(employee)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    <Edit3 size={14} />
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  {employee.email && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail size={12} />
                      <span>{employee.email}</span>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone size={12} />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  {employee.yearsExperience && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar size={12} />
                      <span>{employee.yearsExperience} years experience</span>
                    </div>
                  )}
                  {employee.currentProjectId && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin size={12} />
                      <span>{projName[employee.currentProjectId] || "Unknown Project"}</span>
                    </div>
                  )}
                  {employee.operates && employee.operates.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Wrench size={12} />
                      <span>{employee.operates.slice(0, 2).join(", ")}{employee.operates.length > 2 ? ` +${employee.operates.length - 2}` : ""}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                    employee.employmentStatus === "active" 
                      ? "bg-green-900 text-green-300" 
                      : "bg-gray-700 text-gray-300"
                  }`}>
                    {employee.employmentStatus || "active"}
                  </span>
                </div>
              </Card>
            ))}
            {sortedEmployees.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                No employees found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Employee Dialog */}
      {(showCreateDialog || editingEmployee !== null) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E2F] rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingEmployee ? "Edit Employee" : "Create New Employee"}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Step {currentStep} of 3 - {
                      currentStep === 1 ? "Basic Information" :
                      currentStep === 2 ? "Contact Details" :
                      "Skills & Experience"
                    }
                  </p>
                </div>
                <Button
                  data-testid="button-close-dialog"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingEmployee(null);
                    resetForm();
                  }}
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex gap-2">
                  {[1, 2, 3].map(step => (
                    <div
                      key={step}
                      className={`flex-1 h-2 rounded ${
                        step <= currentStep ? "bg-[#4A90E2]" : "bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="space-y-4">
                {currentStep === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        data-testid="input-employee-name"
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Job Role *
                      </label>
                      <input
                        data-testid="input-employee-role"
                        type="text"
                        value={formData.role}
                        onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        placeholder="e.g., Heavy Equipment Operator"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Employment Status
                      </label>
                      <select
                        data-testid="select-employment-status"
                        value={formData.employmentStatus}
                        onChange={e => setFormData(prev => ({ ...prev, employmentStatus: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on-leave">On Leave</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        data-testid="input-employee-email"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        data-testid="input-employee-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Years of Experience
                      </label>
                      <input
                        data-testid="input-employee-experience"
                        type="number"
                        min="0"
                        max="50"
                        value={formData.yearsExperience}
                        onChange={e => setFormData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Equipment Operated
                    </label>
                    <p className="text-xs text-gray-400 mb-3">Select all equipment this employee can operate</p>
                    <div className="grid grid-cols-2 gap-2">
                      {EQUIPMENT_OPTIONS.map(equipment => (
                        <label
                          key={equipment}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            formData.operates.includes(equipment)
                              ? "bg-[#4A90E2] border-[#4A90E2] text-white"
                              : "bg-[#121212] border-gray-700 text-gray-300 hover:border-gray-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.operates.includes(equipment)}
                            onChange={() => toggleEquipment(equipment)}
                            className="sr-only"
                          />
                          <Wrench size={14} />
                          <span className="text-sm">{equipment}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button
                  data-testid="button-previous"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={currentStep === 1}
                  variant="ghost"
                  className="text-gray-400 hover:text-white disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  data-testid="button-next"
                  onClick={handleNext}
                  disabled={!isStepValid() || createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                  className="bg-[#4A90E2] hover:bg-[#357ABD] text-white"
                >
                  {createEmployeeMutation.isPending || updateEmployeeMutation.isPending
                    ? "Saving..."
                    : currentStep === 3
                    ? (editingEmployee ? "Update Employee" : "Create Employee")
                    : "Next"
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E2F] rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Import Employees</h2>
                <Button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportFile(null);
                  }}
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Excel File
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#4A90E2] file:text-white hover:file:bg-[#357ABD]"
                  />
                </div>
                
                <div className="text-sm text-gray-400">
                  <p>Upload an Excel file with employee data. Make sure to use the correct template format.</p>
                  <p className="mt-2">
                    Don't have a template? 
                    <button 
                      onClick={downloadTemplate}
                      className="text-[#4A90E2] hover:underline ml-1"
                    >
                      Download it here
                    </button>
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportFile(null);
                  }}
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!importFile}
                  className="bg-[#4A90E2] hover:bg-[#357ABD] text-white disabled:opacity-50"
                >
                  Import
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
