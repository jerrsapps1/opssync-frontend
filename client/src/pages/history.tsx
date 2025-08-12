import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

async function getHistory(): Promise<any[]> {
  const r = await apiRequest("GET", "/api/history");
  return r.json();
}

export default function HistoryPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["history"], queryFn: getHistory });
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7"); // days
  const [searchTerm, setSearchTerm] = useState("");

  // Filter data to focus on assignment-related actions
  const filteredData = useMemo(() => {
    const now = new Date();
    const daysBack = parseInt(dateRange);
    const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    return data
      .filter(item => {
        // Filter by assignment-related actions
        const isAssignmentAction = item.action?.toLowerCase().includes('assign') || 
                                 item.action?.toLowerCase().includes('move') ||
                                 item.action?.toLowerCase().includes('transfer');
        
        // Filter by date range
        const itemDate = new Date(item.at);
        const isInDateRange = itemDate >= cutoffDate;
        
        // Filter by entity type
        const matchesEntity = entityFilter === "all" || item.entity === entityFilter;
        
        // Filter by search term
        const matchesSearch = searchTerm === "" || 
                            item.entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return isAssignmentAction && isInDateRange && matchesEntity && matchesSearch;
      })
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [data, entityFilter, dateRange, searchTerm]);

  const clearFilters = () => {
    setEntityFilter("all");
    setDateRange("7");
    setSearchTerm("");
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Assignment History</h1>
        <a className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors" href="/dashboard">
          ← Back to Dashboard
        </a>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Entity Type</label>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="employee">Employees</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <Input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="flex items-end">
            <Button 
              onClick={clearFilters}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-gray-400 text-sm">
          Showing {filteredData.length} assignment changes
          {entityFilter !== "all" && ` for ${entityFilter}s`}
          {` in the last ${dateRange} ${parseInt(dateRange) === 1 ? 'day' : 'days'}`}
          {filteredData.length > 0 && (
            <span className="ml-4">
              • {new Set(filteredData.map(h => h.userId || h.user || 'System')).size} users involved
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-center py-8">Loading assignment history...</div>
      ) : filteredData.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          No assignment changes found for the selected filters.
        </div>
      ) : (
        <div className="rounded border border-gray-700 overflow-hidden bg-gray-800">
          <Table>
            <THead>
              <TR>
                <TH className="text-gray-300">Date & Time</TH>
                <TH className="text-gray-300">Who</TH>
                <TH className="text-gray-300">Entity</TH>
                <TH className="text-gray-300">Assignment Action</TH>
                <TH className="text-gray-300">Details</TH>
              </TR>
            </THead>
            <TBody>
              {filteredData.map((h, i) => (
                <TR key={i} className="hover:bg-gray-750">
                  <TD className="text-gray-300">
                    <div className="text-sm">
                      {new Date(h.at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(h.at).toLocaleTimeString()}
                    </div>
                  </TD>
                  <TD className="text-gray-300">
                    <div className="text-sm font-medium">
                      {h.userId || h.user || 'System'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {h.userRole || 'Admin'}
                    </div>
                  </TD>
                  <TD className="capitalize text-gray-300">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      h.entity === 'employee' ? 'bg-green-900 text-green-300' :
                      h.entity === 'equipment' ? 'bg-blue-900 text-blue-300' :
                      'bg-purple-900 text-purple-300'
                    }`}>
                      {h.entity}
                    </span>
                  </TD>
                  <TD className="capitalize text-gray-300 font-medium">
                    {h.action}
                  </TD>
                  <TD className="text-gray-400 text-sm">
                    {h.description || `ID: ${h.entityId}`}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}
