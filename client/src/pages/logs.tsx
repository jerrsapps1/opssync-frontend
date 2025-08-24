import React from "react";

export default function Logs() {
  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">System Logs</h1>
          <p className="text-gray-400">Activity logs and system events</p>
        </div>

        <div className="bg-[#1E1E2F] rounded-lg border border-gray-700 p-6">
          <div className="text-center text-gray-400 py-12">
            <div className="text-4xl mb-4">📋</div>
            <div className="text-xl mb-2">Logs Coming Soon</div>
            <div className="text-sm">System activity logs will be displayed here</div>
          </div>
        </div>
      </div>
    </div>
  );
}