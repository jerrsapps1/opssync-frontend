import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, TrendingUp, Users, Wrench, Building } from "lucide-react";

export default function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/overview", timeRange],
    queryFn: () => 
      fetch(`/api/analytics/overview?days=${timeRange}`)
        .then(res => res.json())
  });

  const { data: trends } = useQuery({
    queryKey: ["/api/analytics/trends", timeRange],
    queryFn: () => 
      fetch(`/api/analytics/trends?days=${timeRange}`)
        .then(res => res.json())
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const utilizationRate = analytics?.utilization ? 
    Math.round((analytics.utilization.assigned_employees / analytics.utilization.total_employees) * 100) : 0;

  const equipmentUtilization = analytics?.equipment ? 
    Math.round((analytics.equipment.assigned_equipment / analytics.equipment.total_equipment) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Detailed insights into your operations</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export-analytics">
            <BarChart className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-projects">
              {analytics?.projects?.total_projects || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.projects?.completed_projects || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-employee-utilization">
              {utilizationRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.utilization?.assigned_employees || 0} of {analytics?.utilization?.total_employees || 0} assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Usage</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-equipment-usage">
              {equipmentUtilization}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.equipment?.assigned_equipment || 0} of {analytics?.equipment?.total_equipment || 0} in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-projects">
              {analytics?.projects?.active_projects || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Creation Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Project Creation Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {trends?.trends?.length > 0 ? (
            <div className="space-y-2">
              {trends.trends.slice(0, 10).map((trend: any) => (
                <div key={trend.date} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(trend.date).toLocaleDateString()}
                  </span>
                  <span className="font-medium" data-testid={`text-projects-${trend.date}`}>
                    {trend.projects_created} projects
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No project data available for the selected period
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}