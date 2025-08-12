import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, X, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Alert } from "@shared/schema";

interface AlertsPanelProps {
  alerts: Alert[];
  isLoading: boolean;
}

export function AlertsPanel({ alerts, isLoading }: AlertsPanelProps) {
  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <AlertTriangle size={20} />
            <span>Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3">
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

  const getAlertIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle size={16} className="text-red-400" />;
      case 'medium':
        return <Clock size={16} className="text-yellow-400" />;
      case 'low':
        return <CheckCircle size={16} className="text-green-400" />;
      default:
        return <AlertTriangle size={16} className="text-gray-400" />;
    }
  };

  const getAlertBorderColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const handleDismissAlert = (alertId: string) => {
    console.log("Dismissing alert:", alertId);
    // TODO: Implement alert dismissal API call
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={20} />
            <span>Alerts</span>
            {alerts.length > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {alerts.length}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle size={24} className="mx-auto mb-2 text-green-400" />
              <p>No active alerts</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 border-l-4 bg-gray-700 rounded-r ${getAlertBorderColor(alert.priority)}`}
                data-testid={`alert-${alert.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getAlertIcon(alert.priority)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{alert.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{alert.message}</p>
                      <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                        <Clock size={10} />
                        <span>{alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'No date'}</span>
                        <span className="capitalize">{alert.priority} priority</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissAlert(alert.id)}
                    className="text-gray-400 hover:text-white p-1 h-auto"
                    data-testid={`dismiss-alert-${alert.id}`}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}