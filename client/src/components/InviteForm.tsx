import React, { useState } from "react";

interface InviteFormProps {
  onInvite: (email: string) => void;
}

export default function InviteForm({ onInvite }: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onInvite(email);
      setEmail("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <div style={{ flex: 1 }}>
        <input
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
      </div>
      
      <button
        type="submit"
        disabled={!email || isSubmitting}
        style={{
          padding: "8px 16px",
          backgroundColor: isSubmitting ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          fontSize: "14px",
        }}
      >
        {isSubmitting ? "Sending..." : "Send Invite"}
      </button>
    </form>
  );
}