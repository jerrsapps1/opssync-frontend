import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type BrandConfig = {
  companyName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  headerBgColor?: string;
  sidebarBgColor?: string;
  textColor?: string;
  buttonRadius?: number; // px
  fontFamily?: string;
  enableDarkMode?: boolean;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  loginBackgroundUrl?: string | null;
  dateFormat?: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  timeFormat?: "12h" | "24h";
  customCss?: string;
};

const DEFAULTS: BrandConfig = {
  companyName: "Your Company",
  primaryColor: "#2563eb",
  secondaryColor: "#8b5cf6",
  accentColor: "#22c55e",
  headerBgColor: "#1f2937",
  sidebarBgColor: "#111827",
  textColor: "#e5e7eb",
  buttonRadius: 10,
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
  enableDarkMode: true,
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
};

async function fetchBrandConfig(): Promise<BrandConfig> {
  const res = await apiRequest("GET", "/api/auth/brand-config");
  return res.json();
}

async function getUploadUrl(file: File): Promise<{ uploadUrl: string; publicUrl: string }> {
  const r = await apiRequest("POST", "/api/logo/upload-url", {
    fileName: file.name,
    contentType: file.type || "image/png",
  });
  return r.json();
}

async function uploadAndGetUrl(file: File) {
  const { uploadUrl, publicUrl } = await getUploadUrl(file);
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/png" },
    body: file,
  });
  return publicUrl;
}

async function downloadUrlToFile(url: string, filename: string) {
  const res = await fetch(url, { mode: "cors" });
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 800);
}

