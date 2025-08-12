import React from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useBrandTheme } from "@/hooks/useBrandTheme";

export default function AppLayout() {
  // Fetch brand configuration
  const { data: brandConfig } = useQuery({
    queryKey: ["/api/auth/brand-config"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Apply brand theme to CSS variables
  useBrandTheme(brandConfig || {});

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <div 
          className="h-12 border-b border-gray-800 flex items-center px-4"
          style={brandConfig?.headerBgColor ? { 
            backgroundColor: brandConfig.headerBgColor,
            borderBottomColor: brandConfig.headerBgColor 
          } : {}}
        >
          <div 
            className="font-semibold text-white"
            style={brandConfig?.textColor ? { color: brandConfig.textColor } : {}}
          >
            {brandConfig?.companyName || "StaffTrak"}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}