import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Wrench, FolderOpen, TrendingUp, AlertTriangle, CheckCircle, ArrowUp } from "lucide-react";

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
  isLoading?: boolean;
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-8 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded"></div>
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
      icon: Users,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500 bg-opacity-20",
      trend: stats.employeeGrowth,
      trendIcon: ArrowUp,
      trendColor: "text-green-500",
    },
    {
      title: "Equipment Units", 
      value: stats.totalEquipment,
      icon: Wrench,
      iconColor: "text-teal-500",
      iconBg: "bg-teal-500 bg-opacity-20",
      trend: `${stats.equipmentIssues} need maintenance`,
      trendIcon: AlertTriangle,
      trendColor: "text-orange-500",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects,
      icon: FolderOpen,
      iconColor: "text-green-500", 
      iconBg: "bg-green-500 bg-opacity-20",
      trend: stats.projectsOnTrack,
      trendIcon: CheckCircle,
      trendColor: "text-green-500",
    },
    {
      title: "Utilization Rate",
      value: `${stats.utilizationRate}%`,
      icon: TrendingUp,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500 bg-opacity-20", 
      trend: stats.utilizationTrend,
      trendIcon: ArrowUp,
      trendColor: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="bg-gray-800 border-gray-700" data-testid={`stat-card-${index}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`${stat.iconColor} text-xl`} size={24} />
              </div>
            </div>
            <div className={`mt-4 flex items-center ${stat.trendColor} text-sm`}>
              <stat.trendIcon size={16} className="mr-1" />
              <span>{stat.trend}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
