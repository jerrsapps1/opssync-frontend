import React from "react";

type Item = { label: string; onClick: () => void };

export default function ContextMenu({
  items,
  onClose,
  pos,
}: {
  items: Item[];
  onClose: () => void;
  pos: { x: number; y: number };
}) {
  React.useEffect(() => {
    const f = () => onClose();
    window.addEventListener("click", f);
    return () => window.removeEventListener("click", f);
  }, [onClose]);

  return (
    <div
      className="fixed z-[9999] min-w-[180px] rounded border border-gray-800 bg-[#0b1220] shadow-xl"
      style={{ left: pos.x, top: pos.y }}
    >
      {items.map((it, i) => (
        <button
          key={i}
          onClick={it.onClick}
          className="w-full text-left px-3 py-2 text-sm hover:bg-white/10"
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
