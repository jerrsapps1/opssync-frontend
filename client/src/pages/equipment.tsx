import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ImportExportPanel from "@/components/common/ImportExportPanel";
import { Plus, Edit3, Wrench, Truck, Calendar, Settings } from "lucide-react";

type Equipment = {
  id: string;
  name: string;
  type: string;
  make?: string;
  model?: string;
  year?: number;
  serialNumber?: string;
  currentProjectId?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Project = { id: string; name: string };

async function fetchEquipment(): Promise<Equipment[]> {
  const r = await apiRequest("GET", "/api/equipment");
  return r.json();
}

async function fetchProjects(): Promise<Project[]> {
  const r = await apiRequest("GET", "/api/projects");
  return r.json();
}

const EQUIPMENT_TYPES = [
  "Excavator", "Bulldozer", "Loader", "Crane", "Dump Truck", "Grader",
  "Backhoe", "Skid Steer", "Roller", "Scraper", "Forklift", "Trencher"
];

const EQUIPMENT_MAKES = [
  "Caterpillar", "John Deere", "Komatsu", "Volvo", "JCB", "Case", 
  "Liebherr", "Hitachi", "Kobelco", "Bobcat", "New Holland", "Kubota"
];

export default function EquipmentSetUpPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: equipment = [], isLoading, refetch } = useQuery({
    queryKey: ["equipment"],
    queryFn: fetchEquipment,
    refetchOnWindowFocus: true
  });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Form state for creation/editing
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    serialNumber: "",
    status: "operational"
  });

  const projName = React.useMemo(() => Object.fromEntries(projects.map(p => [p.id, p.name])), [projects]);

  const filteredEquipment = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return equipment;
    return equipment.filter(eq =>
      eq.name.toLowerCase().includes(query) ||
      eq.type.toLowerCase().includes(query) ||
      (eq.make || "").toLowerCase().includes(query) ||
      (eq.model || "").toLowerCase().includes(query) ||
      (eq.serialNumber || "").toLowerCase().includes(query)
    );
  }, [equipment, searchQuery]);

  const createEquipmentMutation = useMutation({
    mutationFn: async (equipmentData: any) => {
      const response = await apiRequest("POST", "/api/equipment", equipmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      resetForm();
      setShowCreateDialog(false);
      toast({
        title: "Equipment Created",
        description: "New equipment has been successfully added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create equipment.",
        variant: "destructive",
      });
    }
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/equipment/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      resetForm();
      setEditingEquipment(null);
      toast({
        title: "Equipment Updated",
        description: "Equipment information has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update equipment.",
        variant: "destructive",
      });
    }
  });

  function resetForm() {
    setFormData({
      name: "",
      type: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      serialNumber: "",
      status: "operational"
    });
    setCurrentStep(1);
  }

  function openCreateDialog() {
    resetForm();
    setShowCreateDialog(true);
  }

  function openEditDialog(equipment: Equipment) {
    setFormData({
      name: equipment.name || "",
      type: equipment.type || "",
      make: equipment.make || "",
      model: equipment.model || "",
      year: equipment.year || new Date().getFullYear(),
      serialNumber: equipment.serialNumber || "",
      status: equipment.status || "operational"
    });
    setEditingEquipment(equipment);
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
    if (editingEquipment) {
      updateEquipmentMutation.mutate({ id: editingEquipment.id, data: formData });
    } else {
      createEquipmentMutation.mutate(formData);
    }
  }

  function importEquipment(file: File) {
    const body = new FormData();
    body.append("file", file);
    fetch("/api/equipment/import", { method: "POST", body }).then(() => refetch());
  }

  function exportEquipment() {
    window.location.href = "/api/equipment/export";
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.name.trim() && formData.type.trim();
      case 2: return formData.make.trim() && formData.model.trim();
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#121212] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipment Set-Up</h1>
          <p className="text-gray-400 text-sm">Create, configure, and manage your equipment fleet</p>
        </div>
        <div className="flex gap-3">
          <input
            data-testid="input-equipment-search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search equipment..."
            className="px-4 py-2 rounded-lg bg-[#1E1E2F] border border-gray-700 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent w-64"
          />
          <Button
            data-testid="button-create-equipment"
            onClick={openCreateDialog}
            className="bg-[#4A90E2] hover:bg-[#357ABD] text-white flex items-center gap-2"
          >
            <Plus size={16} />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Import/Export Panel */}
      <ImportExportPanel
        title="Equipment Data"
        onImport={importEquipment}
        onExport={exportEquipment}
        templateUrl="/templates/equipment_template.csv"
      />

      {/* Equipment Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Current Equipment ({filteredEquipment.length})
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
            {filteredEquipment.map(equipment => (
              <Card
                key={equipment.id}
                className="p-4 bg-[#1E1E2F] border-gray-700 hover:border-[#4A90E2] transition-colors cursor-pointer"
                data-testid={`card-equipment-${equipment.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#BB86FC] flex items-center justify-center">
                      <Truck size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{equipment.name}</h3>
                      <p className="text-sm text-gray-400">{equipment.type}</p>
                    </div>
                  </div>
                  <Button
                    data-testid={`button-edit-${equipment.id}`}
                    onClick={() => openEditDialog(equipment)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    <Edit3 size={14} />
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  {equipment.make && equipment.model && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Settings size={12} />
                      <span>{equipment.make} {equipment.model}</span>
                    </div>
                  )}
                  {equipment.year && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar size={12} />
                      <span>{equipment.year}</span>
                    </div>
                  )}
                  {equipment.serialNumber && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Wrench size={12} />
                      <span>#{equipment.serialNumber}</span>
                    </div>
                  )}
                  {equipment.currentProjectId && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span>Assigned to {projName[equipment.currentProjectId] || "Unknown Project"}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                    equipment.status === "operational"
                      ? "bg-green-900 text-green-300"
                      : equipment.status === "maintenance"
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-gray-700 text-gray-300"
                  }`}>
                    {equipment.status || "operational"}
                  </span>
                </div>
              </Card>
            ))}
            {filteredEquipment.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                No equipment found matching your search.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Equipment Dialog */}
      {(showCreateDialog || editingEquipment !== null) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E2F] rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingEquipment ? "Edit Equipment" : "Create New Equipment"}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Step {currentStep} of 3 - {
                      currentStep === 1 ? "Basic Information" :
                      currentStep === 2 ? "Specifications" :
                      "Additional Details"
                    }
                  </p>
                </div>
                <Button
                  data-testid="button-close-dialog"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingEquipment(null);
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
                        Equipment Name *
                      </label>
                      <input
                        data-testid="input-equipment-name"
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        placeholder="Enter equipment name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Equipment Type *
                      </label>
                      <select
                        data-testid="select-equipment-type"
                        value={formData.type}
                        onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      >
                        <option value="">Select equipment type</option>
                        {EQUIPMENT_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        data-testid="select-equipment-status"
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      >
                        <option value="operational">Operational</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                        <option value="out-of-service">Out of Service</option>
                      </select>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Make/Manufacturer *
                      </label>
                      <select
                        data-testid="select-equipment-make"
                        value={formData.make}
                        onChange={e => setFormData(prev => ({ ...prev, make: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      >
                        <option value="">Select manufacturer</option>
                        {EQUIPMENT_MAKES.map(make => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Model *
                      </label>
                      <input
                        data-testid="input-equipment-model"
                        type="text"
                        value={formData.model}
                        onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                        placeholder="Enter model number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Year
                      </label>
                      <input
                        data-testid="input-equipment-year"
                        type="number"
                        min="1990"
                        max={new Date().getFullYear() + 1}
                        value={formData.year}
                        onChange={e => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Serial Number
                    </label>
                    <input
                      data-testid="input-equipment-serial"
                      type="text"
                      value={formData.serialNumber}
                      onChange={e => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      placeholder="Enter serial number"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Serial number helps track individual equipment units for maintenance and warranty purposes.
                    </p>
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
                  disabled={!isStepValid() || createEquipmentMutation.isPending || updateEquipmentMutation.isPending}
                  className="bg-[#4A90E2] hover:bg-[#357ABD] text-white"
                >
                  {createEquipmentMutation.isPending || updateEquipmentMutation.isPending
                    ? "Saving..."
                    : currentStep === 3
                    ? (editingEquipment ? "Update Equipment" : "Create Equipment")
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