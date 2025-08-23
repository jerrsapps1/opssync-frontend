import React from "react";
import { createRoot } from "react-dom/client";

// Create a simplified working version of the repair shop app
function OpsyncApp() {
  const [currentView, setCurrentView] = React.useState('dashboard');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#121212', 
      color: '#E0E0E0',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
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
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setCurrentView('dashboard')}
            style={{
              background: currentView === 'dashboard' ? '#4A90E2' : 'transparent',
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
            onClick={() => setCurrentView('repair-shop')}
            style={{
              background: currentView === 'repair-shop' ? '#4A90E2' : 'transparent',
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
            onClick={() => setCurrentView('equipment')}
            style={{
              background: currentView === 'equipment' ? '#4A90E2' : 'transparent',
              color: '#E0E0E0',
              border: '1px solid #4A90E2',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Equipment
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '2rem' }}>
        {currentView === 'dashboard' && (
          <div>
            <h2 style={{ color: '#4A90E2', marginBottom: '1rem' }}>Dashboard</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{
                backgroundColor: '#1E1E2F',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #333'
              }}>
                <h3 style={{ color: '#BB86FC' }}>Active Projects</h3>
                <p style={{ fontSize: '2rem', margin: '0.5rem 0' }}>8</p>
                <p style={{ color: '#888' }}>Projects in progress</p>
              </div>
              <div style={{
                backgroundColor: '#1E1E2F',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #333'
              }}>
                <h3 style={{ color: '#BB86FC' }}>Available Equipment</h3>
                <p style={{ fontSize: '2rem', margin: '0.5rem 0' }}>15</p>
                <p style={{ color: '#888' }}>Ready for assignment</p>
              </div>
              <div style={{
                backgroundColor: '#1E1E2F',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #333'
              }}>
                <h3 style={{ color: '#BB86FC' }}>Employees</h3>
                <p style={{ fontSize: '2rem', margin: '0.5rem 0' }}>46</p>
                <p style={{ color: '#888' }}>Total workforce</p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'repair-shop' && (
          <div>
            <h2 style={{ color: '#4A90E2', marginBottom: '1rem' }}>Repair Shop</h2>
            <div style={{
              backgroundColor: '#1E1E2F',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <h3 style={{ color: '#BB86FC' }}>Work Orders</h3>
              <p style={{ color: '#888', marginBottom: '1rem' }}>Manage repair and maintenance work orders</p>
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#0d1117',
                  borderRadius: '4px',
                  border: '1px solid #444'
                }}>
                  <h4 style={{ color: '#4A90E2', margin: '0 0 0.5rem 0' }}>WO-001</h4>
                  <p style={{ margin: '0 0 0.5rem 0' }}>CAT Excavator - Hydraulic System Repair</p>
                  <p style={{ color: '#BB86FC', fontSize: '0.9rem', margin: 0 }}>Status: In Progress</p>
                </div>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#0d1117',
                  borderRadius: '4px',
                  border: '1px solid #444'
                }}>
                  <h4 style={{ color: '#4A90E2', margin: '0 0 0.5rem 0' }}>WO-002</h4>
                  <p style={{ margin: '0 0 0.5rem 0' }}>Bulldozer - Engine Maintenance</p>
                  <p style={{ color: '#CF6679', fontSize: '0.9rem', margin: 0 }}>Status: Scheduled</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'equipment' && (
          <div>
            <h2 style={{ color: '#4A90E2', marginBottom: '1rem' }}>Equipment Management</h2>
            <div style={{
              backgroundColor: '#1E1E2F',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <h3 style={{ color: '#BB86FC', marginBottom: '1rem' }}>Equipment List</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {['CAT Excavator 320', 'Bulldozer BD-450', 'Concrete Mixer CM-500', 'Drill Set Pro'].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: '#0d1117',
                    borderRadius: '4px',
                    border: '1px solid #444'
                  }}>
                    <span>{item}</span>
                    <span style={{ 
                      color: index % 2 === 0 ? '#4CAF50' : '#BB86FC',
                      fontSize: '0.9rem'
                    }}>
                      {index % 2 === 0 ? 'Available' : 'In Use'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const el = document.getElementById("root");
if (!el) throw new Error("#root not found");
createRoot(el).render(<OpsyncApp />);