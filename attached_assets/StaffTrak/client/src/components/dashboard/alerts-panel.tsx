import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, AlertCircle, Info, Ban } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { Alert } from "@shared/schema";

interface AlertsPanelProps {
  alerts: Alert[];
  isLoading?: boolean;
}

export function AlertsPanel({ alerts, isLoading }: AlertsPanelProps) {
  const queryClient = useQueryClient();

  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return await apiRequest("PATCH", `/api/alerts/${alertId}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertTriangle className="mr-2 text-orange-500" size={20} />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-64 overflow-y-auto">
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-gray-700 rounded-lg">
                <div className="h-4 bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-600 rounded mb-1"></div>
                <div className="h-3 bg-gray-600 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return AlertTriangle;
      case "error":
        return Ban;
      case "info":
        return Info;
      case "success":
        return AlertCircle;
      default:
        return AlertTriangle;
    }
  };

  const getAlertColors = (type: string) => {
    switch (type) {
      case "warning":
        return {
          border: "border-orange-500 border-opacity-30",
          bg: "bg-orange-500 bg-opacity-10",
          icon: "text-orange-500",
          iconBg: "bg-orange-500 bg-opacity-20",
        };
      case "error":
        return {
          border: "border-red-500 border-opacity-30",
          bg: "bg-red-500 bg-opacity-10",
          icon: "text-red-500",
          iconBg: "bg-red-500 bg-opacity-20",
        };
      case "info":
        return {
          border: "border-blue-500 border-opacity-30",
          bg: "bg-blue-500 bg-opacity-10",
          icon: "text-blue-500", 
          iconBg: "bg-blue-500 bg-opacity-20",
        };
      case "success":
        return {
          border: "border-green-500 border-opacity-30",
          bg: "bg-green-500 bg-opacity-10",
          icon: "text-green-500",
          iconBg: "bg-green-500 bg-opacity-20",
        };
      default:
        return {
          border: "border-gray-500 border-opacity-30",
          bg: "bg-gray-500 bg-opacity-10",
          icon: "text-gray-500",
          iconBg: "bg-gray-500 bg-opacity-20",
        };
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <AlertTriangle className="mr-2 text-orange-500" size={20} />
          Alerts & Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-64 overflow-y-auto">
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <AlertTriangle size={48} className="mx-auto mb-2 opacity-50" />
              <p>No active alerts</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const IconComponent = getAlertIcon(alert.type);
              const colors = getAlertColors(alert.type);
              
              return (
                <div 
                  key={alert.id} 
                  className={`flex items-start space-x-3 p-3 ${colors.bg} border ${colors.border} rounded-lg`}
                  data-testid={`alert-${alert.id}`}
                >
                  <div className={`w-6 h-6 ${colors.iconBg} rounded-full flex items-center justify-center mt-1`}>
                    <IconComponent className={`${colors.icon}`} size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{alert.title}</p>
                    <p className="text-sm text-gray-300">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {alert.priority === "critical" && "Requires resolution"}
                      {alert.priority === "high" && alert.createdAt && formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      {alert.priority === "medium" && alert.createdAt && formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      {alert.priority === "low" && alert.createdAt && formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    onClick={() => dismissAlertMutation.mutate(alert.id)}
                    disabled={dismissAlertMutation.isPending}
                    data-testid={`dismiss-alert-${alert.id}`}
                  >
                    <X size={14} />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
