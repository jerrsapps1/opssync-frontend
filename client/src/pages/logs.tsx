import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, User, MapPin, ArrowRight, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AuditLog {
  id: string;
  assetType: string;
  assetId: string;
  assetName: string;
  sourceLocation: string;
  destinationLocation: string;
  performedBy: string;
  performedByEmail: string;
  timestamp: string;
  createdAt: string;
}

// Color schemes for different asset types and locations
const getAssetTypeColor = (assetType: string) => {
  switch (assetType?.toLowerCase()) {
    case 'employee':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'equipment':
      return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
};

const getLocationColor = (location: string) => {
  if (location === 'Unassigned') {
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  } else if (location === 'Repair Shop') {
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  } else {
    return 'bg-green-500/20 text-green-300 border-green-500/30';
  }
};

export default function Logs() {
  const [filterAssetType, setFilterAssetType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [limitLogs, setLimitLogs] = useState<string>('100');

  const { data: auditLogs = [], isLoading, error } = useQuery<AuditLog[]>({
    queryKey: ["/api", "audit-logs", { limit: limitLogs !== 'all' ? parseInt(limitLogs) : undefined }],
    queryFn: async () => {
      const url = limitLogs !== 'all' ? `/api/audit-logs?limit=${limitLogs}` : '/api/audit-logs';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    },
  });

  // Filter logs based on search and asset type
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.sourceLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.destinationLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedByEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAssetType = filterAssetType === 'all' || log.assetType === filterAssetType;
    
    return matchesSearch && matchesAssetType;
  });

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Time', 'Asset Type', 'Asset Name', 'Source', 'Destination', 'Performed By'],
      ...filteredLogs.map(log => [
        format(new Date(log.timestamp), 'yyyy-MM-dd'),
        format(new Date(log.timestamp), 'HH:mm:ss'),
        log.assetType,
        log.assetName,
        log.sourceLocation,
        log.destinationLocation,
        log.performedByEmail
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-gray-400">Complete audit trail of all asset movements and assignments</p>
        </div>

        {/* Filters and Controls */}
        <Card className="bg-[#1E1E2F] border-gray-700 p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by asset name, location, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#2A2A3E] border-gray-600 text-white placeholder-gray-400"
                data-testid="input-search-logs"
              />
            </div>

            {/* Asset Type Filter */}
            <Select value={filterAssetType} onValueChange={setFilterAssetType}>
              <SelectTrigger className="w-[180px] bg-[#2A2A3E] border-gray-600 text-white" data-testid="select-asset-type">
                <SelectValue placeholder="Asset Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A3E] border-gray-600">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="employee">Employees</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
              </SelectContent>
            </Select>

            {/* Limit */}
            <Select value={limitLogs} onValueChange={setLimitLogs}>
              <SelectTrigger className="w-[150px] bg-[#2A2A3E] border-gray-600 text-white" data-testid="select-limit">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A3E] border-gray-600">
                <SelectItem value="50">Last 50</SelectItem>
                <SelectItem value="100">Last 100</SelectItem>
                <SelectItem value="500">Last 500</SelectItem>
                <SelectItem value="all">All Logs</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button 
              onClick={handleExport}
              variant="outline"
              className="bg-[#2A2A3E] border-gray-600 text-white hover:bg-gray-700"
              data-testid="button-export"
            >
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="flex gap-6 text-sm text-gray-400">
              <span data-testid="text-total-logs">Total Logs: {auditLogs.length}</span>
              <span data-testid="text-filtered-logs">Filtered: {filteredLogs.length}</span>
              <span data-testid="text-employee-logs">Employees: {auditLogs.filter(l => l.assetType === 'employee').length}</span>
              <span data-testid="text-equipment-logs">Equipment: {auditLogs.filter(l => l.assetType === 'equipment').length}</span>
            </div>
          </div>
        </Card>

        {/* Logs List */}
        <Card className="bg-[#1E1E2F] border-gray-700">
          {isLoading ? (
            <div className="text-center text-gray-400 py-12">
              <div className="text-lg">Loading audit logs...</div>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-12">
              <div className="text-lg">Error loading audit logs</div>
              <div className="text-sm mt-2">Please try again later</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <div className="text-4xl mb-4">📋</div>
              <div className="text-xl mb-2">No audit logs found</div>
              <div className="text-sm">
                {auditLogs.length === 0 ? 
                  'Start making assignments to see audit logs here' : 
                  'Try adjusting your search filters'
                }
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredLogs.map((log, index) => (
                <div 
                  key={log.id}
                  className="p-4 hover:bg-[#2A2A3E] transition-colors duration-200"
                  data-testid={`log-entry-${index}`}
                >
                  <div className="flex items-start justify-between">
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Asset Type Badge */}
                        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getAssetTypeColor(log.assetType)}`}>
                          {log.assetType.charAt(0).toUpperCase() + log.assetType.slice(1)}
                        </span>
                        
                        {/* Asset Name */}
                        <span className="font-medium text-white" data-testid={`text-asset-name-${index}`}>
                          {log.assetName}
                        </span>
                      </div>

                      {/* Movement Details */}
                      <div className="flex items-center gap-3 text-sm">
                        {/* Source */}
                        <span className={`px-2 py-1 rounded-md border text-xs ${getLocationColor(log.sourceLocation)}`}>
                          <MapPin size={12} className="inline mr-1" />
                          {log.sourceLocation}
                        </span>
                        
                        {/* Arrow */}
                        <ArrowRight size={16} className="text-gray-400" />
                        
                        {/* Destination */}
                        <span className={`px-2 py-1 rounded-md border text-xs ${getLocationColor(log.destinationLocation)}`}>
                          <MapPin size={12} className="inline mr-1" />
                          {log.destinationLocation}
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="text-right text-xs text-gray-400 ml-4">
                      {/* Timestamp */}
                      <div className="flex items-center gap-1 mb-1">
                        <Clock size={12} />
                        <span data-testid={`text-timestamp-${index}`}>
                          {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      
                      {/* User */}
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span data-testid={`text-user-${index}`}>
                          {log.performedByEmail}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}