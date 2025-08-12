import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ImportExportPanel from "@/components/common/ImportExportPanel";
import { Plus, Edit3, MapPin, Calendar, Building, Target } from "lucide-react";

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
    percentComplete: 0
  });

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
      percentComplete: 0
    });
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
      percentComplete: project.percentComplete || 0
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
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      endDate: formData.endDate ? new Date(formData.endDate) : null,
    };

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
      case 1: return formData.name.trim() && formData.status.trim();
      case 2: return formData.location.trim();
      case 3: return true;
      default: return false;
    }
  };

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
                      currentStep === 1 ? "Basic Information" :
                      currentStep === 2 ? "Location & Dates" :
                      "Progress & Details"
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
                {currentStep === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Project Name *
                      </label>
                      <input
                        data-testid="input-project-name"
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        placeholder="Enter project name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Project Number
                      </label>
                      <input
                        data-testid="input-project-number"
                        type="text"
                        value={formData.projectNumber}
                        onChange={e => setFormData(prev => ({ ...prev, projectNumber: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        placeholder="e.g., PROJ-2025-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Status *
                      </label>
                      <select
                        data-testid="select-project-status"
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      >
                        {PROJECT_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Project Location *
                      </label>
                      <input
                        data-testid="input-project-location"
                        type="text"
                        value={formData.location}
                        onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        placeholder="Enter project location or address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          data-testid="input-project-start-date"
                          type="date"
                          value={formData.startDate}
                          onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          End Date
                        </label>
                        <input
                          data-testid="input-project-end-date"
                          type="date"
                          value={formData.endDate}
                          onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Project Description
                      </label>
                      <textarea
                        data-testid="textarea-project-description"
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent resize-none"
                        placeholder="Enter project description, scope, or notes..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Progress Tracking
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            id="auto-progress"
                            name="progressMode"
                            checked={formData.percentMode === "auto"}
                            onChange={() => setFormData(prev => ({ ...prev, percentMode: "auto" }))}
                            className="text-[#4A90E2]"
                          />
                          <label htmlFor="auto-progress" className="text-sm text-gray-300">
                            Automatic (based on dates)
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            id="manual-progress"
                            name="progressMode"
                            checked={formData.percentMode === "manual"}
                            onChange={() => setFormData(prev => ({ ...prev, percentMode: "manual" }))}
                            className="text-[#4A90E2]"
                          />
                          <label htmlFor="manual-progress" className="text-sm text-gray-300">
                            Manual tracking
                          </label>
                        </div>
                        {formData.percentMode === "manual" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Completion Percentage
                            </label>
                            <input
                              data-testid="input-project-progress"
                              type="number"
                              min="0"
                              max="100"
                              value={formData.percentComplete}
                              onChange={e => setFormData(prev => ({ ...prev, percentComplete: parseInt(e.target.value) || 0 }))}
                              className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                              placeholder="0"
                            />
                          </div>
                        )}
                      </div>
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