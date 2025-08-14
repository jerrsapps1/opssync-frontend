import React, { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

type Props = {
  projectId: string;
  onSubmitted?: () => void;
};

const SAFETY_CHECKLIST_ITEMS = [
  "All personnel have completed required safety training",
  "Personal protective equipment (PPE) is available and in good condition", 
  "Emergency contact information is posted and accessible",
  "Site safety plan has been reviewed with all team members",
  "All equipment has passed safety inspection",
  "Weather conditions have been assessed and deemed safe",
  "Traffic management plan is in place (if applicable)",
  "First aid kit and emergency supplies are available on-site",
  "Environmental hazards have been identified and mitigated",
  "Communication equipment is functional and tested"
];

export default function ChecklistForm({ projectId, onSubmitted }: Props) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCheck = (item: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [item]: checked }));
  };

  const allItemsChecked = SAFETY_CHECKLIST_ITEMS.every(item => checkedItems[item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allItemsChecked) return;

    setSubmitting(true);
    try {
      await apiRequest("POST", `/api/supervisor/projects/${projectId}/checklist`, {
        body: JSON.stringify({
          payload: checkedItems,
          note
        })
      });
      onSubmitted?.();
      setNote("");
      setCheckedItems({});
    } catch (error) {
      console.error("Failed to submit checklist:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm">✓</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Pre-Start Safety Checklist</h3>
          <p className="text-xs text-gray-400">Complete all items to unblock project start</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {SAFETY_CHECKLIST_ITEMS.map((item, index) => (
            <label key={index} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checkedItems[item] || false}
                onChange={(e) => handleCheck(item, e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-2"
                data-testid={`checkbox-${index}`}
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors leading-relaxed">
                {item}
              </span>
            </label>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-700">
          <label className="block text-sm text-gray-400 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-[#0b1220] text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Any additional safety considerations or notes..."
            data-testid="textarea-notes"
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-gray-400">
            {Object.keys(checkedItems).filter(k => checkedItems[k]).length} of {SAFETY_CHECKLIST_ITEMS.length} items completed
          </div>
          <button
            type="submit"
            disabled={!allItemsChecked || submitting}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg"
            data-testid="button-submit-checklist"
          >
            {submitting ? "Submitting..." : "Submit Checklist"}
          </button>
        </div>
      </form>
    </div>
  );
}