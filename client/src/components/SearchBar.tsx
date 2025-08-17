import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Wrench, X } from "lucide-react";
import type { Employee, Equipment, Project } from "@shared/schema";

interface SearchResult {
  id: string;
  name: string;
  type: 'employee' | 'equipment';
  currentProject?: string;
  projectName?: string;
  status?: string;
  role?: string;
  assetNumber?: string;
}

interface SearchBarProps {
  onClose?: () => void;
}

export function SearchBar({ onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: employees = [] } = useQuery({
    queryKey: ["/api", "employees"]
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ["/api", "equipment"]
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api", "projects"]
  });

  // Create project lookup map
  const projectMap = (projects as Project[]).reduce((map, project) => {
    map[project.id] = project.name;
    return map;
  }, {} as Record<string, string>);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    // Use a timeout to debounce the search and prevent infinite loops
    const timeoutId = setTimeout(() => {
      const searchQuery = query.toLowerCase();
      const searchResults: SearchResult[] = [];

      // Search employees
      (employees as Employee[]).forEach((emp: Employee) => {
        if (emp.name.toLowerCase().includes(searchQuery)) {
          const projectName = emp.currentProjectId === "repair-shop" 
            ? "Repair Shop" 
            : emp.currentProjectId 
              ? projectMap[emp.currentProjectId] || "Unknown Project"
              : "Unassigned";

          searchResults.push({
            id: emp.id,
            name: emp.name,
            type: 'employee',
            currentProject: emp.currentProjectId ?? undefined,
            projectName,
            role: emp.role,
            status: emp.status
          });
        }
      });

      // Search equipment
      (equipment as Equipment[]).forEach((eq: Equipment) => {
        if (eq.name.toLowerCase().includes(searchQuery)) {
          const projectName = eq.currentProjectId === "repair-shop" 
            ? "Repair Shop" 
            : eq.currentProjectId 
              ? projectMap[eq.currentProjectId] || "Unknown Project"
              : "Unassigned";

          searchResults.push({
            id: eq.id,
            name: eq.name,
            type: 'equipment',
            currentProject: eq.currentProjectId ?? undefined,
            projectName,
            status: eq.status,
            assetNumber: eq.assetNumber ?? undefined
          });
        }
      });

      setResults(searchResults.slice(0, 10)); // Limit to 10 results
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, employees, equipment, projectMap]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    onClose?.();
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'maintenance': return 'text-orange-400';
      case 'available': return 'text-green-400';
      case 'assigned': return 'text-blue-400';
      case 'active': return 'text-green-400';
      case 'inactive': return 'text-gray-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-lg px-3 py-2 min-w-[300px]">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search equipment & employees..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
          data-testid="search-input"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-gray-400 hover:text-white"
            data-testid="button-clear-search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results popup */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md border border-gray-600/50 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          {results.length === 0 && query.length >= 2 ? (
            <div className="p-4 text-center text-gray-400">
              No equipment or employees found for "{query}"
            </div>
          ) : (
            <div className="p-2">
              {results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors"
                  data-testid={`search-result-${result.type}-${result.id}`}
                >
                  <div className="flex-shrink-0">
                    {result.type === 'employee' ? (
                      <Users className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Wrench className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">
                        {result.name}
                      </span>
                      {result.assetNumber && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded">
                          #{result.assetNumber}
                        </span>
                      )}
                      {result.role && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-900/30 text-blue-300 rounded">
                          {result.role}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-300">
                        Project: <span className="text-white">{result.projectName}</span>
                      </span>
                      {result.status && (
                        <span className={`text-xs ${getStatusColor(result.status)}`}>
                          • {result.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}