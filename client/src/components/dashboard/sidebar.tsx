import React from "react";
import { NavLink } from "react-router-dom";

export function Sidebar() {
  const Item = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-2 rounded text-sm ${isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800"}`
      }
    >
      {children}
    </NavLink>
  );

  return (
    <aside className="w-56 bg-[#111827] border-r border-gray-800 text-gray-200 flex flex-col">
      <div className="h-14 flex items-center px-4 text-lg font-semibold border-b border-gray-800">
        StaffTrak
      </div>

      <nav className="p-3 space-y-1">
        <Item to="/dashboard">Dashboard</Item>
        <Item to="/projects">Projects</Item>
        <Item to="/employees">Employees</Item>
        <Item to="/equipment">Equipment</Item>
        <Item to="/analytics">Advanced Analytics</Item>
        <Item to="/settings">Settings</Item>
        <div className="mt-3 pt-3 border-t border-gray-800 text-xs uppercase text-gray-500">
          Admin
        </div>
        <Item to="/white-label">White Label Config</Item>
        <Item to="/org/branding">Branding Settings</Item>
        <Item to="/billing">Billing Management</Item>
      </nav>

      <div className="mt-auto p-3 text-xs text-gray-500">
        v0.1 — simple shell
      </div>
    </aside>
  );
}
