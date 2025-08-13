import React from 'react';

// Project Template Component
// This serves as the standardized layout template that gets populated with wizard data

interface ProjectTemplateProps {
  project: {
    id: string;
    name: string;
    projectNumber?: string;
    location: string;
    description?: string;
    status: string;
    priority?: string;
    riskLevel?: string;
    projectType?: string;
    startDate?: string;
    endDate?: string;
    estimatedBudget?: number;
    contractValue?: number;
    actualCost?: number;
    profitMargin?: number;
    clientName?: string;
    clientContact?: string;
    clientEmail?: string;
    clientPhone?: string;
    generalContractor?: string;
    contractorContact?: string;
    contractorEmail?: string;
    contractorPhone?: string;
    gpsLatitude?: string;
    gpsLongitude?: string;
    kmzFileUrl?: string;
    createdAt?: string;
    updatedAt?: string;
    percentComplete?: number;
    percentMode?: string;
  };
  assignedEmployees?: any[];
  assignedEquipment?: any[];
  onExport?: () => void;
  onBack?: () => void;
}

export const ProjectTemplate: React.FC<ProjectTemplateProps> = ({
  project,
  assignedEmployees = [],
  assignedEquipment = [],
  onExport,
  onBack
}) => {
  // Calculate duration if both dates are available
  const durationDays = project.startDate && project.endDate 
    ? Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate progress percentage
  const pct = project.percentMode === "manual" 
    ? (project.percentComplete || 0) 
    : Math.round((assignedEmployees.length + assignedEquipment.length) * 10);

  return (
    <div className="p-4 space-y-4 bg-gray-900 min-h-screen text-white">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <div className="text-sm text-gray-400 space-y-1">
            <div>{project.location || ""}</div>
            {project.projectNumber && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Project #:</span>
                <span className="text-blue-400 font-mono">{project.projectNumber}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <button 
              onClick={onExport}
              className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm flex items-center gap-1"
            >
              📊 Export Excel
            </button>
          )}
          {onBack && (
            <button 
              onClick={onBack}
              className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Project Details Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {/* Project Information */}
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="text-xs text-gray-400 mb-2">Project Details</div>
          <div className="space-y-2 text-sm">
            {project.projectType && (
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="text-gray-200 ml-2">{project.projectType}</span>
              </div>
            )}
            {project.description && (
              <div>
                <span className="text-gray-500">Description:</span>
                <div className="text-gray-200 text-xs mt-1 max-h-16 overflow-y-auto">
                  {project.description}
                </div>
              </div>
            )}
            <div>
              <span className="text-gray-500">Priority:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                project.priority === 'urgent' ? 'bg-red-900 text-red-300' :
                project.priority === 'high' ? 'bg-orange-900 text-orange-300' :
                project.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                'bg-green-900 text-green-300'
              }`}>
                {project.priority || 'medium'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Risk Level:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                project.riskLevel === 'critical' ? 'bg-red-900 text-red-300' :
                project.riskLevel === 'high' ? 'bg-orange-900 text-orange-300' :
                project.riskLevel === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                'bg-green-900 text-green-300'
              }`}>
                {project.riskLevel || 'medium'}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="text-xs text-gray-400 mb-2">Financial Details</div>
          <div className="space-y-2 text-sm">
            {project.estimatedBudget && (
              <div>
                <span className="text-gray-500">Budget:</span>
                <span className="text-green-400 ml-2 font-mono">
                  ${(project.estimatedBudget / 100).toLocaleString()}
                </span>
              </div>
            )}
            {project.contractValue && (
              <div>
                <span className="text-gray-500">Contract:</span>
                <span className="text-blue-400 ml-2 font-mono">
                  ${(project.contractValue / 100).toLocaleString()}
                </span>
              </div>
            )}
            {project.actualCost && (
              <div>
                <span className="text-gray-500">Actual Cost:</span>
                <span className="text-red-400 ml-2 font-mono">
                  ${(project.actualCost / 100).toLocaleString()}
                </span>
              </div>
            )}
            {project.profitMargin && (
              <div>
                <span className="text-gray-500">Profit Margin:</span>
                <span className="text-purple-400 ml-2">{project.profitMargin}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Location Information */}
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="text-xs text-gray-400 mb-2">Location Details</div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Address:</span>
              <div className="text-gray-200 text-xs mt-1">
                {project.location || 'Not specified'}
              </div>
            </div>
            {(project.gpsLatitude && project.gpsLongitude) && (
              <div>
                <span className="text-gray-500">GPS:</span>
                <div className="text-gray-200 text-xs mt-1 font-mono">
                  {project.gpsLatitude}, {project.gpsLongitude}
                </div>
              </div>
            )}
            {project.kmzFileUrl && (
              <div>
                <span className="text-gray-500">Map File:</span>
                <a 
                  href={project.kmzFileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs ml-2 underline"
                >
                  View KMZ
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Information */}
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="text-xs text-gray-400 mb-2">Timeline</div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Created:</span>
              <div className="text-gray-200 text-xs mt-1">
                {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <div className="text-gray-200 text-xs mt-1">
                {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
            {project.startDate && project.endDate && (
              <div>
                <span className="text-gray-500">Duration:</span>
                <div className="text-blue-400 text-xs mt-1">
                  {durationDays ? `${durationDays} days` : 'Calculating...'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Company/Client Information */}
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="text-xs text-gray-400 mb-2">Company Details</div>
          <div className="space-y-2 text-sm">
            {project.clientName && (
              <div>
                <span className="text-gray-500">Client:</span>
                <div className="text-gray-200 text-xs mt-1 font-medium">
                  {project.clientName}
                </div>
                {project.clientContact && (
                  <div className="text-gray-300 text-xs">
                    Contact: {project.clientContact}
                  </div>
                )}
                {project.clientEmail && (
                  <div className="text-blue-400 text-xs">
                    {project.clientEmail}
                  </div>
                )}
                {project.clientPhone && (
                  <div className="text-green-400 text-xs">
                    {project.clientPhone}
                  </div>
                )}
              </div>
            )}
            {project.generalContractor && (
              <div className="pt-2 border-t border-gray-700">
                <span className="text-gray-500">General Contractor:</span>
                <div className="text-gray-200 text-xs mt-1 font-medium">
                  {project.generalContractor}
                </div>
                {project.contractorContact && (
                  <div className="text-gray-300 text-xs">
                    Contact: {project.contractorContact}
                  </div>
                )}
                {project.contractorEmail && (
                  <div className="text-blue-400 text-xs">
                    {project.contractorEmail}
                  </div>
                )}
                {project.contractorPhone && (
                  <div className="text-green-400 text-xs">
                    {project.contractorPhone}
                  </div>
                )}
              </div>
            )}
            {!project.clientName && !project.generalContractor && (
              <div className="text-xs text-gray-500 italic">
                No company details specified
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Contacts Section - Multiple contacts from wizard */}
      {(project as any).contacts && (project as any).contacts.length > 0 && (
        <div className="rounded border border-gray-800 p-4 bg-[#0b1220] mt-4">
          <div className="text-xs text-gray-400 mb-3">Project Contacts ({(project as any).contacts.length})</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(project as any).contacts.map((contact: any, index: number) => (
              <div key={contact.id || index} className="border border-gray-700 rounded p-3 bg-[#121212]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-white font-medium text-sm">{contact.name}</div>
                  {contact.isPrimary && (
                    <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
                      Primary
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-gray-300">{contact.position}</div>
                  {contact.company && (
                    <div className="text-gray-400">@ {contact.company}</div>
                  )}
                  {contact.email && (
                    <div className="text-blue-400">{contact.email}</div>
                  )}
                  {contact.mobile && (
                    <div className="text-green-400">{contact.mobile}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress and Duration Controls */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="text-xs text-gray-400 mb-2">Duration</div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 w-12">Start</label>
              <span className="text-xs text-gray-300">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 w-12">End</label>
              <span className="text-xs text-gray-300">
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-2 font-medium">
            {durationDays !== null ? `${durationDays} days` : "Duration not available"}
          </div>
        </div>

        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-gray-400">% Complete</div>
            <div className="text-xs text-gray-300">
              {(project.percentMode ?? "auto") === "auto" ? "Auto-calc" : "Manual"}
            </div>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded">
            <div 
              className="h-2 rounded bg-[color:var(--brand-primary)]" 
              style={{ width: pct + "%" }} 
            />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-xs text-gray-300">{pct}%</div>
          </div>
        </div>

        <div className="rounded border border-gray-800 p-3 bg-[#0b1220]">
          <div className="text-xs text-gray-400 mb-2">Status</div>
          <div className="text-sm font-medium text-white">{project.status}</div>
          <div className="text-xs text-gray-500 mt-1">
            {assignedEmployees.length} employees, {assignedEquipment.length} equipment
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTemplate;