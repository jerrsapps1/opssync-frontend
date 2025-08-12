import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function PrivacySettings() {
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

      {/* Data Retention */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            🕒 Data Retention Policy
          </CardTitle>
          <CardDescription className="text-gray-400">
            How long different types of data are kept in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Active Records</h4>
              <p className="text-gray-300 text-sm mb-1">Employee, Equipment, Project data</p>
              <p className="text-blue-400 text-sm font-medium">Retained indefinitely while active</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Activity Logs</h4>
              <p className="text-gray-300 text-sm mb-1">Assignment changes, system activities</p>
              <p className="text-green-400 text-sm font-medium">Retained for audit compliance</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Archived Data</h4>
              <p className="text-gray-300 text-sm mb-1">Deleted/completed records</p>
              <p className="text-yellow-400 text-sm font-medium">Soft-deleted, recoverable</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Session Data</h4>
              <p className="text-gray-300 text-sm mb-1">Login sessions, temporary data</p>
              <p className="text-purple-400 text-sm font-medium">Cleared on logout/expiry</p>
            </div>
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