import React from "react";
import { Droppable } from "react-beautiful-dnd";

interface FourthColumnProps {
  isLoading?: boolean;
}

export function FourthColumn({ isLoading = false }: FourthColumnProps) {
  if (isLoading) {
    return (
      <div className="w-1/4 bg-[#1E1E2F] border-l border-gray-700 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-600 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-600 rounded"></div>
            <div className="h-16 bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-1/4 bg-[#1E1E2F] border-l border-gray-700 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-orange-300 mb-2 flex items-center gap-2">
          🔧 Repair Shop
        </h3>
        <p className="text-sm text-gray-400">
          Drop equipment here for maintenance
        </p>
      </div>

      <Droppable droppableId="fourth-column">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-96 rounded-lg border-2 border-dashed transition-colors ${
              snapshot.isDraggingOver
                ? "border-orange-400 bg-orange-900/30"
                : "border-orange-600/50 bg-orange-900/10"
            }`}
          >
            <div className="p-4 text-center text-orange-300">
              <div className="text-3xl mb-2">🔧</div>
              <div className="text-sm">
                {snapshot.isDraggingOver ? "Drop equipment here!" : "Drop equipment for repair"}
              </div>
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}