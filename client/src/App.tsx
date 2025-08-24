import React, { useEffect, useState } from "react";
import BillingManagement from "./pages/BillingManagement";
import AcceptInvite from "./pages/AcceptInvite";

/**
 * Minimal client-side router (no dependency on react-router) so it works in Replit out of the box.
 * If you already use React Router, convert these to Routes.
 */
export default function App() {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function nav(to: string) {
    window.history.pushState({}, "", to);
    setRoute(to);
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, Arial, sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ marginRight: "auto" }}>OpsSync.ai</h1>
        <button onClick={() => nav("/")}>Home</button>
        <button onClick={() => nav("/billing")}>Billing Management</button>
      </header>

      {route === "/billing" && <BillingManagement />}
      {route.startsWith("/accept-invite") && <AcceptInvite />}
      {route === "/" && (
        <div>
          <h2>Welcome</h2>
          <p>Your app is wired for multi‑user plans and invitations.</p>
          <ul>
            <li>Open <b>Billing Management</b> to change plan and invite users.</li>
            <li>Invite emails send users to <code>/accept-invite?token=...</code> to set their password.</li>
          </ul>
        </div>
      )}
    </div>
  );
}