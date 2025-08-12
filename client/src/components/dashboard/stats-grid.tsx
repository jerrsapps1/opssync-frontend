import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, BarChart3, AlertTriangle } from "lucide-react";

interface StatsGridProps {
  stats?: {
    totalEmployees: number;
    employeeGrowth: string;
    totalEquipment: number;
    equipmentIssues: number;
    activeProjects: number;
    projectsOnTrack: string;
    utilizationRate: number;
    utilizationTrend: string;
  };
  isLoading: boolean;
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      change: stats.employeeGrowth,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Equipment",
      value: stats.totalEquipment,
      change: `${stats.equipmentIssues} issues`,
      icon: Package,
      color: "text-green-500",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects,
      change: stats.projectsOnTrack,
      icon: BarChart3,
      color: "text-purple-500",
    },
    {
      title: "Utilization Rate",
      value: `${stats.utilizationRate}%`,
      change: stats.utilizationTrend,
      icon: AlertTriangle,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="bg-gray-800 border-gray-700" data-testid={`stat-card-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}