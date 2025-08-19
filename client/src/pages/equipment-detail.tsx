import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Equipment = { id: string; name: string; type: string; make?: string; model?: string; year?: number; serialNumber?: string; notes?: string };

async function fetchEquipment(id: string): Promise<Equipment> {
  const r = await apiRequest("GET", `/api/equipment/${id}`);
  return r.json();
}
async function updateEquipment(e: Equipment) {
  const r = await apiRequest("PATCH", `/api/equipment/${e.id}`, e);
  return r.json();
}

export default function EquipmentDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["equipment", id], queryFn: () => fetchEquipment(id!), enabled: !!id });
  const [form, setForm] = React.useState<Equipment | null>(null);
  React.useEffect(() => { if (data) setForm(data); }, [data]);
  const save = useMutation({ mutationFn: updateEquipment, onSuccess: () => qc.invalidateQueries() });

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
            <h1 className="text-2xl font-semibold text-white">Equipment Profile</h1>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Managing equipment for {brandConfig?.companyName || 'your organization'}
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

      {/* Equipment Details Card */}
      <Card className="p-6 bg-[color:var(--card)] border-[color:var(--border)]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🚜</span> Equipment Information
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Equipment Name</label>
            <Input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} placeholder="Equipment name or identifier" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Equipment Type</label>
            <Input value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})} placeholder="Excavator, Crane, etc." />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Manufacturer</label>
            <Input value={form.make || ""} onChange={(e)=>setForm({...form, make:e.target.value})} placeholder="Caterpillar, John Deere, etc." />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Model</label>
            <Input value={form.model || ""} onChange={(e)=>setForm({...form, model:e.target.value})} placeholder="Model number or name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Year</label>
            <Input value={String(form.year||"")} onChange={(e)=>setForm({...form, year:Number(e.target.value)||undefined})} placeholder="Manufacturing year" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Serial Number</label>
            <Input value={form.serialNumber || ""} onChange={(e)=>setForm({...form, serialNumber:e.target.value})} placeholder="Serial number" />
          </div>
          {form.notes !== undefined && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">Notes</label>
              <Input value={form.notes || ""} onChange={(e)=>setForm({...form, notes:e.target.value})} placeholder="Additional notes or specifications" />
            </div>
          )}
        </div>
      </Card>

      {/* Company Footer */}
      <div className="text-center text-xs text-[color:var(--muted-foreground)] pt-6">
        Equipment management for {brandConfig?.companyName || 'StaffTrak'} System
      </div>
    </div>
  );
}
