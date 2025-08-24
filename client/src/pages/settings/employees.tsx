import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ImportExportPanel from "@/components/settings/ImportExportPanel";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

type Employee = { id: string; name: string; role?: string; certs?: string };

async function fetchEmployees(): Promise<Employee[]> {
  const r = await apiRequest("GET", "/api/employees");
  return r.json();
}

export default function SettingsEmployees() {
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: fetchEmployees });

  function importFile(file: File) {
    const body = new FormData();
    body.append("file", file);
    fetch("/api/employees/import", { method: "POST", body });
  }
  function exportAll() {
    window.location.href = "/api/employees/export";
  }

  return (
    <div className="p-4 space-y-4">
      <ImportExportPanel 
        onImport={importFile} 
        onExport={exportAll} 
        title="Employees" 
        templateUrl="/templates/employees_template.csv"
      />
      <div className="rounded border border-gray-800 overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Role</TH>
              <TH>Certifications</TH>
            </TR>
          </THead>
          <TBody>
            {employees.map((e) => (
              <TR key={e.id}>
                <TD>{e.name}</TD>
                <TD>{e.role || "-"}</TD>
                <TD>{e.certs || "-"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
