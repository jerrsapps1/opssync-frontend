import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export default function AnalyticsPage() {
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
            <h1 className="text-2xl font-semibold text-white">Analytics Dashboard</h1>
            <p className="text-sm text-gray-400">
              Performance insights for {brandConfig?.companyName || 'your organization'}
            </p>
          </div>
        </div>
        <Button>
          <span className="mr-2">📊</span>
          Generate Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--brand-primary)' }}>
              <span className="text-white text-xl">👥</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">247</div>
              <div className="text-sm text-gray-400">Active Employees</div>
              <div className="text-xs text-green-400">↗ +12% from last month</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--brand-secondary)' }}>
              <span className="text-white text-xl">🚜</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">89%</div>
              <div className="text-sm text-gray-400">Equipment Utilization</div>
              <div className="text-xs text-green-400">↗ +5% from last month</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--brand-accent)' }}>
              <span className="text-white text-xl">📋</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">15</div>
              <div className="text-sm text-gray-400">Active Projects</div>
              <div className="text-xs text-yellow-400">→ No change</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-600">
              <span className="text-white text-xl">💰</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">$2.4M</div>
              <div className="text-sm text-gray-400">Revenue (YTD)</div>
              <div className="text-xs text-green-400">↗ +18% from last year</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Project Timeline</h3>
          <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <div className="text-4xl mb-2">📈</div>
              <div>Timeline chart placeholder</div>
              <div className="text-xs mt-2">
                Brand colors: <span style={{ color: 'var(--brand-primary)' }}>Primary</span>, 
                <span style={{ color: 'var(--brand-secondary)' }}> Secondary</span>, 
                <span style={{ color: 'var(--brand-accent)' }}> Accent</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Resource Allocation</h3>
          <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <div className="text-4xl mb-2">🍩</div>
              <div>Pie chart placeholder</div>
              <div className="text-xs mt-2">Using white-label brand colors</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { icon: "👤", action: "John Smith assigned to Downtown Mall project", time: "2 minutes ago" },
            { icon: "🚜", action: "Excavator #247 moved to Highway Expansion", time: "15 minutes ago" },
            { icon: "📋", action: "Bridge Construction project status updated", time: "1 hour ago" },
            { icon: "⚠️", action: "Equipment maintenance alert for Crane #103", time: "2 hours ago" },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gray-800">
              <div className="p-2 rounded" style={{ backgroundColor: 'var(--brand-primary)' }}>
                <span className="text-white">{item.icon}</span>
              </div>
              <div className="flex-1">
                <div className="text-white">{item.action}</div>
                <div className="text-xs text-gray-400">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Company Footer */}
      <div className="text-center text-xs text-gray-500 pt-6">
        Analytics powered by {brandConfig?.companyName || 'StaffTrak'} Business Intelligence
      </div>
    </div>
  );
}