export default function WhiteLabelPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["brandConfig"],
    queryFn: fetchBrandConfig,
  });
  const [form, setForm] = useState<BrandConfig>(DEFAULTS);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (data) setForm({ ...DEFAULTS, ...data });
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (payload: BrandConfig) => {
      const res = await apiRequest("PATCH", "/api/auth/brand-config", payload);
      return res.json();
    },
    onSuccess: () => setOpen(true),
  });

  const preview = useMemo(
    () => ({
      header: {
        backgroundColor: form.headerBgColor || DEFAULTS.headerBgColor,
        color: form.textColor || DEFAULTS.textColor,
      },
      sidebar: {
        backgroundColor: form.sidebarBgColor || DEFAULTS.sidebarBgColor,
        color: form.textColor || DEFAULTS.textColor,
      },
      button: {
        backgroundColor: form.primaryColor || DEFAULTS.primaryColor,
        borderRadius: (form.buttonRadius ?? DEFAULTS.buttonRadius) + "px",
        color: "#fff",
      },
      chip: {
        backgroundColor: form.accentColor || DEFAULTS.accentColor,
        color: "#0b1220",
      },
    }),
    [form]
  );

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-sm mb-1 text-gray-300">{label}</label>
        {children}
      </div>
    );
  }

  if (isLoading) return <div className="p-6 text-gray-300">Loading brand config…</div>;

  return (
    <div className="p-6 text-gray-200">
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Theme Saved"
        description="Your white-label settings were saved successfully."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={() => (window.location.href = '/dashboard')}>Back to Dashboard</Button>
          </div>
        }
      >
        <div className="text-sm text-gray-300">
          Changes are now applied app-wide. You can continue editing or go back to the dashboard.
        </div>
      </Dialog>

      <h1 className="text-2xl font-semibold mb-1">White Label Configuration</h1>
      <p className="text-sm text-gray-400 mb-6">
        Customize the look & feel for your organization.
      </p>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* FORM */}
        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-5">
          <Field label="Company / Brand Name">
            <input
              value={form.companyName || ""}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]"
              placeholder="Acme Construction Co."
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary Color">
              <input
                type="color"
                value={form.primaryColor || ""}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="w-14 h-10 p-1 bg-gray-800 rounded"
                title={form.primaryColor}
              />
            </Field>
            <Field label="Secondary Color">
              <input
                type="color"
                value={form.secondaryColor || ""}
                onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                className="w-14 h-10 p-1 bg-gray-800 rounded"
              />
            </Field>
            <Field label="Accent Color">
              <input
                type="color"
                value={form.accentColor || ""}
                onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                className="w-14 h-10 p-1 bg-gray-800 rounded"
              />
            </Field>
            <Field label="Text Color">
              <input
                type="color"
                value={form.textColor || ""}
                onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                className="w-14 h-10 p-1 bg-gray-800 rounded"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Header Background">
              <input
                type="color"
                value={form.headerBgColor || ""}
                onChange={(e) => setForm({ ...form, headerBgColor: e.target.value })}
                className="w-14 h-10 p-1 bg-gray-800 rounded"
              />
            </Field>
            <Field label="Sidebar Background">
              <input
                type="color"
                value={form.sidebarBgColor || ""}
                onChange={(e) => setForm({ ...form, sidebarBgColor: e.target.value })}
                className="w-14 h-10 p-1 bg-gray-800 rounded"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Button Radius (px)">
              <input
                type="number"
                value={form.buttonRadius ?? 10}
                onChange={(e) => setForm({ ...form, buttonRadius: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]"
              />
            </Field>
            <Field label="Font Family">
              <input
                value={form.fontFamily || ""}
                onChange={(e) => setForm({ ...form, fontFamily: e.target.value })}
                className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]"
                placeholder="Inter, Segoe UI, Roboto, …"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date Format">
              <Select
                value={form.dateFormat || "MM/DD/YYYY"}
                onChange={(e) => setForm({ ...form, dateFormat: e.target.value as any })}
              >
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </Select>
            </Field>
            <Field label="Time Format">
              <Select
                value={form.timeFormat || "12h"}
                onChange={(e) => setForm({ ...form, timeFormat: e.target.value as any })}
              >
                <option value="12h">12h</option>
                <option value="24h">24h</option>
              </Select>
            </Field>
          </div>

          {/* Uploaders */}
          <div className="grid grid-cols-1 gap-4">
            <Field label="Logo">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = await uploadAndGetUrl(f);
                    setForm((s) => ({ ...s, logoUrl: url }));
                  }}
                />
                {form.logoUrl && (
                  <>
                    <img src={form.logoUrl} alt="Logo" className="h-10 rounded bg-white p-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => downloadUrlToFile(form.logoUrl!, "brand-logo")}
                    >
                      Download
                    </Button>
                  </>
                )}
              </div>
            </Field>

            <Field label="Favicon">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = await uploadAndGetUrl(f);
                    setForm((s) => ({ ...s, faviconUrl: url }));
                  }}
                />
                {form.faviconUrl && (
                  <img src={form.faviconUrl} alt="Favicon" className="h-8 w-8 rounded bg-white p-1" />
                )}
              </div>
            </Field>

            <Field label="Login Background">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = await uploadAndGetUrl(f);
                    setForm((s) => ({ ...s, loginBackgroundUrl: url }));
                  }}
                />
                {form.loginBackgroundUrl && (
                  <img src={form.loginBackgroundUrl} alt="Login bg" className="h-12 rounded" />
                )}
              </div>
            </Field>
          </div>

          <Field label="Custom CSS (optional)">
            <textarea
              value={form.customCss || ""}
              onChange={(e) => setForm({ ...form, customCss: e.target.value })}
              className="w-full h-28 px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-[color:var(--brand-primary)]"
              placeholder=":root { --brand-radius: 12px }"
            />
          </Field>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.enableDarkMode}
                onChange={(e) => setForm({ ...form, enableDarkMode: e.target.checked })}
              />
              Enable Dark Mode
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setForm(DEFAULTS)}
            >
              Reset to Defaults
            </Button>
          </div>
        </form>

        {/* LIVE PREVIEW */}
        <div className="rounded-lg border border-gray-800 overflow-hidden">
          <div className="p-3" style={{ fontFamily: form.fontFamily }}>
            <div className="h-12 flex items-center px-4" style={preview.header}>
              <div className="flex items-center gap-2">
                {form.logoUrl && <img src={form.logoUrl} className="h-8 rounded bg-white p-1" />}
                <span className="font-semibold">{form.companyName || "Company"}</span>
              </div>
            </div>
            <div className="flex">
              <div className="w-44 p-3 text-sm" style={preview.sidebar}>
                <div className="opacity-80 mb-2">Sidebar</div>
                <div className="space-y-1">
                  <div className="px-2 py-1 rounded bg-gray-900/40">Dashboard</div>
                  <div className="px-2 py-1 rounded hover:bg-gray-900/40">Employees</div>
                  <div className="px-2 py-1 rounded hover:bg-gray-900/40">Equipment</div>
                </div>
              </div>
              <div className="flex-1 p-4 space-y-3" style={{ color: form.textColor || DEFAULTS.textColor }}>
                <div className="inline-block px-2 py-1 rounded text-xs" style={preview.chip}>
                  Accent Chip
                </div>
                <div>
                  <button style={preview.button} className="px-3 py-2">Primary Button</button>
                </div>
                <div className="text-xs opacity-70">
                  {form.dateFormat} • {form.timeFormat}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {form.customCss && <style>{form.customCss}</style>}
    </div>
  );
}
