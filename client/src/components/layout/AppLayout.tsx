import React from "react";
import { Sidebar } from "@/components/dashboard/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <div className="h-12 border-b border-gray-800 flex items-center px-4">
          <div className="font-semibold text-white">StaffTrak</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}