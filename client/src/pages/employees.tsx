import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import type { Employee } from "@shared/schema";

export default function EmployeesPage() {
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
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
        <div className="animate-pulse">Loading employees...</div>
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
            <h1 className="text-2xl font-semibold text-white">Employee Management</h1>
            <p className="text-sm text-gray-400">
              Manage your team at {brandConfig?.companyName || 'your organization'}
            </p>
          </div>
        </div>
        <Button>
          <span className="mr-2">👤</span>
          Add Employee
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <Input 
            placeholder="Search employees by name or role..."
            className="flex-1"
          />
          <Button variant="outline">
            <span className="mr-2">🔍</span>
            Search
          </Button>
          <Button variant="ghost">
            <span className="mr-2">⚙️</span>
            Filters
          </Button>
        </div>
      </Card>

      {/* Employee Table */}
      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Employee</TH>
              <TH>Role</TH>
              <TH>Current Project</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {employees.map((employee) => (
              <TR key={employee.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    {employee.avatarUrl ? (
                      <img 
                        src={employee.avatarUrl} 
                        alt={employee.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <span className="font-medium">{employee.name}</span>
                  </div>
                </TD>
                <TD>{employee.role}</TD>
                <TD>
                  {employee.currentProjectId ? (
                    <span className="px-2 py-1 rounded text-xs" 
                          style={{ backgroundColor: 'var(--brand-accent)', color: 'white' }}>
                      Project #{employee.currentProjectId}
                    </span>
                  ) : (
                    <span className="text-gray-500">Unassigned</span>
                  )}
                </TD>
                <TD>
                  <span className="px-2 py-1 rounded text-xs bg-green-600 text-white">
                    Active
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
        Powered by {brandConfig?.companyName || 'StaffTrak'} Employee Management System
      </div>
    </div>
  );
}