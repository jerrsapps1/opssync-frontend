import React from 'react';
import { cn } from '@/lib/utils';

interface ImportExportPanelProps {
  title: string;
  onImport: (file: File) => void;
  onExport: () => void;
  templateUrl?: string;
  className?: string;
}

export default function ImportExportPanel({ 
  title, 
  onImport, 
  onExport, 
  templateUrl, 
  className 
}: ImportExportPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      // Reset the input
      e.target.value = '';
    }
  };

  return (
    <div className={cn(
      "border border-gray-800 rounded-[var(--brand-radius)] bg-[#0b1220] p-4",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-200">Import/Export {title}</h3>
        {templateUrl && (
          <a 
            href={templateUrl}
            download
            className="text-xs text-[color:var(--brand-primary)] hover:text-[color:var(--brand-primary)]/80 transition"
          >
            Download Template
          </a>
        )}
      </div>
      
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-3 py-2 text-xs rounded bg-[color:var(--brand-primary)]/10 text-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary)]/20 transition border border-[color:var(--brand-primary)]/20"
        >
          Import File
        </button>
        
        <button
          onClick={onExport}
          className="flex-1 px-3 py-2 text-xs rounded bg-gray-800 text-gray-300 hover:bg-gray-700 transition border border-gray-700"
        >
          Export {title}
        </button>
      </div>
    </div>
  );
}