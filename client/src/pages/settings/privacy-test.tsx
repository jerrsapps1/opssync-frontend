import React, { useState } from "react";

export default function PrivacyTestSettings() {
  return (
    <div className="p-6 space-y-6 text-white bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white">DATA RETENTION CONTROLS</h1>
      
      <div className="bg-red-600 p-4 rounded text-white font-bold">
        THIS IS A TEST - CONTROLS SHOULD BE VISIBLE HERE
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-white mb-2 text-lg">Activity Log Retention:</label>
          <select className="bg-gray-700 text-white p-3 rounded border-2 border-white">
            <option>1 Year</option>
            <option>2 Years</option>
            <option>5 Years</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-3 text-white text-lg">
            <input type="checkbox" className="w-5 h-5" />
            Auto cleanup enabled
          </label>
        </div>

        <button className="bg-green-600 text-white px-6 py-3 rounded text-lg font-bold">
          SAVE SETTINGS
        </button>
      </div>
    </div>
  );
}