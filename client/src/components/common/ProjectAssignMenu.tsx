import React from "react";
import type { Project } from "@shared/schema";

export default function ProjectAssignMenu({
  projects,
  onSelect,
  onCancel,
  pos,
}: {
  projects: Project[];
  onSelect: (projectId: string | null) => void;
  onCancel: () => void;
  pos: { x: number; y: number };
}) {
  React.useEffect(() => {
    const f = () => onCancel();
    window.addEventListener("click", f);
    return () => window.removeEventListener("click", f);
  }, [onCancel]);

  return (
    <div
      className="fixed z-[10000] min-w-[260px] max-h-[60vh] overflow-auto rounded border border-gray-800 bg-[#0b1220] shadow-xl"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-gray-400 border-b border-gray-800">
        Assign to Project
      </div>
      <button
        className="w-full text-left px-3 py-2 text-sm hover:bg-white/10"
        onClick={() => onSelect(null)}
      >
        Unassigned
      </button>
      {projects.map((p) => (
        <button
          key={p.id}
          className="w-full text-left px-3 py-2 text-sm hover:bg-white/10"
          onClick={() => onSelect(p.id)}
        >
          {p.name}
        </button>
      ))}
      <div className="px-3 py-2 text-right border-t border-gray-800">
        <button
          className="text-sm text-gray-300 hover:text-white"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
