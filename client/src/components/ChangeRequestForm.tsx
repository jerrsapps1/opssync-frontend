import React, { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

type Props = {
  projectId: string;
  onSubmitted?: () => void;
};

export default function ChangeRequestForm({ projectId, onSubmitted }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setSubmitting(true);
    try {
      await apiRequest("POST", `/api/supervisor/projects/${projectId}/require-update`, {
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          dueAt: new Date(dueDate).toISOString()
        })
      });
      onSubmitted?.();
      setTitle("");
      setDescription("");
      setDueDate("");
    } catch (error) {
      console.error("Failed to create change request:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-xl border border-gray-700 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm">⚡</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Request Project Update</h3>
          <p className="text-xs text-gray-400">Create tracked update requirement with deadline</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Update Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-[#0b1220] text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Daily safety report, Progress photos, Equipment status..."
            required
            data-testid="input-update-title"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-[#0b1220] text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Additional details about what information is needed..."
            data-testid="textarea-update-description"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Due Date <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={minDate}
            className="w-full rounded-lg border border-gray-600 bg-[#0b1220] text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            data-testid="input-due-date"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={!title.trim() || !dueDate || submitting}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg"
            data-testid="button-create-request"
          >
            {submitting ? "Creating Request..." : "Create Update Request"}
          </button>
        </div>
      </form>
    </div>
  );
}