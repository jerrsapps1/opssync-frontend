import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export default function Settings() {
  const { data: brandConfig } = useQuery<{
    logoUrl?: string;
    companyName?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }>({
    queryKey: ["/api/auth/brand-config"],
    staleTime: 5 * 60 * 1000,
  });

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
            <h1 className="text-2xl font-semibold text-white">Settings</h1>
            <p className="text-sm text-gray-400">
              Configure {brandConfig?.companyName || 'OpsSync.ai'} preferences
            </p>
          </div>
        </div>
        <Button>
          <span className="mr-2">💾</span>
          Save All Changes
        </Button>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>⚙️</span> General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organization Name
              </label>
              <Input 
                placeholder="Enter organization name" 
                defaultValue={brandConfig?.companyName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time Zone
              </label>
              <Select>
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Standard Time</option>
                <option value="PST">Pacific Standard Time</option>
                <option value="CST">Central Standard Time</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Default Project Duration (days)
              </label>
              <Input type="number" placeholder="30" />
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔔</span> Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Email notifications</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Conflict alerts</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Equipment maintenance reminders</span>
              <input type="checkbox" className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Project deadline warnings</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </div>
        </Card>

        {/* Data & Privacy */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔒</span> Data & Privacy
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data Retention Period
              </label>
              <Select>
                <option value="90">90 days</option>
                <option value="180">6 months</option>
                <option value="365">1 year</option>
                <option value="1095">3 years</option>
              </Select>
            </div>
            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                <span className="mr-2">📤</span>
                Export All Data
              </Button>
              <Button variant="outline" className="w-full">
                <span className="mr-2">🗑️</span>
                Delete Account Data
              </Button>
            </div>
          </div>
        </Card>

        {/* System Integration */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔗</span> Integrations
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded bg-gray-800">
              <div className="flex items-center gap-3">
                <span>📊</span>
                <div>
                  <div className="text-white">Analytics Platform</div>
                  <div className="text-xs text-gray-400">Google Analytics</div>
                </div>
              </div>
              <Button variant="ghost" size="sm">Configure</Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-gray-800">
              <div className="flex items-center gap-3">
                <span>💬</span>
                <div>
                  <div className="text-white">Team Communication</div>
                  <div className="text-xs text-gray-400">Slack Integration</div>
                </div>
              </div>
              <Button variant="ghost" size="sm">Connect</Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-gray-800">
              <div className="flex items-center gap-3">
                <span>📧</span>
                <div>
                  <div className="text-white">Email Service</div>
                  <div className="text-xs text-gray-400">SMTP Configuration</div>
                </div>
              </div>
              <Button variant="ghost" size="sm">Setup</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Brand Configuration Link */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--brand-primary)' }}>
              <span className="text-white text-xl">🎨</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">White Label Configuration</h3>
              <p className="text-sm text-gray-400">
                Customize branding, colors, and appearance for {brandConfig?.companyName || 'your organization'}
              </p>
            </div>
          </div>
          <Button onClick={() => window.location.href = '/white-label'}>
            Configure Branding
          </Button>
        </div>
      </Card>

      {/* Company Footer */}
      <div className="text-center text-xs text-gray-500 pt-6">
        Settings for {brandConfig?.companyName || 'StaffTrak'} Management System
      </div>
    </div>
  );
}