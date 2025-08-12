import React from "react";
import { Button } from "@/components/ui/button";

export default function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-[calc(var(--brand-radius)+4px)] border border-gray-800 bg-[#0b1220] text-gray-200 shadow-2xl">
        <div className="px-4 py-3 border-b border-gray-800 font-semibold">{title}</div>
        {message && <div className="px-4 py-3 text-sm text-gray-300">{message}</div>}
        <div className="px-4 py-3 flex justify-end gap-2 border-t border-gray-800">
          <Button variant="ghost" onClick={onCancel}>{cancelText}</Button>
          <Button onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}
