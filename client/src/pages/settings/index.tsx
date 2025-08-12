import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export default function SettingsIndex() {
  const { data: brandConfig } = useQuery<{
    logoUrl?: string;
    companyName?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }>({
    queryKey: ["/api/auth/brand-config"],
    staleTime: 5 * 60 * 1000,
  });

  const Item = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-[var(--brand-radius)] text-sm mr-2 ${isActive ? "bg-[color:var(--brand-primary)] text-white" : "bg-gray-800 text-gray-200 hover:brightness-110"}`
      }
    >
      {children}
    </NavLink>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Page Header with Brand Logo Placeholder */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {brandConfig?.logoUrl && (
            <img 
              src={brandConfig.logoUrl} 
              alt={`${brandConfig.companyName || 'Company'} Logo`}
              className="h-10 w-10 rounded"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold text-white">Settings Management</h1>
            <p className="text-sm text-gray-400">
              Configure system settings for {brandConfig?.companyName || 'your organization'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4">
        <Item to="projects">📋 Project Details</Item>
        <Item to="equipment">🚜 Equipment Management</Item>
        <Item to="employees">👥 Employee Management</Item>
      </div>
      
      {/* Content Area */}
      <div className="rounded border border-gray-800 bg-[#0b1220]">
        <Outlet />
      </div>

      {/* Company Footer */}
      <div className="text-center text-xs text-gray-500 pt-6">
        Settings management for {brandConfig?.companyName || 'StaffTrak'} System
      </div>
    </div>
  );
}
