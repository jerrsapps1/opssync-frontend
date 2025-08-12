import React from "react";
import { Button } from "@/components/ui/button";

export default function ImportExportPanel({
  onImport,
  onExport,
  templateUrl,
  title = "Equipment",
}: {
  onImport: (file: File) => void;
  onExport: () => void;
  templateUrl?: string;
  title?: string;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  return (
    <div className="p-3 rounded border border-gray-800 bg-black/20">
      <div className="font-medium mb-2">{title} Import / Export</div>
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept=".csv,.xlsx"
          ref={fileRef}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <Button onClick={() => fileRef.current?.click()}>Import</Button>
        <Button variant="outline" onClick={onExport}>Export</Button>
        {templateUrl && (
          <a
            href={templateUrl}
            className="text-sm underline text-[color:var(--brand-primary)] ml-2"
            download
          >
            Download Template
          </a>
        )}
      </div>
      <div className="text-xs text-gray-400 mt-2">
        Accepted: CSV or Excel. For large imports, batch in 1–5k rows to avoid timeouts.
      </div>
    </div>
  );
}
