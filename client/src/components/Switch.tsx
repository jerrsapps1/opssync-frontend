import React from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export default function Switch({ checked, onChange, disabled = false, label, description }: SwitchProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        {label && (
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </label>
        )}
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
          ${checked 
            ? 'bg-brand-600 dark:bg-brand-500' 
            : 'bg-gray-200 dark:bg-gray-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}