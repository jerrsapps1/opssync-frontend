import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

async function getHistory(): Promise<any[]> {
  const r = await apiRequest("GET", "/api/history");
  return r.json();
}

export default function HistoryPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["history"], queryFn: getHistory });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">History</h1>
        <a className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm" href="/dashboard">← Back to Dashboard</a>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <div className="rounded border border-gray-800 overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>When</TH><TH>Entity</TH><TH>Action</TH><TH>Entity ID</TH>
              </TR>
            </THead>
            <TBody>
              {data.slice().reverse().map((h, i) => (
                <TR key={i}>
                  <TD>{new Date(h.at).toLocaleString()}</TD>
                  <TD className="capitalize">{h.entity}</TD>
                  <TD className="capitalize">{h.action}</TD>
                  <TD className="font-mono text-xs">{h.entityId}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}
