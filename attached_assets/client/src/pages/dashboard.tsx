import { useQuery } from "@tanstack/react-query";
import CommandBar from "@/components/CommandBar";
import { applyActions } from "@/lib/applyActions";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, Plus, ChevronDown } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { UnassignedAssets } from "@/components/dashboard/unassigned-assets";
import { ActiveProjects } from "@/components/dashboard/active-projects";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { useDragDrop } from "@/hooks/use-drag-drop";
import type { Project, Employee, Equipment, Activity, Alert } from "@shared/schema";

export default function Dashboard() {
  const { handleDragEnd, isAssigning } = useDragDrop();

  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalEmployees: number;
    employeeGrowth: string;
    totalEquipment: number;
    equipmentIssues: number;
    activeProjects: number;
    projectsOnTrack: string;
    utilizationRate: number;
    utilizationTrend: string;
  }>({
    queryKey: ["/api/stats"],
  });

  const isLoading = projectsLoading || employeesLoading || equipmentLoading;

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <Sidebar 
        activeView="dashboard" 
        stats={{
          totalEmployees: employees.length,
          totalEquipment: equipment.length,
          activeProjects: projects.filter(p => p.status === "active").length,
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Project Assignment Dashboard</h2>
              <p className="text-sm text-gray-400">Manage employee and equipment assignments across active projects</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search assets..."
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 w-64 pl-10"
                  data-testid="search-input"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative text-gray-400 hover:text-white" data-testid="notifications-btn">
                <Bell size={18} />
                {alerts.length > 0 && (
                  
                )}
              </Button>

              {/* Add New Button */}
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" data-testid="add-new-btn">
                <Plus size={16} className="mr-2" />
                Add New
                <ChevronDown size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Dashboard */}
        <main className="flex-1 overflow-auto p-6">
          {
          {/* AI Command Bar */}
          <CommandBar
            runActions={(actions) =>
              applyActions({
                actions,
                findEmployeeByQuery: (q) => {
                  const qq = q.toLowerCase();
                  return employees.find((e) => e.name.toLowerCase().includes(qq));
                },
                findEquipmentByQuery: (q) => {
                  const qq = q.toLowerCase();
                  return equipment.find(
                    (x) =>
                      x.name.toLowerCase().includes(qq) ||
                      x.type.toLowerCase().includes(qq)
                  );
                },
                moveEmployee: async (employeeId, projectName) => {
                  const dest = projects.find(
                    (p) => p.name.toLowerCase() === projectName.toLowerCase()
                  );
                  if (!dest) return;
                  await apiRequest("PATCH", `/api/employees/${employeeId}/assignment`, {
                    currentProjectId: dest.id,
                  });
                  await Promise.allSettled([queryClient.invalidateQueries()]);
                },
                assignEquipment: async (equipmentId, projectName) => {
                  const dest = projects.find(
                    (p) => p.name.toLowerCase() === projectName.toLowerCase()
                  );
                  if (!dest) return;
                  await apiRequest("PATCH", `/api/equipment/${equipmentId}/assignment`, {
                    currentProjectId: dest.id,
                  });
                  await Promise.allSettled([queryClient.invalidateQueries()]);
                },
                showUnassigned: (date) => {
                  console.log("Unassigned requested for", date);
                },
              })
            }
          />

          /* Quick Stats */}
          <StatsGrid stats={stats} isLoading={statsLoading} />

          {/* Assignment Management Grid */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Unassigned Assets */}
              <UnassignedAssets 
                employees={employees}
                equipment={equipment}
                isLoading={isLoading}
              />

              {/* Active Projects */}
              <ActiveProjects 
                projects={projects}
                employees={employees}
                equipment={equipment}
                isLoading={isLoading}
              />
            </div>
          </DragDropContext>

          {/* Recent Activity & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <RecentActivity 
              activities={activities}
              isLoading={activitiesLoading}
            />
            <AlertsPanel 
              alerts={alerts}
              isLoading={alertsLoading}
            />
          </div>

          {/* Loading overlay */}
          {isAssigning && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>Updating assignment...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
