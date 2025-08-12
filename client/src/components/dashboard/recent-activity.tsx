import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, User, Package, Clock } from "lucide-react";
import type { Activity as ActivityType } from "@shared/schema";

interface RecentActivityProps {
  activities: ActivityType[];
  isLoading: boolean;
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Activity size={20} />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'employee_assigned':
      case 'employee_unassigned':
        return <User size={16} className="text-blue-400" />;
      case 'equipment_assigned':
      case 'equipment_unassigned':
        return <Package size={16} className="text-green-400" />;
      default:
        return <Activity size={16} className="text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'employee_assigned':
      case 'equipment_assigned':
        return 'bg-green-600';
      case 'employee_unassigned':
      case 'equipment_unassigned':
        return 'bg-orange-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Activity size={20} />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Activity size={24} className="mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3" data-testid={`activity-${activity.id}`}>
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>{activity.createdAt ? new Date(activity.createdAt).toLocaleString() : 'No date'}</span>
                    <span className="capitalize">{activity.type.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}