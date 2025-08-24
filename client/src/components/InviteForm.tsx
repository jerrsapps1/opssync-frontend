import React, { useState } from "react";

export default function InviteForm({
  onInvited,
  remaining
}: {
  onInvited: () => void;
  remaining: number;
}) {
  const [emails, setEmails] = useState<string>("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const list = emails.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
    if (!list.length) return alert("Add at least one email");
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: list })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite");
      alert(`Invited: ${data.sent}/${list.length}`);
      setEmails("");
      onInvited();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 600 }}>
      <label><b>Emails to invite</b> (separate with commas or spaces)</label>
      <textarea
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        rows={4}
        placeholder="alice@company.com, bob@company.com"
      />
      <div style={{ fontSize: 12, color: "#555" }}>Seats remaining: {remaining}</div>
      <div>
        <button type="submit">Send Invites</button>
      </div>
    </form>
  );
}