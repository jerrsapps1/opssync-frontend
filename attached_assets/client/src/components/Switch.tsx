import React from "react";

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
};
export default function Switch({ checked, onChange, label }: Props) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span className="text-sm">{label}</span>
      <span
        onClick={() => onChange(!checked)}
        className={`inline-flex h-6 w-11 items-center rounded-full border transition px-0.5 ${checked ? "bg-black" : "bg-gray-200"}`}
      >
        <span className={`h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </label>
  );
}
