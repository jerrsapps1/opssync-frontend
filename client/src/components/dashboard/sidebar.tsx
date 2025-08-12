import React from "react";

export function Sidebar() {
  return (
    <aside className="w-56 bg-[#111827] border-r border-gray-800 text-gray-200 flex flex-col">
      <div className="h-14 flex items-center px-4 text-lg font-semibold border-b border-gray-800">
        StaffTrak
      </div>

      <nav className="p-3 space-y-1 text-sm">
        <a href="/" className="block px-3 py-2 rounded hover:bg-gray-800">Dashboard</a>
        <a href="/employees" className="block px-3 py-2 rounded hover:bg-gray-800">Employees</a>
        <a href="/equipment" className="block px-3 py-2 rounded hover:bg-gray-800">Equipment</a>
        <a href="/analytics" className="block px-3 py-2 rounded hover:bg-gray-800">Analytics</a>
        <a href="/settings" className="block px-3 py-2 rounded hover:bg-gray-800">Settings</a>
      </nav>

      <div className="mt-auto p-3 text-xs text-gray-500">
        v0.1 — simple shell
      </div>
    </aside>
  );
}