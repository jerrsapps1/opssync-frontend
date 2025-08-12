import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type BrandConfig = {
  companyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string | null;
};

async function fetchBrandConfig(): Promise<BrandConfig> {
  const res = await apiRequest("GET", "/api/auth/brand-config");
  return res.json();
}

export default function WhiteLabelPage() {
  const { data, isLoading } = useQuery({ queryKey: ["brandConfig"], queryFn: fetchBrandConfig });
  const [form, setForm] = useState<BrandConfig>({});

  React.useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (payload: BrandConfig) => {
      const res = await apiRequest("PATCH", "/api/auth/brand-config", payload);
      return res.json();
    },
  });

  async function handleLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = await apiRequest("POST", "/api/logo/upload-url", {
      fileName: file.name,
      contentType: file.type || "image/png",
    });
    const { uploadUrl, publicUrl } = await r.json();
    await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "image/png" }, body: file });
    setForm((f) => ({ ...f, logoUrl: publicUrl }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate(form);
  }

  if (isLoading) {
    return <div className="p-6 text-gray-300">Loading brand config…</div>;
  }

  return (
    <div className="p-6 text-gray-200 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">White Label Configuration</h1>
      <p className="text-sm text-gray-400 mb-6">
        Update your brand name, colors, and logo. These settings customize the look & feel for your org.
      </p>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm mb-1">Company/Brand Name</label>
          <input
            value={form.companyName || ""}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Acme Construction Co."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Primary Color (hex)</label>
            <input
              value={form.primaryColor || ""}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#3b82f6"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Secondary Color (hex)</label>
            <input
              value={form.secondaryColor || ""}
              onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#1e40af"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Logo Upload</label>
          <div className="flex items-center space-x-4">
            <input type="file" accept="image/*" onChange={handleLogoPick} className="text-sm" />
            {form.logoUrl && (
              <img src={form.logoUrl} alt="Logo preview" className="h-12 w-auto rounded border" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save Brand Config"}
          </button>
          {updateMutation.isSuccess && <span className="text-green-400 text-sm">✓ Saved!</span>}
          {updateMutation.isError && <span className="text-red-400 text-sm">Error saving config</span>}
        </div>
      </form>
    </div>
  );
}