import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

type Employee = { id: string; name: string; role?: string; phone?: string; email?: string; certs?: string };

async function fetchEmployee(id: string): Promise<Employee> {
  const r = await apiRequest("GET", `/api/employees/${id}`);
  return r.json();
}
async function updateEmployee(e: Employee) {
  const r = await apiRequest("PATCH", `/api/employees/${e.id}`, e);
  return r.json();
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["employee", id], queryFn: () => fetchEmployee(id!), enabled: !!id });
  const [form, setForm] = React.useState<Employee | null>(null);
  React.useEffect(() => { if (data) setForm(data); }, [data]);
  const save = useMutation({ mutationFn: updateEmployee, onSuccess: () => qc.invalidateQueries() });

  const { data: brandConfig } = useQuery<{
    logoUrl?: string;
    companyName?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }>({
    queryKey: ["/api/auth/brand-config"],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !form) return <div className="p-6 text-gray-400">Loading…</div>;

  return (
    <div className="p-6 space-y-6 bg-[color:var(--background)] min-h-screen">
      {/* Page Header with Brand Logo Placeholder */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/dashboard')} className="text-white hover:bg-[color:var(--card)]">
            ← Back
          </Button>
          {brandConfig?.logoUrl && (
            <img 
              src={brandConfig.logoUrl} 
              alt={`${brandConfig.companyName || 'Company'} Logo`}
              className="h-8 w-8 rounded"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold text-white">Employee Profile</h1>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Managing employee for {brandConfig?.companyName || 'your organization'}
            </p>
          </div>
        </div>
        <Button 
          onClick={()=>save.mutate(form)} 
          disabled={save.isPending}
          className="bg-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary)]/80 text-white"
        >
          {save.isPending ? "Saving..." : "💾 Save Changes"}
        </Button>
      </div>

      {/* Employee Details Card */}
      <Card className="p-6 bg-[color:var(--card)] border-[color:var(--border)]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>👤</span> Personal Information
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Full Name</label>
            <Input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} placeholder="Employee full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Job Role</label>
            <Input value={form.role || ""} onChange={(e)=>setForm({...form, role:e.target.value})} placeholder="Job title or role" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Email Address</label>
            <Input value={form.email || ""} onChange={(e)=>setForm({...form, email:e.target.value})} placeholder="employee@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Phone Number</label>
            <Input value={form.phone || ""} onChange={(e)=>setForm({...form, phone:e.target.value})} placeholder="(555) 123-4567" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-white mb-2">Certifications</label>
            <Input value={form.certs || ""} onChange={(e)=>setForm({...form, certs:e.target.value})} placeholder="Professional certifications or licenses" />
          </div>
        </div>
      </Card>

      {/* Company Footer */}
      <div className="text-center text-xs text-[color:var(--muted-foreground)] pt-6">
        Employee management for {brandConfig?.companyName || 'StaffTrak'} System
      </div>
    </div>
  );
}
