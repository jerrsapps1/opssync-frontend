import * as React from "react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function Dialog({ open, onClose, title, description, footer, children, className }: DialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full max-w-lg rounded-[calc(var(--brand-radius)+4px)] border border-gray-800",
          "bg-[#0b1220] text-gray-200 shadow-2xl",
          className
        )}
      >
        <div
          className="px-4 py-3 border-b border-gray-800 flex items-center justify-between"
          style={{ backgroundColor: "var(--brand-header-bg)", color: "var(--brand-text)" }}
        >
          <div className="font-semibold">{title}</div>
          <button
            className="px-2 py-1 rounded hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {description && <div className="px-4 pt-3 text-sm text-gray-400">{description}</div>}
        <div className="px-4 py-4">{children}</div>
        {footer && (
          <div className="px-4 py-3 border-t border-gray-800 bg-black/20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
