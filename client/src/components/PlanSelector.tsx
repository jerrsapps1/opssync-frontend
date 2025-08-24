import React, { useState, useEffect } from "react";

interface Plan {
  id: string;
  name: string;
  price: number;
  seats: number;
  features: string[];
}

interface PlanSelectorProps {
  currentPlan: string;
  onUpgrade: (planId: string) => void;
}

export default function PlanSelector({ currentPlan, onUpgrade }: PlanSelectorProps) {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetch("/api/billing/plans")
      .then((res) => res.json())
      .then(setPlans)
      .catch(console.error);
  }, []);

  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      {plans.map((plan) => (
        <div
          key={plan.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "20px",
            minWidth: "200px",
            backgroundColor: currentPlan === plan.id ? "#e7f3ff" : "white",
          }}
        >
          <h4>{plan.name}</h4>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: "10px 0" }}>
            ${plan.price}/month
          </p>
          <p>{plan.seats === -1 ? "Unlimited" : plan.seats} seats</p>
          
          <ul style={{ marginTop: "15px", paddingLeft: "20px" }}>
            {plan.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>

          {currentPlan !== plan.id && (
            <button
              onClick={() => onUpgrade(plan.id)}
              style={{
                marginTop: "15px",
                width: "100%",
                padding: "10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Upgrade
            </button>
          )}

          {currentPlan === plan.id && (
            <div
              style={{
                marginTop: "15px",
                padding: "10px",
                backgroundColor: "#28a745",
                color: "white",
                textAlign: "center",
                borderRadius: "4px",
              }}
            >
              Current Plan
            </div>
          )}
        </div>
      ))}
    </div>
  );
}