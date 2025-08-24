import React, { useState, useEffect } from "react";
import BillingManagement from "./pages/BillingManagement";
import AcceptInvite from "./pages/AcceptInvite";

export default function App() {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  function nav(to: string) {
    window.history.pushState({}, "", to);
    setRoute(to);
  }

  return (
    <div>
      <h1>OpsSync.ai</h1>
      <button onClick={() => nav("/")}>Home</button>
      <button onClick={() => nav("/billing")}>Billing Management</button>

      {route === "/billing" && <BillingManagement />}
      {route.startsWith("/accept-invite") && <AcceptInvite />}
      {route === "/" && <p>Welcome — go to Billing Management to test multi-user features.</p>}
    </div>
  );
}