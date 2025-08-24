import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: string;
  type?: "equipment" | "employee" | "role";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusIndicator({ 
  status, 
  type = "equipment", 
  size = "sm", 
  className 
}: StatusIndicatorProps) {
  const normalizedStatus = status?.toLowerCase() || "";
  
  const getStatusConfig = () => {
    if (type === "equipment") {
      switch (normalizedStatus) {
        case "available":
          return { bg: "bg-emerald-500", text: "text-white", label: "Available" };
        case "in-use":
        case "active":
          return { bg: "bg-blue-500", text: "text-white", label: "In Use" };
        case "maintenance":
          return { bg: "bg-orange-500", text: "text-white", label: "Maintenance" };
        case "broken":
          return { bg: "bg-red-500", text: "text-white", label: "Broken" };
        default:
          return { bg: "bg-gray-500", text: "text-white", label: normalizedStatus };
      }
    } else if (type === "employee") {
      switch (normalizedStatus) {
        case "available":
          return { bg: "bg-emerald-500", text: "text-white", label: "Available" };
        case "busy":
          return { bg: "bg-yellow-500", text: "text-white", label: "Busy" };
        case "offline":
          return { bg: "bg-gray-500", text: "text-white", label: "Offline" };
        default:
          return { bg: "bg-gray-500", text: "text-white", label: normalizedStatus };
      }
    } else if (type === "role") {
      // Role-based color coding
      switch (normalizedStatus) {
        case "supervisor":
          return { bg: "bg-purple-600", text: "text-white", label: "Supervisor" };
        case "manager":
          return { bg: "bg-indigo-600", text: "text-white", label: "Manager" };
        case "operator":
          return { bg: "bg-blue-600", text: "text-white", label: "Operator" };
        case "technician":
          return { bg: "bg-teal-600", text: "text-white", label: "Technician" };
        case "foreman":
          return { bg: "bg-amber-600", text: "text-white", label: "Foreman" };
        case "safety officer":
          return { bg: "bg-orange-600", text: "text-white", label: "Safety Officer" };
        case "engineer":
          return { bg: "bg-cyan-600", text: "text-white", label: "Engineer" };
        case "mechanic":
          return { bg: "bg-green-600", text: "text-white", label: "Mechanic" };
        case "driver":
          return { bg: "bg-slate-600", text: "text-white", label: "Driver" };
        case "laborer":
          return { bg: "bg-stone-600", text: "text-white", label: "Laborer" };
        default:
          return { bg: "bg-gray-600", text: "text-white", label: status || "Employee" };
      }
    }
    
    return { bg: "bg-gray-500", text: "text-white", label: status || "Unknown" };
  };

  const { bg, text, label } = getStatusConfig();
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        bg,
        text,
        sizeClasses[size],
        className
      )}
      data-testid={`status-${type}-${normalizedStatus}`}
    >
      {label}
    </span>
  );
}

// Utility function to get status dot (for compact display)
export function StatusDot({ 
  status, 
  type = "equipment", 
  className 
}: { 
  status: string; 
  type?: "equipment" | "employee" | "role";
  className?: string;
}) {
  const normalizedStatus = status?.toLowerCase() || "";
  
  const getStatusColor = () => {
    if (type === "equipment") {
      switch (normalizedStatus) {
        case "available": return "bg-emerald-500";
        case "in-use":
        case "active": return "bg-blue-500";
        case "maintenance": return "bg-orange-500";
        case "broken": return "bg-red-500";
        default: return "bg-gray-500";
      }
    } else if (type === "employee") {
      switch (normalizedStatus) {
        case "available": return "bg-emerald-500";
        case "busy": return "bg-yellow-500";
        case "offline": return "bg-gray-500";
        default: return "bg-gray-500";
      }
    } else if (type === "role") {
      switch (normalizedStatus) {
        case "supervisor": return "bg-purple-600";
        case "manager": return "bg-indigo-600";
        case "operator": return "bg-blue-600";
        case "technician": return "bg-teal-600";
        case "foreman": return "bg-amber-600";
        case "safety officer": return "bg-orange-600";
        case "engineer": return "bg-cyan-600";
        case "mechanic": return "bg-green-600";
        case "driver": return "bg-slate-600";
        case "laborer": return "bg-stone-600";
        default: return "bg-gray-600";
      }
    }
    
    return "bg-gray-500";
  };

  return (
    <div
      className={cn(
        "w-2 h-2 rounded-full flex-shrink-0",
        getStatusColor(),
        className
      )}
      title={status}
      data-testid={`status-dot-${type}-${normalizedStatus}`}
    />
  );
}