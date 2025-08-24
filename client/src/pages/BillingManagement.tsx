import React, { useState, useEffect } from "react";
import PlanSelector from "../components/PlanSelector";
import InviteForm from "../components/InviteForm";

export default function BillingManagement() {
  const [currentPlan, setCurrentPlan] = useState("single");
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);

  const handlePlanUpgrade = async (planId: string) => {
    try {
      const response = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, orgId: "org-001" }),
      });
      if (response.ok) {
        setCurrentPlan(planId);
        alert("Plan upgraded successfully!");
      }
    } catch (error) {
      alert("Failed to upgrade plan");
    }
  };

  const handleInvite = async (email: string) => {
    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, orgId: "org-001" }),
      });
      const result = await response.json();
      if (response.ok) {
        setInvites([...invites, { email, inviteLink: result.inviteLink }]);
        alert(`Invite sent! Link: ${result.inviteLink}`);
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("Failed to send invite");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Billing Management</h2>
      
      <div style={{ marginBottom: "30px" }}>
        <h3>Current Plan: {currentPlan}</h3>
        <PlanSelector currentPlan={currentPlan} onUpgrade={handlePlanUpgrade} />
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3>Team Members</h3>
        <p>Current users: {users.length}</p>
        <InviteForm onInvite={handleInvite} />
      </div>

      {invites.length > 0 && (
        <div>
          <h3>Recent Invites</h3>
          {invites.map((invite, index) => (
            <div key={index} style={{ marginBottom: "10px", padding: "10px", border: "1px solid #ccc" }}>
              <p>Email: {invite.email}</p>
              <p>Invite Link: <a href={invite.inviteLink}>{invite.inviteLink}</a></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}