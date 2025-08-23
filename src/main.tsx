import React from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a working OpsSync.ai repair shop management app
function OpsyncApp() {
  const [currentPage, setCurrentPage] = React.useState(window.location.pathname || '/');
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <Router>
          <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#121212', 
            color: '#E0E0E0',
            fontFamily: 'Inter, sans-serif'
          }}>
            {/* Navigation Header */}
            <div style={{
              backgroundColor: '#1E1E2F',
              padding: '1rem 2rem',
              borderBottom: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h1 style={{ margin: 0, color: '#4A90E2', fontSize: '1.5rem' }}>OpsSync.ai</h1>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#BB86FC' }}>Repair Shop Management System</p>
              </div>
              <nav style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setCurrentPage('/')}
                  style={{
                    background: currentPage === '/' ? '#4A90E2' : 'transparent',
                    color: '#E0E0E0',
                    border: '1px solid #4A90E2',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setCurrentPage('/repair-shop')}
                  style={{
                    background: currentPage === '/repair-shop' ? '#4A90E2' : 'transparent',
                    color: '#E0E0E0',
                    border: '1px solid #4A90E2',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Repair Shop
                </button>
                <button 
                  onClick={() => setCurrentPage('/equipment')}
                  style={{
                    background: currentPage === '/equipment' ? '#4A90E2' : 'transparent',
                    color: '#E0E0E0',
                    border: '1px solid #4A90E2',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Equipment
                </button>
                <button 
                  onClick={() => setCurrentPage('/projects')}
                  style={{
                    background: currentPage === '/projects' ? '#4A90E2' : 'transparent',
                    color: '#E0E0E0',
                    border: '1px solid #4A90E2',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Projects
                </button>
                <button 
                  onClick={() => setCurrentPage('/employees')}
                  style={{
                    background: currentPage === '/employees' ? '#4A90E2' : 'transparent',
                    color: '#E0E0E0',
                    border: '1px solid #4A90E2',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Employees
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div style={{ padding: '2rem' }}>
              {currentPage === '/' && <DashboardPage />}
              {currentPage === '/repair-shop' && <RepairShopPage />}
              {currentPage === '/equipment' && <EquipmentPage />}
              {currentPage === '/projects' && <ProjectsPage />}
              {currentPage === '/employees' && <EmployeesPage />}
            </div>
          </div>
        </Router>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

// Dashboard Page Component
function DashboardPage() {
  const [projects, setProjects] = React.useState([]);
  const [equipment, setEquipment] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);

  React.useEffect(() => {
    // Load data from your backend
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/equipment').then(r => r.json()),
      fetch('/api/employees').then(r => r.json())
    ]).then(([projectData, equipmentData, employeeData]) => {
      setProjects(projectData || []);
      setEquipment(equipmentData || []);
      setEmployees(employeeData || []);
    }).catch(console.error);
  }, []);

  return (
    <div>
      <h2 style={{ color: '#4A90E2', marginBottom: '2rem', fontSize: '2rem' }}>Dashboard Overview</h2>
      
      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <div style={{
          backgroundColor: '#1E1E2F',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#BB86FC', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Active Projects</h3>
          <p style={{ fontSize: '3rem', margin: '0.5rem 0', color: '#4A90E2', fontWeight: 'bold' }}>
            {projects.filter(p => p.status === 'Active').length}
          </p>
          <p style={{ color: '#888', margin: 0 }}>Projects currently in progress</p>
        </div>
        
        <div style={{
          backgroundColor: '#1E1E2F',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#BB86FC', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Available Equipment</h3>
          <p style={{ fontSize: '3rem', margin: '0.5rem 0', color: '#4CAF50', fontWeight: 'bold' }}>
            {equipment.filter(e => !e.currentProjectId).length}
          </p>
          <p style={{ color: '#888', margin: 0 }}>Ready for assignment</p>
        </div>
        
        <div style={{
          backgroundColor: '#1E1E2F',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#BB86FC', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Equipment in Repair</h3>
          <p style={{ fontSize: '3rem', margin: '0.5rem 0', color: '#CF6679', fontWeight: 'bold' }}>
            {equipment.filter(e => e.status === 'maintenance' || e.currentProjectId === 'repair-shop').length}
          </p>
          <p style={{ color: '#888', margin: 0 }}>Needing maintenance or repair</p>
        </div>
        
        <div style={{
          backgroundColor: '#1E1E2F',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <h3 style={{ color: '#BB86FC', margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Total Employees</h3>
          <p style={{ fontSize: '3rem', margin: '0.5rem 0', color: '#4A90E2', fontWeight: 'bold' }}>
            {employees.length}
          </p>
          <p style={{ color: '#888', margin: 0 }}>Workforce strength</p>
        </div>
      </div>

      {/* Recent Projects */}
      <div style={{
        backgroundColor: '#1E1E2F',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#BB86FC', marginBottom: '1rem' }}>Recent Projects</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {projects.slice(0, 5).map((project, index) => (
            <div key={project.id || index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: '#0d1117',
              borderRadius: '6px',
              border: '1px solid #444'
            }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#E0E0E0' }}>{project.name}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>{project.location}</p>
              </div>
              <span style={{ 
                color: project.status === 'Active' ? '#4CAF50' : '#BB86FC',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                {project.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Repair Shop Page Component  
function RepairShopPage() {
  const [repairEquipment, setRepairEquipment] = React.useState([]);
  const [workOrders, setWorkOrders] = React.useState([]);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/equipment').then(r => r.json()),
      fetch('/api/work-orders').then(r => r.json())
    ]).then(([equipmentData, workOrderData]) => {
      const repair = (equipmentData || []).filter(eq => 
        eq.currentProjectId === "repair-shop" || 
        (!eq.currentProjectId && eq.status === "maintenance")
      );
      setRepairEquipment(repair);
      setWorkOrders(workOrderData || []);
    }).catch(console.error);
  }, []);

  return (
    <div>
      <h2 style={{ color: '#4A90E2', marginBottom: '1rem', fontSize: '2rem' }}>🔧 Repair Shop</h2>
      <p style={{ color: '#888', marginBottom: '2rem' }}>Equipment Under Repair & Maintenance</p>
      
      <div style={{
        backgroundColor: '#1E1E2F',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#BB86FC', marginBottom: '1rem' }}>
          Assets Needing Repairs or PM ({repairEquipment.length})
        </h3>
        
        {repairEquipment.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔧</div>
            <h3 style={{ color: '#E0E0E0', marginBottom: '0.5rem' }}>No Equipment in Repair</h3>
            <p style={{ color: '#888' }}>Equipment will appear here when sent to repair shop</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '1rem'
          }}>
            {repairEquipment.map((equipment) => {
              const equipmentWorkOrders = workOrders.filter(wo => wo.equipmentId === equipment.id);
              
              return (
                <div
                  key={equipment.id}
                  style={{
                    backgroundColor: '#0d1117',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #444'
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ color: '#E0E0E0', margin: '0 0 0.5rem 0' }}>
                      {equipment.name}
                    </h4>
                    <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                      {equipment.type}
                    </p>
                  </div>
                  
                  {equipmentWorkOrders.length > 0 ? (
                    <div style={{ marginTop: '1rem' }}>
                      <h5 style={{ color: '#BB86FC', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                        Active Work Orders:
                      </h5>
                      {equipmentWorkOrders.map((workOrder) => (
                        <div key={workOrder.id} style={{
                          backgroundColor: '#1a1a2e',
                          padding: '0.75rem',
                          borderRadius: '4px',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#E0E0E0', fontSize: '0.85rem', fontWeight: '500' }}>
                              {workOrder.title}
                            </span>
                            <span style={{
                              color: workOrder.priority === 'urgent' ? '#CF6679' : 
                                     workOrder.priority === 'high' ? '#FF9800' : '#4A90E2',
                              fontSize: '0.75rem',
                              textTransform: 'uppercase'
                            }}>
                              {workOrder.priority}
                            </span>
                          </div>
                          <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 0.25rem 0' }}>
                            {workOrder.description}
                          </p>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            <span>Status: {workOrder.status}</span>
                            {workOrder.assignedTo && (
                              <span style={{ marginLeft: '1rem' }}>Assigned: {workOrder.assignedTo}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      backgroundColor: '#1a1a2e', 
                      padding: '1rem', 
                      borderRadius: '4px',
                      textAlign: 'center',
                      color: '#888',
                      fontSize: '0.85rem'
                    }}>
                      No work orders yet - needs assessment
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Equipment Page Component
function EquipmentPage() {
  const [equipment, setEquipment] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/equipment')
      .then(r => r.json())
      .then(data => setEquipment(data || []))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2 style={{ color: '#4A90E2', marginBottom: '2rem' }}>Equipment Management</h2>
      
      <div style={{
        backgroundColor: '#1E1E2F',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#BB86FC', marginBottom: '1rem' }}>Equipment Inventory ({equipment.length})</h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {equipment.map((item, index) => (
            <div key={item.id || index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: '#0d1117',
              borderRadius: '6px',
              border: '1px solid #444'
            }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#E0E0E0' }}>{item.name}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>{item.type}</p>
                {item.currentProjectId && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#4A90E2' }}>
                    Project: {item.currentProjectId}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  color: !item.currentProjectId ? '#4CAF50' : 
                         item.status === 'maintenance' ? '#CF6679' : '#BB86FC',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  {!item.currentProjectId ? 'Available' : 
                   item.status === 'maintenance' ? 'In Repair' : 'In Use'}
                </span>
                {item.status && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                    Status: {item.status}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Projects Page Component  
function ProjectsPage() {
  const [projects, setProjects] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data || []))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2 style={{ color: '#4A90E2', marginBottom: '2rem' }}>Project Management</h2>
      
      <div style={{
        backgroundColor: '#1E1E2F',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#BB86FC', marginBottom: '1rem' }}>Active Projects ({projects.length})</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {projects.map((project, index) => (
            <div key={project.id || index} style={{
              backgroundColor: '#0d1117',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #444'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#E0E0E0', fontSize: '1.1rem' }}>
                  {project.name}
                </h4>
                <p style={{ margin: '0 0 0.5rem 0', color: '#888' }}>{project.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#4A90E2', fontSize: '0.9rem' }}>📍 {project.location}</span>
                  <span style={{ 
                    color: project.status === 'Active' ? '#4CAF50' : '#BB86FC',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    {project.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Employees Page Component
function EmployeesPage() {
  const [employees, setEmployees] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(data => setEmployees(data || []))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2 style={{ color: '#4A90E2', marginBottom: '2rem' }}>Employee Management</h2>
      
      <div style={{
        backgroundColor: '#1E1E2F',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ color: '#BB86FC', marginBottom: '1rem' }}>Workforce ({employees.length})</h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {employees.map((employee, index) => (
            <div key={employee.id || index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: '#0d1117',
              borderRadius: '6px',
              border: '1px solid #444'
            }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#E0E0E0' }}>{employee.name}</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>{employee.position}</p>
                {employee.currentProjectId && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#4A90E2' }}>
                    Project: {employee.currentProjectId}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  color: !employee.currentProjectId ? '#4CAF50' : '#BB86FC',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  {!employee.currentProjectId ? 'Available' : 'Assigned'}
                </span>
                {employee.skills && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                    Skills: {employee.skills.slice(0, 2).join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const el = document.getElementById("root");
if (!el) throw new Error("#root not found");
createRoot(el).render(<OpsyncApp />);