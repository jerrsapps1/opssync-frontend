import React from "react";
import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const location = useLocation();
  
  const Item = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link 
      to={to} 
      className={`block px-3 py-2 rounded text-sm transition-colors ${
        location.pathname === to 
          ? "text-white" 
          : "text-gray-300 hover:bg-gray-800"
      }`}
      style={location.pathname === to ? { backgroundColor: 'var(--brand-primary)' } : {}}
    >
      {children}
    </Link>
  );

  return (
    <aside 
      className="w-56 border-r border-gray-800 text-gray-200 flex flex-col"
      style={{ backgroundColor: 'var(--brand-sidebar-bg, #111827)' }}
    >
      <div 
        className="h-14 flex items-center px-4 text-lg font-semibold border-b border-gray-800"
        style={{ color: 'var(--brand-text, white)' }}
      >
        StaffTrak
      </div>

      <nav className="p-3 space-y-1">
        <Item to="/dashboard">Dashboard</Item>
        <Item to="/employees">Employee Profiles</Item>
        <Item to="/equipment">Equipment Set-Up</Item>
        <Item to="/projects">Project Profiles</Item>
        <Item to="/analytics">Analytics</Item>
        <Item to="/directory">Directory</Item>
        <Item to="/history">History</Item>
        <Item to="/settings">Settings</Item>
        <div className="mt-3 pt-3 border-t border-gray-800 text-xs uppercase text-gray-500">
          Billing
        </div>
        <Item to="/pricing">Pricing Plans</Item>
        <Item to="/billing">Billing Portal</Item>
        <div className="mt-3 pt-3 border-t border-gray-800 text-xs uppercase text-gray-500">
          Admin
        </div>
        <Item to="/white-label">White Label Config</Item>
      </nav>

      <div className="mt-auto p-3 text-xs text-gray-500">
        v0.1 — simple shell
      </div>
    </aside>
  );
}