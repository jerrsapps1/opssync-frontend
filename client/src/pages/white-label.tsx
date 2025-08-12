import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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

  useEffect(() => {
    if (data) setForm({ ...DEFAULTS, ...data });
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (payload: BrandConfig) => {
      const res = await apiRequest("PATCH", "/api/auth/brand-config", payload);
      return res.json();
    },
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
              className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Font Family">
              <input
                value={form.fontFamily || ""}
                onChange={(e) => setForm({ ...form, fontFamily: e.target.value })}
                className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Inter, Segoe UI, Roboto, …"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date Format">
              <select
                value={form.dateFormat || "MM/DD/YYYY"}
                onChange={(e) => setForm({ ...form, dateFormat: e.target.value as any })}
                className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </Field>
            <Field label="Time Format">
              <select
                value={form.timeFormat || "12h"}
                onChange={(e) => setForm({ ...form, timeFormat: e.target.value as any })}
                className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12h">12h</option>
                <option value="24h">24h</option>
              </select>
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
                    <button
                      type="button"
                      onClick={() => downloadUrlToFile(form.logoUrl!, "brand-logo")}
                      className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      Download
                    </button>
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
              className="w-full h-28 px-3 py-2 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-blue-500"
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
            <button
              type="submit"
              className="px-4 py-2 rounded text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-primary-foreground)' }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setForm(DEFAULTS)}
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
            >
              Reset to Defaults
            </button>
          </div>

          {updateMutation.isSuccess && (
            <div className="text-green-400 text-sm">✓ Configuration saved successfully!</div>
          )}
          {updateMutation.isError && (
            <div className="text-red-400 text-sm">
              ✗ Error saving config: {String(updateMutation.error)}
            </div>
          )}
        </form>

        {/* LIVE PREVIEW */}
        <div className="sticky top-6">
          <h3 className="text-lg font-medium mb-4">Live Preview</h3>
          <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800">
            {/* Mock Header */}
            <div className="h-14 flex items-center px-4" style={preview.header}>
              <div className="flex items-center gap-3">
                {form.logoUrl && (
                  <img src={form.logoUrl} alt="Logo" className="h-8 w-8 rounded" />
                )}
                <span className="font-semibold">{form.companyName || "Your Company"}</span>
              </div>
            </div>

            {/* Mock Sidebar + Content */}
            <div className="flex h-48">
              <div className="w-40 p-3 space-y-2" style={preview.sidebar}>
                <div className="text-xs opacity-75">Navigation</div>
                <div className="text-sm">Dashboard</div>
                <div className="text-sm">Settings</div>
                <div className="text-sm">Reports</div>
              </div>
              <div className="flex-1 p-4 bg-gray-900">
                <div className="flex gap-2 mb-3">
                  <button className="px-3 py-1.5 text-sm rounded" style={preview.button}>
                    Primary Button
                  </button>
                  <span className="px-2 py-1 text-xs rounded" style={preview.chip}>
                    Accent
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  Font: {form.fontFamily?.split(",")[0] || "Inter"}
                </div>
                <div className="text-sm text-gray-400">
                  Button radius: {form.buttonRadius ?? 10}px
                </div>
                <div className="text-sm text-gray-400">
                  Date format: {form.dateFormat || "MM/DD/YYYY"}
                </div>
                <div className="text-sm text-gray-400">
                  Time format: {form.timeFormat || "12h"}
                </div>
              </div>
            </div>
          </div>

          {form.customCss && (
            <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Custom CSS Preview:</div>
              <pre className="text-xs text-green-400 whitespace-pre-wrap break-words">
                {form.customCss}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}