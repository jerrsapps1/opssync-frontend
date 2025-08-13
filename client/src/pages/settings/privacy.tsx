import React, { useState } from "react";

export default function PrivacySettings() {
  const [activityRetention, setActivityRetention] = useState("2years");
  const [archivedRetention, setArchivedRetention] = useState("5years");
  const [sessionRetention, setSessionRetention] = useState("30days");
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [complianceMode, setComplianceMode] = useState(false);

  const handleSave = () => {
    alert("Data retention settings saved!");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Data Retention Controls</h2>
        <p className="text-gray-400 text-sm">
          Configure how long different types of data are stored in your system
        </p>
      </div>

      {/* Activity Logs */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-medium mb-4">📋 Activity Logs Retention</h3>
        <p className="text-gray-400 text-sm mb-4">Assignment changes, system activities, audit trail</p>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm mb-2">Retain for:</label>
          <select 
            value={activityRetention}
            onChange={(e) => setActivityRetention(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 w-full max-w-xs"
          >
            <option value="1year">1 Year</option>
            <option value="2years">2 Years</option>
            <option value="3years">3 Years</option>
            <option value="5years">5 Years</option>
            <option value="7years">7 Years</option>
            <option value="indefinite">Indefinite</option>
          </select>
        </div>
      </div>

      {/* Archived Data */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-medium mb-4">🗃️ Archived Data Retention</h3>
        <p className="text-gray-400 text-sm mb-4">Deleted/completed records, soft-deleted items</p>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm mb-2">Retain for:</label>
          <select 
            value={archivedRetention}
            onChange={(e) => setArchivedRetention(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 w-full max-w-xs"
          >
            <option value="6months">6 Months</option>
            <option value="1year">1 Year</option>
            <option value="2years">2 Years</option>
            <option value="5years">5 Years</option>
            <option value="indefinite">Indefinite</option>
          </select>
        </div>
      </div>

      {/* Session Data */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-medium mb-4">🔐 Session Data Retention</h3>
        <p className="text-gray-400 text-sm mb-4">Login sessions, temporary cache, user preferences</p>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm mb-2">Retain for:</label>
          <select 
            value={sessionRetention}
            onChange={(e) => setSessionRetention(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 w-full max-w-xs"
          >
            <option value="1day">1 Day</option>
            <option value="7days">7 Days</option>
            <option value="30days">30 Days</option>
            <option value="90days">90 Days</option>
          </select>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-medium mb-4">⚙️ Data Management Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 text-gray-300">
              <input 
                type="checkbox" 
                checked={autoCleanup}
                onChange={(e) => setAutoCleanup(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span>Enable automatic data cleanup when retention periods expire</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 text-gray-300">
              <input 
                type="checkbox" 
                checked={complianceMode}
                onChange={(e) => setComplianceMode(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span>Compliance Mode (Extended retention for regulatory requirements)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}