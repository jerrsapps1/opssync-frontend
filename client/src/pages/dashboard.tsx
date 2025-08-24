import React from "react";
import { useQuery } from "@tanstack/react-query";

type Project = {
  id: string;
  name: string;
  description?: string;
};

type Employee = {
  id: string;
  name: string;
  currentProjectId?: string;
};

type Equipment = {
  id: string;
  name: string;
  type: string;
  status: string;
  currentProjectId?: string;
};

export default function Dashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api", "projects"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api", "employees"],
  });

  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api", "equipment"],
  });

  const isLoading = projectsLoading || employeesLoading || equipmentLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading OpsSync.ai Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <h1 className="text-3xl font-bold text-blue-400">OpsSync.ai Dashboard</h1>
        <p className="text-gray-300 mt-2">Repair Shop Management System</p>
      </div>

      {/* Stats Overview */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Projects</h3>
            <div className="text-3xl font-bold">{projects.length}</div>
            <p className="text-gray-400">Active projects</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Employees</h3>
            <div className="text-3xl font-bold">{employees.length}</div>
            <p className="text-gray-400">Team members</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-400 mb-2">Equipment</h3>
            <div className="text-3xl font-bold">{equipment.length}</div>
            <p className="text-gray-400">Assets tracked</p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">Projects</h3>
            <div className="space-y-3">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <div key={project.id} className="p-3 bg-gray-700 rounded border-l-4 border-blue-400">
                    <div className="font-medium">{project.name}</div>
                    {project.description && (
                      <div className="text-sm text-gray-400 mt-1">{project.description}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center py-8">No projects yet</div>
              )}
            </div>
          </div>

          {/* Employees */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-green-400">Employees</h3>
            <div className="space-y-3">
              {employees.length > 0 ? (
                employees.map((employee) => (
                  <div key={employee.id} className="p-3 bg-gray-700 rounded border-l-4 border-green-400">
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-sm text-gray-400">
                      {employee.currentProjectId ? 'Assigned' : 'Available'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center py-8">No employees yet</div>
              )}
            </div>
          </div>

          {/* Equipment */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-orange-400">Equipment</h3>
            <div className="space-y-3">
              {equipment.length > 0 ? (
                equipment.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-700 rounded border-l-4 border-orange-400">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-400">
                      {item.type} • {item.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center py-8">No equipment yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Repair Shop Section */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-orange-400">🔧 Repair Shop</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-orange-900/20 rounded border border-orange-600">
              <h4 className="font-semibold text-orange-300 mb-2">Assets Needing Repairs</h4>
              <div className="text-2xl font-bold text-orange-400">
                {equipment.filter(eq => eq.status === "maintenance" || eq.status === "broken").length}
              </div>
              <p className="text-gray-400 text-sm">Items requiring attention</p>
            </div>
            
            <div className="p-4 bg-green-900/20 rounded border border-green-600">
              <h4 className="font-semibold text-green-300 mb-2">Available Equipment</h4>
              <div className="text-2xl font-bold text-green-400">
                {equipment.filter(eq => eq.status === "available").length}
              </div>
              <p className="text-gray-400 text-sm">Ready for deployment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}