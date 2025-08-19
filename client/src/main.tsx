import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "Inter, sans-serif" }}>
      <h1>OpsSync.ai - System Test</h1>
      <p>React is working correctly</p>
      <p>Vite dev server is operational</p>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}