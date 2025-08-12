import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function PrivacySettings() {
  const { toast } = useToast();
  const [retentionSettings, setRetentionSettings] = useState({
    activityLogs: "2years",
    archivedData: "5years", 
    sessionData: "30days",
    autoDelete: true,
    complianceMode: false
  });

  const handleRetentionChange = (key: string, value: string) => {
    setRetentionSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSwitchChange = (key: string, checked: boolean) => {
    setRetentionSettings(prev => ({ ...prev, [key]: checked }));
  };

  const saveRetentionSettings = () => {
    // Here you would typically save to backend
    toast({
      title: "Settings Saved",
      description: "Data retention preferences have been updated.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Data & Privacy</h2>
        <p className="text-gray-400 text-sm">
          Information about what data is stored and how it's managed in your StaffTrak system.
        </p>
      </div>

      {/* Data Storage Overview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            🗄️ Data Storage Location
          </CardTitle>
          <CardDescription className="text-gray-400">
            Where your organization's data is stored and managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Primary Database</h4>
              <p className="text-gray-300 text-sm mb-2">PostgreSQL Database (Neon)</p>
              <Badge variant="outline" className="text-green-400 border-green-400">
                Encrypted & Secure
              </Badge>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">File Storage</h4>
              <p className="text-gray-300 text-sm mb-2">Object Storage (Google Cloud)</p>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                Redundant Backup
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Categories */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            📊 Data Categories Stored
          </CardTitle>
          <CardDescription className="text-gray-400">
            Complete breakdown of what information is retained in your system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Employee Data */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              👥 Employee Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="text-gray-300">• Name & Role</div>
              <div className="text-gray-300">• Email & Phone</div>
              <div className="text-gray-300">• Emergency Contact</div>
              <div className="text-gray-300">• Company Affiliation</div>
              <div className="text-gray-300">• Employment Status</div>
              <div className="text-gray-300">• Current Assignments</div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Equipment Data */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              🚜 Equipment Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="text-gray-300">• Equipment Names & Types</div>
              <div className="text-gray-300">• Make & Model</div>
              <div className="text-gray-300">• Serial Numbers</div>
              <div className="text-gray-300">• Asset Numbers</div>
              <div className="text-gray-300">• Status & Availability</div>
              <div className="text-gray-300">• Project Assignments</div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Project Data */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              📋 Project Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="text-gray-300">• Project Names & Numbers</div>
              <div className="text-gray-300">• Location & GPS Data</div>
              <div className="text-gray-300">• Status & Progress</div>
              <div className="text-gray-300">• Budget & Cost Data</div>
              <div className="text-gray-300">• Contact Information</div>
              <div className="text-gray-300">• Timeline & Dates</div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* System Data */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              ⚙️ System & Activity Data
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="text-gray-300">• Assignment History</div>
              <div className="text-gray-300">• User Activity Logs</div>
              <div className="text-gray-300">• System Alerts</div>
              <div className="text-gray-300">• Brand Configuration</div>
              <div className="text-gray-300">• User Accounts</div>
              <div className="text-gray-300">• Login Sessions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention Settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            🕒 Data Retention Settings
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure how long different types of data are kept in your system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Active Records - Always Retained */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium mb-1">Active Records</h4>
                <p className="text-gray-400 text-sm">Employee, Equipment, Project data</p>
              </div>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                Always Retained
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Active operational data is retained indefinitely while entities remain in the system
            </p>
          </div>

          {/* Activity Logs */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-white font-medium mb-1">Activity Logs</h4>
                <p className="text-gray-400 text-sm">Assignment changes, system activities, audit trail</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="activity-retention" className="text-gray-300 text-sm">
                Retain for:
              </Label>
              <Select 
                value={retentionSettings.activityLogs} 
                onValueChange={(value) => handleRetentionChange('activityLogs', value)}
              >
                <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1year">1 Year</SelectItem>
                  <SelectItem value="2years">2 Years</SelectItem>
                  <SelectItem value="3years">3 Years</SelectItem>
                  <SelectItem value="5years">5 Years</SelectItem>
                  <SelectItem value="7years">7 Years</SelectItem>
                  <SelectItem value="indefinite">Indefinite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Archived Data */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-white font-medium mb-1">Archived Data</h4>
                <p className="text-gray-400 text-sm">Deleted/completed records, soft-deleted items</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="archive-retention" className="text-gray-300 text-sm">
                Retain for:
              </Label>
              <Select 
                value={retentionSettings.archivedData} 
                onValueChange={(value) => handleRetentionChange('archivedData', value)}
              >
                <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="1year">1 Year</SelectItem>
                  <SelectItem value="2years">2 Years</SelectItem>
                  <SelectItem value="5years">5 Years</SelectItem>
                  <SelectItem value="indefinite">Indefinite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Session Data */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-white font-medium mb-1">Session Data</h4>
                <p className="text-gray-400 text-sm">Login sessions, temporary cache, user preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="session-retention" className="text-gray-300 text-sm">
                Auto-clear after:
              </Label>
              <Select 
                value={retentionSettings.sessionData} 
                onValueChange={(value) => handleRetentionChange('sessionData', value)}
              >
                <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">1 Day</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="90days">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-delete" className="text-white font-medium">
                  Automatic Data Cleanup
                </Label>
                <p className="text-gray-400 text-sm">
                  Automatically delete data when retention periods expire
                </p>
              </div>
              <Switch
                id="auto-delete"
                checked={retentionSettings.autoDelete}
                onCheckedChange={(checked) => handleSwitchChange('autoDelete', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="compliance-mode" className="text-white font-medium">
                  Compliance Mode
                </Label>
                <p className="text-gray-400 text-sm">
                  Enable extended retention for regulatory compliance
                </p>
              </div>
              <Switch
                id="compliance-mode"
                checked={retentionSettings.complianceMode}
                onCheckedChange={(checked) => handleSwitchChange('complianceMode', checked)}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button 
              onClick={saveRetentionSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Retention Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Security */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            🔐 Data Security Measures
          </CardTitle>
          <CardDescription className="text-gray-400">
            Security protocols protecting your organization's data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-900 rounded-lg">
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="text-white font-medium mb-1">Encryption</h4>
              <p className="text-gray-400 text-xs">Data encrypted at rest and in transit</p>
            </div>
            <div className="text-center p-4 bg-gray-900 rounded-lg">
              <div className="text-2xl mb-2">🛡️</div>
              <h4 className="text-white font-medium mb-1">Access Control</h4>
              <p className="text-gray-400 text-xs">Role-based authentication required</p>
            </div>
            <div className="text-center p-4 bg-gray-900 rounded-lg">
              <div className="text-2xl mb-2">📋</div>
              <h4 className="text-white font-medium mb-1">Audit Trail</h4>
              <p className="text-gray-400 text-xs">Complete activity logging for compliance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Notice */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2">📋 Compliance & Privacy</h4>
        <p className="text-blue-200 text-sm leading-relaxed">
          This system stores operational data necessary for construction and equipment management. 
          All personal information is kept secure and used solely for project coordination and safety compliance. 
          Data access is restricted to authorized personnel within your organization.
        </p>
      </div>
    </div>
  );
}