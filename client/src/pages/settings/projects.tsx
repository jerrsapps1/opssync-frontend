import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProjectActivityLog {
  id: string;
  date: string;
  time: string;
  action: "assigned" | "removed" | "moved";
  entityType: "employee" | "equipment";
  entityName: string;
  entityId: string;
  projectName: string;
  fromProjectName?: string;
  performedBy: string;
  performedByEmail?: string;
}

export default function ProjectSettings() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch projects data
  const { data: projects } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  // Get real activity logs from API
  const { data: activityLogs = [], isLoading: logsLoading } = useQuery<ProjectActivityLog[]>({
    queryKey: ["/api", "project-activity-logs", selectedProject, startDate, endDate],
    enabled: !!selectedProject,
  });

  // Logs are already filtered by project and date range on the server
  const filteredLogs = activityLogs;

  // Group logs by date
  const logsByDate = filteredLogs.reduce((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {} as Record<string, ProjectActivityLog[]>);

  const toggleDateSelection = (date: string) => {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const handleExport = () => {
    const exportData = selectedDates.length > 0 
      ? Object.entries(logsByDate).filter(([date]) => selectedDates.includes(date))
      : Object.entries(logsByDate);

    const csvContent = [
      "Date,Time,Action,Type,Name,Entity ID,Project,From Project,Performed By,Email",
      ...exportData.flatMap(([date, logs]) => 
        logs.map(log => 
          `${log.date},${log.time},${log.action},${log.entityType},${log.entityName},${log.entityId},${log.projectName},${log.fromProjectName || 'N/A'},${log.performedBy},${log.performedByEmail || 'N/A'}`
        )
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const selectedProjectData = projects?.find(p => p.id === selectedProject);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Project Activity Tracking</h2>
        <p className="text-gray-400 text-sm">
          Track daily employee and equipment movements for each project with exportable logs
        </p>
      </div>

      {/* Project Selection & Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            📋 Project Selection
          </CardTitle>
          <CardDescription className="text-gray-400">
            Select a project to view its activity logs and daily records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Select Project:</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProjectData && (
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">{selectedProjectData.name}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Status: </span>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {selectedProjectData.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-400">Start Date: </span>
                  <span className="text-gray-300">{selectedProjectData.startDate}</span>
                </div>
                <div>
                  <span className="text-gray-400">End Date: </span>
                  <span className="text-gray-300">{selectedProjectData.endDate}</span>
                </div>
                <div>
                  <span className="text-gray-400">Location: </span>
                  <span className="text-gray-300">{selectedProjectData.location}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Range Filter */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            📅 Date Range Filter
          </CardTitle>
          <CardDescription className="text-gray-400">
            Filter activity logs by date range for focused analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                📊 Daily Activity Logs
              </CardTitle>
              <CardDescription className="text-gray-400">
                Daily records of employee and equipment movements (midnight to midnight)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setSelectedDates(Object.keys(logsByDate))}
                variant="outline"
                size="sm"
              >
                Select All
              </Button>
              <Button
                onClick={() => setSelectedDates([])}
                variant="outline"
                size="sm"
              >
                Clear All
              </Button>
              <Button
                onClick={handleExport}
                disabled={Object.keys(logsByDate).length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                📤 Export Selected
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Activity Summary Section */}
          {selectedProject && filteredLogs.length > 0 && (
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 rounded-lg border border-gray-700">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                📊 Activity Summary for {projects?.find(p => p.id === selectedProject)?.name}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-blue-400">{filteredLogs.length}</div>
                  <div className="text-gray-400">Total Events</div>
                </div>
                <div className="text-center p-3 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-green-400">
                    {filteredLogs.filter(l => l.action === 'assigned' || l.action === 'moved').length}
                  </div>
                  <div className="text-gray-400">Assignments</div>
                </div>
                <div className="text-center p-3 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-red-400">
                    {filteredLogs.filter(l => l.action === 'removed').length}
                  </div>
                  <div className="text-gray-400">Removals</div>
                </div>
                <div className="text-center p-3 bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-yellow-400">
                    {filteredLogs.filter(l => l.action === 'moved').length}
                  </div>
                  <div className="text-gray-400">Moves</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-gray-400 mb-1">Employee Activities</div>
                  <div className="text-blue-300 font-medium">
                    {filteredLogs.filter(l => l.entityType === 'employee').length} events
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-gray-400 mb-1">Equipment Activities</div>
                  <div className="text-orange-300 font-medium">
                    {filteredLogs.filter(l => l.entityType === 'equipment').length} events
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <div className="text-gray-400 mb-1">Unique Users</div>
                  <div className="text-purple-300 font-medium">
                    {new Set(filteredLogs.map(l => l.performedBy)).size} users
                  </div>
                </div>
              </div>
            </div>
          )}

          {Object.keys(logsByDate).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {selectedProject ? "No activity logs found for the selected date range" : "Select a project to view activity logs"}
            </div>
          ) : (
            Object.entries(logsByDate)
              .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending
              .map(([date, logs]) => (
                <div key={date} className="bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedDates.includes(date)}
                      onChange={() => toggleDateSelection(date)}
                      className="w-4 h-4 rounded"
                    />
                    <h4 className="text-white font-medium">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        {logs.length} events
                      </Badge>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        {logs.filter(l => l.action === 'assigned' || l.action === 'moved').length} assignments
                      </Badge>
                      <Badge variant="outline" className="text-red-400 border-red-400">
                        {logs.filter(l => l.action === 'removed').length} removals
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {logs
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((log) => (
                        <div key={log.id} className="bg-gray-800 p-3 rounded space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-center">
                                <span className="text-gray-400 text-xs">TIME</span>
                                <span className="text-white text-sm font-mono font-bold">{log.time}</span>
                              </div>
                              <div className="h-8 w-px bg-gray-600"></div>
                              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                                log.action === 'assigned' 
                                  ? 'bg-green-900 text-green-300 border border-green-700' 
                                  : log.action === 'removed'
                                  ? 'bg-red-900 text-red-300 border border-red-700'
                                  : 'bg-blue-900 text-blue-300 border border-blue-700'
                              }`}>
                                {log.action.toUpperCase()}
                              </span>
                              <span className={`text-sm px-2 py-1 rounded ${
                                log.entityType === 'employee'
                                  ? 'bg-blue-900 text-blue-300'
                                  : 'bg-orange-900 text-orange-300'
                              }`}>
                                {log.entityType === 'employee' ? '👤 Employee' : '🚛 Equipment'}
                              </span>
                              <span className="text-white font-semibold">{log.entityName}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-300 text-sm font-medium">
                                {log.performedBy}
                              </div>
                              {log.performedByEmail && (
                                <div className="text-gray-500 text-xs">
                                  {log.performedByEmail}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Enhanced project tracking information */}
                          <div className="text-sm space-y-1">
                            <div className="text-gray-300">
                              {log.action === 'moved' && log.fromProjectName ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-yellow-400">🔄</span>
                                  <span>
                                    Moved from <span className="text-red-400 font-medium">{log.fromProjectName}</span> 
                                    <span className="text-gray-400 mx-2">→</span>
                                    <span className="text-green-400 font-medium">{log.projectName}</span>
                                  </span>
                                </div>
                              ) : log.action === 'assigned' ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-green-400">✓</span>
                                  <span>
                                    Assigned to <span className="text-green-400 font-medium">{log.projectName}</span>
                                    {log.fromProjectName && <span className="text-gray-500"> (previously on {log.fromProjectName})</span>}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">✗</span>
                                  <span>
                                    Removed from <span className="text-red-400 font-medium">{log.projectName}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Additional details line */}
                            <div className="flex justify-between items-center text-xs text-gray-400">
                              <span>
                                {log.entityType === 'employee' ? '👤' : '🚛'} {log.entityType} • ID: {log.entityId}
                              </span>
                              {log.performedByEmail && (
                                <span className="italic">
                                  Contact: {log.performedByEmail}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}