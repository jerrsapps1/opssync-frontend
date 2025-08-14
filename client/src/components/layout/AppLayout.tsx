import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#0f172a] text-gray-200">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <div className="h-12 border-b border-gray-800 flex items-center px-4">
          <div className="font-semibold">StaffTrak</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
