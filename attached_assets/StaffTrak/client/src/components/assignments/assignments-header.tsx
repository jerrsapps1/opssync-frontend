import { brandConfig } from "@/lib/brand-config";
import { HardHat } from "lucide-react";

export function AssignmentsHeader() {
  return (
    <header className="bg-blue-700 flex items-center p-4 shadow-md mb-0">
      <div className="w-10 h-10 mr-4">
        <HardHat className="text-white w-full h-full" />
      </div>
      <h1 className="text-lg font-semibold text-white select-none">
        {brandConfig.appName} - Assignments
      </h1>
    </header>
  );
}