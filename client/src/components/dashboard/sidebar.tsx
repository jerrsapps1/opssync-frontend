import { brandConfig } from "@/lib/brand-config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Settings,
  BarChart3, 
  Users, 
  Wrench, 
  FolderOpen, 
  ArrowLeftRight,
  ChartPie,
  HardHat
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeView?: string;
  stats?: {
    totalEmployees: number;
    totalEquipment: number;
    activeProjects: number;
  };
}

export function Sidebar({ activeView = "dashboard", stats }: SidebarProps) {
  const navigationItems = [
    { id: "dashboard", icon: BarChart3, label: "Dashboard", active: true },
    { id: "employees", icon: Users, label: "Employees", badge: stats?.totalEmployees },
    { id: "equipment", icon: Wrench, label: "Equipment", badge: stats?.totalEquipment },
    { id: "projects", icon: FolderOpen, label: "Projects", badge: stats?.activeProjects, badgeVariant: "secondary" as const },
    { id: "assignments", icon: ArrowLeftRight, label: "Assignments" },
    { id: "reports", icon: ChartPie, label: "Reports" },
  ];

  return (
    <Card className="w-64 bg-gray-800 border-gray-700 flex flex-col h-full rounded-none border-r">
      {/* Logo/Brand Area */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <HardHat className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{brandConfig.appName}</h1>
            <p className="text-xs text-gray-400">{brandConfig.tagline}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start space-x-3 h-auto p-3",
                  item.id === activeView || (activeView === "dashboard" && item.active)
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}
                data-testid={`nav-${item.id}`}
              >
                <item.icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && (
                  <Badge 
                    variant={item.badgeVariant || "outline"}
                    className={cn(
                      "text-xs",
                      item.badgeVariant === "secondary" 
                        ? "bg-teal-500 text-white hover:bg-teal-600" 
                        : "bg-gray-600 text-white"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
              className="object-cover"
            />
            <AvatarFallback>MJ</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Mike Johnson</p>
            <p className="text-xs text-gray-400">Site Manager</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white"
            data-testid="user-settings"
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
