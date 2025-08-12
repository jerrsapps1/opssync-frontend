
import React from 'react';

export default function ProjectStatusDropdown({ status, onChange, onMarkCompleted }) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded p-1 bg-gray-800 text-white"
      >
        <option value="Planned">Planned</option>
        <option value="Active">Active</option>
        <option value="Paused">Paused</option>
        <option value="Completed">Completed</option>
      </select>
      <button
        onClick={onMarkCompleted}
        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
      >
        Mark Completed
      </button>
    </div>
  );
}
