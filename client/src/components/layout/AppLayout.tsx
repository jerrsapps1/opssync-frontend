import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export default function AppLayout() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-200">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {/* Enhanced header with logout functionality */}
        <div className="h-16 border-b border-gray-800/50 flex items-center justify-between px-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
          {/* App branding */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-white font-bold text-sm">S</div>
            </div>
            <div className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              StaffTrak
            </div>
          </div>

          {/* User info and logout */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-200">
                    {user.username}
                  </span>
                </div>
              </div>
            )}
            
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="h-9 px-3 bg-transparent border-gray-600/50 text-gray-300 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all duration-200 flex items-center gap-2"
            >
              <LogOut size={16} />
              <span className="text-sm font-medium">Logout</span>
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
