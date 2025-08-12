import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import type { Equipment } from "@shared/schema";

export default function EquipmentPage() {
  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: brandConfig } = useQuery<{
    logoUrl?: string;
    companyName?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }>({
    queryKey: ["/api/auth/brand-config"],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="p-6 text-gray-300">
        <div className="animate-pulse">Loading equipment...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header with Brand Logo Placeholder */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {brandConfig?.logoUrl && (
            <img 
              src={brandConfig.logoUrl} 
              alt={`${brandConfig.companyName || 'Company'} Logo`}
              className="h-10 w-10 rounded"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold text-white">Equipment Management</h1>
            <p className="text-sm text-gray-400">
              Track and manage equipment for {brandConfig?.companyName || 'your organization'}
            </p>
          </div>
        </div>
        <Button>
          <span className="mr-2">🚜</span>
          Add Equipment
        </Button>
      </div>

      {/* Equipment Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded" style={{ backgroundColor: 'var(--brand-primary)' }}>
              <span className="text-white">🚜</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">{equipment.length}</div>
              <div className="text-xs text-gray-400">Total Equipment</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded" style={{ backgroundColor: 'var(--brand-secondary)' }}>
              <span className="text-white">⚡</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">
                {equipment.filter(e => e.currentProjectId).length}
              </div>
              <div className="text-xs text-gray-400">In Use</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded" style={{ backgroundColor: 'var(--brand-accent)' }}>
              <span className="text-white">🔧</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">
                {equipment.filter(e => !e.currentProjectId).length}
              </div>
              <div className="text-xs text-gray-400">Available</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-yellow-600">
              <span className="text-white">⚠️</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">2</div>
              <div className="text-xs text-gray-400">Needs Maintenance</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <Input 
            placeholder="Search equipment by name, type, or ID..."
            className="flex-1"
          />
          <Button variant="outline">
            <span className="mr-2">🔍</span>
            Search
          </Button>
          <Button variant="ghost">
            <span className="mr-2">📊</span>
            Analytics
          </Button>
        </div>
      </Card>

      {/* Equipment Table */}
      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Equipment</TH>
              <TH>Type</TH>
              <TH>Serial Number</TH>
              <TH>Current Project</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {equipment.map((item) => (
              <TR key={item.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-gray-600 flex items-center justify-center text-xs">
                      🚜
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                </TD>
                <TD>{item.type}</TD>
                <TD className="font-mono text-sm">#{item.serialNumber || 'N/A'}</TD>
                <TD>
                  {item.currentProjectId ? (
                    <span className="px-2 py-1 rounded text-xs" 
                          style={{ backgroundColor: 'var(--brand-accent)', color: 'white' }}>
                      Project #{item.currentProjectId}
                    </span>
                  ) : (
                    <span className="text-gray-500">Available</span>
                  )}
                </TD>
                <TD>
                  <span className="px-2 py-1 rounded text-xs bg-green-600 text-white">
                    Operational
                  </span>
                </TD>
                <TD>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">Assign</Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* Company Footer */}
      <div className="text-center text-xs text-gray-500 pt-6">
        Powered by {brandConfig?.companyName || 'StaffTrak'} Equipment Management System
      </div>
    </div>
  );
}