import React, { useState } from "react";

export default function PrivacyTestSettings() {
  const [activityRetention, setActivityRetention] = useState("2years");
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Data & Privacy Controls</h2>
        <p className="text-gray-400 text-sm">
          Test page for data retention controls
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-medium mb-4">Activity Logs Retention</h3>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm mb-2">
            Retain activity logs for:
          </label>
          <select 
            value={activityRetention}
            onChange={(e) => setActivityRetention(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2"
          >
            <option value="1year">1 Year</option>
            <option value="2years">2 Years</option>
            <option value="3years">3 Years</option>
            <option value="5years">5 Years</option>
            <option value="indefinite">Indefinite</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 text-gray-300">
            <input type="checkbox" className="rounded" />
            <span>Automatic data cleanup</span>
          </label>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          Save Settings
        </button>
      </div>
    </div>
  );
}