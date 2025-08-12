import { Link, useLocation } from "wouter";
import { BarChart3, Users, Package, Settings, Home } from "lucide-react";

interface SidebarProps {
  activeView: string;
  stats: {
    totalEmployees: number;
    totalEquipment: number;
    activeProjects: number;
  };
}

export function Sidebar({ activeView, stats }: SidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
    { id: "employees", label: "Employees", icon: Users, path: "/employees" },
    { id: "equipment", label: "Equipment", icon: Package, path: "/equipment" },
    { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">StaffTrak</h1>
        <p className="text-sm text-gray-400">Asset Management</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeView || location === item.path;
            
            return (
              <li key={item.id}>
                <Link href={item.path}>
                  <div
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                    data-testid={`sidebar-${item.id}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Employees:</span>
            <span className="text-white">{stats.totalEmployees}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Equipment:</span>
            <span className="text-white">{stats.totalEquipment}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Projects:</span>
            <span className="text-white">{stats.activeProjects}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}