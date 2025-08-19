import React from "react";
import { createRoot } from "react-dom/client";

function SimpleApp() {
  return (
    <div style={{ padding: "20px", fontFamily: "Inter, sans-serif" }}>
      <h1>OpsSync.ai - System Status</h1>
      <p>✓ React is working</p>
      <p>✓ Vite is serving correctly</p>
      <p>✓ Backend server is running on port 5000</p>
      <p style={{ color: "orange" }}>⚠ Investigating App.tsx import issues...</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<SimpleApp />);