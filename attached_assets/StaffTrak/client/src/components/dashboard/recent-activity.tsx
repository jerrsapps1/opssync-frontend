import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, UserPlus, Wrench, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Activity } from "@shared/schema";

interface RecentActivityProps {
  activities: Activity[];
  isLoading?: boolean;
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Clock className="mr-2 text-blue-500" size={20} />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-64 overflow-y-auto">
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded mb-1"></div>
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
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
      case "assignment":
      case "unassignment":
        return UserPlus;
      case "maintenance":
        return Wrench;
      case "project_approved":
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "assignment":
        return { icon: "text-blue-500", bg: "bg-blue-500 bg-opacity-20" };
      case "unassignment":
        return { icon: "text-red-500", bg: "bg-red-500 bg-opacity-20" };
      case "maintenance":
        return { icon: "text-orange-500", bg: "bg-orange-500 bg-opacity-20" };
      case "project_approved":
        return { icon: "text-green-500", bg: "bg-green-500 bg-opacity-20" };
      default:
        return { icon: "text-gray-500", bg: "bg-gray-500 bg-opacity-20" };
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Clock className="mr-2 text-blue-500" size={20} />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-64 overflow-y-auto">
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Clock size={48} className="mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => {
              const IconComponent = getActivityIcon(activity.type);
              const colors = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="flex items-start space-x-3" data-testid={`activity-${activity.id}`}>
                  <div className={`w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center mt-1`}>
                    <IconComponent className={`${colors.icon}`} size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{activity.description}</p>
                    <p className="text-xs text-gray-400">
                      {activity.createdAt && formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
