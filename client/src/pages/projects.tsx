import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ImportExportPanel from "@/components/common/ImportExportPanel";
import { Plus, Edit3, MapPin, Calendar, Building, Target, X, UserPlus, DollarSign, AlertTriangle, Flag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Project = {
  id: string;
  name: string;
  projectNumber?: string;
  location?: string;
  status?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  percentComplete?: number;
  percentMode?: "auto" | "manual";
  description?: string;
  // Analytics fields
  projectType?: string;
  estimatedBudget?: number;
  actualCost?: number;
  contractValue?: number;
  profitMargin?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  priority?: "low" | "medium" | "high" | "urgent";
  createdAt?: string;
  updatedAt?: string;
};

async function fetchProjects(): Promise<Project[]> {
  const r = await apiRequest("GET", "/api/projects");
  return r.json();
}

const PROJECT_STATUSES = [
  "Planning", "Active", "On Hold", "Completed", "Cancelled"
];

const PROJECT_TYPES = [
  "Residential Construction", "Commercial Construction", "Infrastructure",
  "Demolition", "Renovation", "Road Construction", "Bridge Construction",
  "Site Preparation", "Excavation", "Utility Installation"
];

export default function ProjectSetUpPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    refetchOnWindowFocus: true
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Form state for creation/editing
  const [formData, setFormData] = useState({
    name: "",
    projectNumber: "",
    location: "",
    status: "Planning",
    startDate: "",
    endDate: "",
    description: "",
    percentMode: "auto" as "auto" | "manual",
    percentComplete: 0,
    // Analytics fields
    projectType: "",
    estimatedBudget: "",
    actualCost: "",
    contractValue: "",
    profitMargin: "",
    riskLevel: "medium" as "low" | "medium" | "high" | "critical",
    priority: "medium" as "low" | "medium" | "high" | "urgent"
  });

  // Contact persons state
  const [contacts, setContacts] = useState([
    {
      name: "",
      position: "",
      email: "",
      mobile: "",
      company: "",
      isPrimary: false
    }
  ]);

  const filteredProjects = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(proj =>
      proj.name.toLowerCase().includes(query) ||
      (proj.projectNumber || "").toLowerCase().includes(query) ||
      (proj.location || "").toLowerCase().includes(query) ||
      (proj.status || "").toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await apiRequest("POST", "/api/projects", projectData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      resetForm();
      setShowCreateDialog(false);
      toast({
        title: "Project Created",
        description: "New project has been successfully added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create project.",
        variant: "destructive",
      });
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/projects/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      resetForm();
      setEditingProject(null);
      toast({
        title: "Project Updated",
        description: "Project information has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update project.",
        variant: "destructive",
      });
    }
  });

  function resetForm() {
    setFormData({
      name: "",
      projectNumber: "",
      location: "",
      status: "Planning",
      startDate: "",
      endDate: "",
      description: "",
      percentMode: "auto",
      percentComplete: 0,
      projectType: "",
      estimatedBudget: "",
      actualCost: "",
      contractValue: "",
      profitMargin: "",
      riskLevel: "medium",
      priority: "medium"
    });
    setContacts([
      {
        name: "",
        position: "",
        email: "",
        mobile: "",
        company: "",
        isPrimary: false
      }
    ]);
    setCurrentStep(1);
  }

  function openCreateDialog() {
    resetForm();
    setShowCreateDialog(true);
  }

  function openEditDialog(project: Project) {
    setFormData({
      name: project.name || "",
      projectNumber: project.projectNumber || "",
      location: project.location || "",
      status: project.status || "Planning",
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
      description: project.description || "",
      percentMode: project.percentMode || "auto",
      percentComplete: project.percentComplete || 0,
      projectType: project.projectType || "",
      estimatedBudget: project.estimatedBudget ? (project.estimatedBudget / 100).toString() : "",
      actualCost: project.actualCost ? (project.actualCost / 100).toString() : "",
      contractValue: project.contractValue ? (project.contractValue / 100).toString() : "",
      profitMargin: project.profitMargin ? project.profitMargin.toString() : "",
      riskLevel: project.riskLevel || "medium",
      priority: project.priority || "medium"
    });
    setEditingProject(project);
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
    const submitData = {
      ...formData,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      // Convert budget amounts from dollars to cents
      estimatedBudget: formData.estimatedBudget ? Math.round(parseFloat(formData.estimatedBudget) * 100) : null,
      actualCost: formData.actualCost ? Math.round(parseFloat(formData.actualCost) * 100) : null,
      contractValue: formData.contractValue ? Math.round(parseFloat(formData.contractValue) * 100) : null,
      profitMargin: formData.profitMargin ? parseInt(formData.profitMargin) : null,
    };

    console.log('Submitting project data:', submitData);

    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data: submitData });
    } else {
      createProjectMutation.mutate(submitData);
    }
  }

  function importProjects(file: File) {
    const body = new FormData();
    body.append("file", file);
    fetch("/api/projects/import", { method: "POST", body }).then(() => refetch());
  }

  function exportProjects() {
    window.location.href = "/api/projects/export";
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.name.trim() && formData.projectNumber.trim() && formData.location.trim();
      case 2: return true; // Analytics fields are optional
      case 3: {
        // At least one contact with all required fields filled, or allow empty contacts
        if (contacts.length === 0) return true;
        const validContacts = contacts.filter(contact => 
          contact.name.trim() && contact.position.trim() && 
          contact.email.trim() && contact.mobile.trim() && contact.company.trim()
        );
        // Allow submission if there's at least one valid contact or all contacts are empty
        return validContacts.length > 0 || contacts.every(contact => 
          !contact.name.trim() && !contact.position.trim() && 
          !contact.email.trim() && !contact.mobile.trim() && !contact.company.trim()
        );
      }
      default: return false;
    }
  };

  function addContact() {
    setContacts([...contacts, {
      name: "",
      position: "",
      email: "",
      mobile: "",
      company: "",
      isPrimary: false
    }]);
  }

  function removeContact(index: number) {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  }

  function updateContact(index: number, field: string, value: string | boolean) {
    const updatedContacts = contacts.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    );
    setContacts(updatedContacts);
  }

  const formatDate = (dateStr?: Date | string | null) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Active": return "bg-green-900 text-green-300";
      case "Planning": return "bg-blue-900 text-blue-300";
      case "On Hold": return "bg-yellow-900 text-yellow-300";
      case "Completed": return "bg-purple-900 text-purple-300";
      case "Cancelled": return "bg-red-900 text-red-300";
      default: return "bg-gray-700 text-gray-300";
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#121212] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Project Set-Up</h1>
          <p className="text-gray-400 text-sm">Create, configure, and manage your construction projects</p>
        </div>
        <div className="flex gap-3">
          <input
            data-testid="input-project-search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="px-4 py-2 rounded-lg bg-[#1E1E2F] border border-gray-700 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent w-64"
          />
          <Button
            data-testid="button-create-project"
            onClick={openCreateDialog}
            className="bg-[#4A90E2] hover:bg-[#357ABD] text-white flex items-center gap-2"
          >
            <Plus size={16} />
            Add Project
          </Button>
        </div>
      </div>

      {/* Import/Export Panel */}
      <ImportExportPanel
        title="Project Data"
        onImport={importProjects}
        onExport={exportProjects}
        templateUrl="/templates/projects_template.csv"
      />

      {/* Project Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Current Projects ({filteredProjects.length})
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
            {filteredProjects.map(project => (
              <Card
                key={project.id}
                className="p-4 bg-[#1E1E2F] border-gray-700 hover:border-[#4A90E2] transition-colors cursor-pointer"
                data-testid={`card-project-${project.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#CF6679] flex items-center justify-center">
                      <Building size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{project.name}</h3>
                      <p className="text-sm text-gray-400">{project.projectNumber || "No project number"}</p>
                    </div>
                  </div>
                  <Button
                    data-testid={`button-edit-${project.id}`}
                    onClick={() => openEditDialog(project)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    <Edit3 size={14} />
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  {project.location && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin size={12} />
                      <span>{project.location}</span>
                    </div>
                  )}
                  {project.startDate && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar size={12} />
                      <span>Started: {formatDate(project.startDate)}</span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Target size={12} />
                      <span>Due: {formatDate(project.endDate)}</span>
                    </div>
                  )}
                  {typeof project.percentComplete === 'number' && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-[#4A90E2] h-2 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, project.percentComplete))}%` }}
                        />
                      </div>
                      <span className="text-xs whitespace-nowrap">{Math.round(project.percentComplete)}%</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                    {project.status || "Planning"}
                  </span>
                </div>
              </Card>
            ))}
            {filteredProjects.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                No projects found matching your search.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Project Dialog */}
      {(showCreateDialog || editingProject !== null) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E2F] rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingProject ? "Edit Project" : "Create New Project"}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Step {currentStep} of 3 - {
                      currentStep === 1 ? "Project Details" :
                      currentStep === 2 ? "Analytics & Financial" :
                      "Contact Persons"
                    }
                  </p>
                </div>
                <Button
                  data-testid="button-close-dialog"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingProject(null);
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
                {/* STEP 1: Basic Information */}
                {currentStep === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Project Name *</Label>
                        <Input
                          data-testid="input-project-name"
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter project name"
                          className="bg-[#121212] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Project Number *</Label>
                        <Input
                          data-testid="input-project-number"
                          value={formData.projectNumber}
                          onChange={e => setFormData(prev => ({ ...prev, projectNumber: e.target.value }))}
                          placeholder="e.g., PROJ-2025-001"
                          className="bg-[#121212] border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-gray-300">Location *</Label>
                      <Input
                        data-testid="input-project-location"
                        value={formData.location}
                        onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter project location or address"
                        className="bg-[#121212] border-gray-700 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger className="bg-[#121212] border-gray-700 text-white">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_STATUSES.map(status => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-300">Priority</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={value => setFormData(prev => ({ ...prev, priority: value as any }))}
                        >
                          <SelectTrigger className="bg-[#121212] border-gray-700 text-white">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Start Date</Label>
                        <Input
                          data-testid="input-project-start-date"
                          type="date"
                          value={formData.startDate}
                          onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          className="bg-[#121212] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">End Date</Label>
                        <Input
                          data-testid="input-project-end-date"
                          type="date"
                          value={formData.endDate}
                          onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          className="bg-[#121212] border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 2: Analytics & Financial */}
                {currentStep === 2 && (
                  <>
                    <div>
                      <Label className="text-gray-300">Project Type *</Label>
                      <Select
                        value={formData.projectType}
                        onValueChange={value => setFormData(prev => ({ ...prev, projectType: value }))}
                      >
                        <SelectTrigger className="bg-[#121212] border-gray-700 text-white">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-300">Description</Label>
                      <Textarea
                        data-testid="textarea-project-description"
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        placeholder="Enter project description, scope, or notes..."
                        className="bg-[#121212] border-gray-700 text-white resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 flex items-center gap-2">
                          <DollarSign size={16} />
                          Contract Value
                        </Label>
                        <Input
                          type="number"
                          value={formData.contractValue}
                          onChange={e => setFormData(prev => ({ ...prev, contractValue: e.target.value }))}
                          placeholder="0.00"
                          className="bg-[#121212] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300 flex items-center gap-2">
                          <DollarSign size={16} />
                          Estimated Budget
                        </Label>
                        <Input
                          type="number"
                          value={formData.estimatedBudget}
                          onChange={e => setFormData(prev => ({ ...prev, estimatedBudget: e.target.value }))}
                          placeholder="0.00"
                          className="bg-[#121212] border-gray-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 flex items-center gap-2">
                          <Flag size={16} />
                          Profit Margin (%)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.profitMargin}
                          onChange={e => setFormData(prev => ({ ...prev, profitMargin: e.target.value }))}
                          placeholder="0"
                          className="bg-[#121212] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300 flex items-center gap-2">
                          <AlertTriangle size={16} />
                          Risk Level
                        </Label>
                        <Select
                          value={formData.riskLevel}
                          onValueChange={value => setFormData(prev => ({ ...prev, riskLevel: value as any }))}
                        >
                          <SelectTrigger className="bg-[#121212] border-gray-700 text-white">
                            <SelectValue placeholder="Select risk level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 3: Contact Persons */}
                {currentStep === 3 && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Label className="text-gray-300 text-base">Contact Persons</Label>
                        <p className="text-sm text-gray-400">General contractors and project contacts</p>
                      </div>
                      <Button
                        type="button"
                        onClick={addContact}
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-300 hover:text-white"
                      >
                        <UserPlus size={16} className="mr-2" />
                        Add Contact
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {contacts.map((contact, index) => (
                        <div key={index} className="border border-gray-700 rounded-lg p-4 bg-[#0F0F0F]">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-white font-medium">Contact {index + 1}</h4>
                            {contacts.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeContact(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              >
                                <X size={16} />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-gray-300">Name *</Label>
                              <Input
                                value={contact.name}
                                onChange={e => updateContact(index, 'name', e.target.value)}
                                placeholder="Full name"
                                className="bg-[#121212] border-gray-700 text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-300">Position *</Label>
                              <Input
                                value={contact.position}
                                onChange={e => updateContact(index, 'position', e.target.value)}
                                placeholder="Job title/role"
                                className="bg-[#121212] border-gray-700 text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <Label className="text-gray-300">Email *</Label>
                              <Input
                                type="email"
                                value={contact.email}
                                onChange={e => updateContact(index, 'email', e.target.value)}
                                placeholder="email@company.com"
                                className="bg-[#121212] border-gray-700 text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-300">Mobile *</Label>
                              <Input
                                type="tel"
                                value={contact.mobile}
                                onChange={e => updateContact(index, 'mobile', e.target.value)}
                                placeholder="(555) 123-4567"
                                className="bg-[#121212] border-gray-700 text-white"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <Label className="text-gray-300">Company *</Label>
                            <Input
                              value={contact.company}
                              onChange={e => updateContact(index, 'company', e.target.value)}
                              placeholder="Company name"
                              className="bg-[#121212] border-gray-700 text-white"
                            />
                          </div>

                          <div className="mt-4 flex items-center space-x-2">
                            <Checkbox
                              id={`primary-${index}`}
                              checked={contact.isPrimary}
                              onCheckedChange={checked => {
                                // Only one contact can be primary
                                const updatedContacts = contacts.map((c, i) => 
                                  i === index ? { ...c, isPrimary: !!checked } : { ...c, isPrimary: false }
                                );
                                setContacts(updatedContacts);
                              }}
                              className="border-gray-700"
                            />
                            <Label htmlFor={`primary-${index}`} className="text-gray-300 text-sm">
                              Primary contact
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
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
                  disabled={!isStepValid() || createProjectMutation.isPending || updateProjectMutation.isPending}
                  className="bg-[#4A90E2] hover:bg-[#357ABD] text-white"
                >
                  {createProjectMutation.isPending || updateProjectMutation.isPending
                    ? "Saving..."
                    : currentStep === 3
                    ? (editingProject ? "Update Project" : "Create Project")
                    : "Next"
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}