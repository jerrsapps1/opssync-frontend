import React, { useState } from "react";

export default function AcceptInvite() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      setStatus("Invalid invite link");
      return;
    }

    try {
      const response = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });

      if (response.ok) {
        setStatus("Account created successfully! You can now log in.");
      } else {
        const result = await response.json();
        setStatus(result.error || "Failed to accept invite");
      }
    } catch (error) {
      setStatus("Failed to accept invite");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Accept Invitation</h2>
      
      {status && (
        <div style={{ 
          padding: "10px", 
          marginBottom: "20px", 
          backgroundColor: status.includes("successfully") ? "#d4edda" : "#f8d7da",
          border: `1px solid ${status.includes("successfully") ? "#c3e6cb" : "#f5c6cb"}`,
          borderRadius: "4px"
        }}>
          {status}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="name">Full Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <button 
          type="submit"
          style={{ 
            width: "100%", 
            padding: "10px", 
            backgroundColor: "#007bff", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Create Account
        </button>
      </form>
    </div>
  );
}