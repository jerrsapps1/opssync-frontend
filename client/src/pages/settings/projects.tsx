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
  action: "assigned" | "removed";
  entityType: "employee" | "equipment";
  entityName: string;
  entityId: string;
  projectName: string;
  performedBy: string;
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

  // Mock activity data - in real implementation, this would come from backend
  const mockActivityLogs: ProjectActivityLog[] = [
    {
      id: "log1",
      date: "2024-08-13",
      time: "09:15",
      action: "assigned",
      entityType: "employee",
      entityName: "John Martinez",
      entityId: "emp-001",
      projectName: "Highway Bridge Construction",
      performedBy: "Admin User"
    },
    {
      id: "log2", 
      date: "2024-08-13",
      time: "09:30",
      action: "assigned",
      entityType: "equipment",
      entityName: "Caterpillar 320D Excavator",
      entityId: "eq-001",
      projectName: "Highway Bridge Construction",
      performedBy: "Admin User"
    },
    {
      id: "log3",
      date: "2024-08-13",
      time: "14:45",
      action: "removed",
      entityType: "employee",
      entityName: "Sarah Johnson",
      entityId: "emp-003",
      projectName: "Highway Bridge Construction",
      performedBy: "Project Manager"
    },
    {
      id: "log4",
      date: "2024-08-12",
      time: "08:00",
      action: "assigned",
      entityType: "employee",
      entityName: "Mike Wilson",
      entityId: "emp-005",
      projectName: "Highway Bridge Construction",
      performedBy: "Admin User"
    },
    {
      id: "log5",
      date: "2024-08-12",
      time: "11:20",
      action: "assigned",
      entityType: "equipment",
      entityName: "Volvo A40G Dump Truck",
      entityId: "eq-003",
      projectName: "Highway Bridge Construction",
      performedBy: "Equipment Manager"
    }
  ];

  // Filter logs by selected project and date range
  const filteredLogs = mockActivityLogs.filter(log => {
    if (selectedProject && !projects?.find(p => p.name === log.projectName && p.id === selectedProject)) {
      return false;
    }
    if (startDate && log.date < startDate) return false;
    if (endDate && log.date > endDate) return false;
    return true;
  });

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
      "Date,Time,Action,Type,Name,Project,Performed By",
      ...exportData.flatMap(([date, logs]) => 
        logs.map(log => 
          `${log.date},${log.time},${log.action},${log.entityType},${log.entityName},${log.projectName},${log.performedBy}`
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
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      {logs.length} events
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {logs
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((log) => (
                        <div key={log.id} className="flex items-center justify-between bg-gray-800 p-3 rounded">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm font-mono">{log.time}</span>
                            <span className={`text-sm px-2 py-1 rounded ${
                              log.action === 'assigned' 
                                ? 'bg-green-900 text-green-300' 
                                : 'bg-red-900 text-red-300'
                            }`}>
                              {log.action}
                            </span>
                            <span className={`text-sm px-2 py-1 rounded ${
                              log.entityType === 'employee'
                                ? 'bg-blue-900 text-blue-300'
                                : 'bg-orange-900 text-orange-300'
                            }`}>
                              {log.entityType}
                            </span>
                            <span className="text-white">{log.entityName}</span>
                          </div>
                          <span className="text-gray-400 text-sm">by {log.performedBy}</span>
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