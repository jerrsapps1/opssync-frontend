import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Switch from "../components/Switch";
import { useToast } from "../hooks/use-toast";

interface FeatureSettings {
  supervisor: boolean | null;
  manager: boolean | null;
  sla: boolean | null;
  reminders: boolean | null;
  escalations: boolean | null;
  weekly_digest: boolean | null;
}

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  daily_digest: boolean;
  weekly_digest: boolean;
  timezone: string;
  escalation_after_hours: number;
}

export default function OrgSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch feature settings
  const { data: features, isLoading: featuresLoading } = useQuery({
    queryKey: ["/api/org-admin/features"],
    queryFn: async () => {
      const response = await fetch("/api/org-admin/features");
      if (!response.ok) throw new Error("Failed to fetch feature settings");
      return response.json() as Promise<FeatureSettings>;
    }
  });

  // Fetch notification settings
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/org-admin/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/org-admin/notifications");
      if (!response.ok) throw new Error("Failed to fetch notification settings");
      return response.json() as Promise<NotificationSettings>;
    }
  });

  // Update feature settings
  const updateFeaturesMutation = useMutation({
    mutationFn: async (newFeatures: FeatureSettings) => {
      const response = await fetch("/api/org-admin/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFeatures)
      });
      if (!response.ok) throw new Error("Failed to update feature settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin/features"] });
      toast({
        title: "Success",
        description: "Feature settings updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feature settings",
        variant: "destructive"
      });
    }
  });

  // Update notification settings
  const updateNotificationsMutation = useMutation({
    mutationFn: async (newNotifications: NotificationSettings) => {
      const response = await fetch("/api/org-admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotifications)
      });
      if (!response.ok) throw new Error("Failed to update notification settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin/notifications"] });
      toast({
        title: "Success", 
        description: "Notification settings updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive"
      });
    }
  });

  const updateFeatureSetting = (key: keyof FeatureSettings, value: boolean | null) => {
    if (!features) return;
    const updated = { ...features, [key]: value };
    updateFeaturesMutation.mutate(updated);
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, value: any) => {
    if (!notifications) return;
    const updated = { ...notifications, [key]: value };
    updateNotificationsMutation.mutate(updated);
  };

  if (featuresLoading || notificationsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Organization Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure features and notifications for your organization.
        </p>
      </div>

      {/* Feature Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Feature Controls</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Enable or disable features for your organization. When set to default (gray), global settings apply.
        </p>
        
        <div className="space-y-6">
          <Switch
            checked={features?.supervisor === true}
            onChange={(checked) => updateFeatureSetting('supervisor', checked ? true : null)}
            label="Supervisor Portal"
            description="Access to supervisor dashboard and timeliness tracking"
          />
          
          <Switch
            checked={features?.manager === true}
            onChange={(checked) => updateFeatureSetting('manager', checked ? true : null)}
            label="Manager Dashboard"
            description="Executive oversight with RAG rollups and analytics"
          />
          
          <Switch
            checked={features?.sla === true}
            onChange={(checked) => updateFeatureSetting('sla', checked ? true : null)}
            label="SLA Management"
            description="Service level agreement tracking and reporting"
          />
          
          <Switch
            checked={features?.reminders === true}
            onChange={(checked) => updateFeatureSetting('reminders', checked ? true : null)}
            label="Automated Reminders"
            description="Automatic reminder notifications for due items"
          />
          
          <Switch
            checked={features?.escalations === true}
            onChange={(checked) => updateFeatureSetting('escalations', checked ? true : null)}
            label="Auto Escalations"
            description="Automatic escalation of overdue items to managers"
          />
          
          <Switch
            checked={features?.weekly_digest === true}
            onChange={(checked) => updateFeatureSetting('weekly_digest', checked ? true : null)}
            label="Weekly Digest"
            description="Weekly summary emails sent every Monday morning"
          />
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Notification Preferences</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Configure how and when your organization receives notifications.
        </p>
        
        <div className="space-y-6">
          <Switch
            checked={notifications?.email_enabled || false}
            onChange={(checked) => updateNotificationSetting('email_enabled', checked)}
            label="Email Notifications"
            description="Send notifications via email"
          />
          
          <Switch
            checked={notifications?.sms_enabled || false}
            onChange={(checked) => updateNotificationSetting('sms_enabled', checked)}
            label="SMS Notifications"
            description="Send critical notifications via SMS"
          />
          
          <Switch
            checked={notifications?.daily_digest || false}
            onChange={(checked) => updateNotificationSetting('daily_digest', checked)}
            label="Daily Digest"
            description="Daily summary of activities and pending items"
          />
          
          <Switch
            checked={notifications?.weekly_digest || false}
            onChange={(checked) => updateNotificationSetting('weekly_digest', checked)}
            label="Weekly Digest"
            description="Weekly project status reports"
          />
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Escalation Timing
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Hours before escalating overdue items
              </p>
            </div>
            <div className="w-20">
              <input
                type="number"
                min="1"
                max="48"
                value={notifications?.escalation_after_hours || 4}
                onChange={(e) => updateNotificationSetting('escalation_after_hours', parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Timezone
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Timezone for scheduling notifications
              </p>
            </div>
            <div className="w-48">
              <select
                value={notifications?.timezone || 'America/Chicago'}
                onChange={(e) => updateNotificationSetting('timezone', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}