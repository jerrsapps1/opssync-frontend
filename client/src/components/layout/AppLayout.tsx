import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <div className="h-12 border-b border-gray-800 flex items-center px-4">
          <div className="font-semibold text-white">StaffTrak</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}