import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ImportExportPanel from "@/components/settings/ImportExportPanel";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

type Equipment = { id: string; name: string; type: string; serialNumber?: string; make?: string; model?: string; year?: number };

async function fetchEquipment(): Promise<Equipment[]> {
  const r = await apiRequest("GET", "/api/equipment");
  return r.json();
}

export default function SettingsEquipment() {
  const { data: equipment = [] } = useQuery({ queryKey: ["equipment"], queryFn: fetchEquipment });

  function importFile(file: File) {
    const body = new FormData();
    body.append("file", file);
    fetch("/api/equipment/import", { method: "POST", body });
  }
  function exportAll() {
    window.location.href = "/api/equipment/export";
  }

  return (
    <div className="p-4 space-y-4">
      <ImportExportPanel 
        onImport={importFile} 
        onExport={exportAll} 
        title="Equipment" 
        templateUrl="/templates/equipment_template.csv"
      />
      <div className="rounded border border-gray-800 overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Type</TH>
              <TH>Make</TH>
              <TH>Model</TH>
              <TH>Serial</TH>
              <TH>Year</TH>
            </TR>
          </THead>
          <TBody>
            {equipment.map((e) => (
              <TR key={e.id}>
                <TD>{e.name}</TD>
                <TD>{e.type}</TD>
                <TD>{e.make || "-"}</TD>
                <TD>{e.model || "-"}</TD>
                <TD>{e.serialNumber || "-"}</TD>
                <TD>{e.year || "-"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
