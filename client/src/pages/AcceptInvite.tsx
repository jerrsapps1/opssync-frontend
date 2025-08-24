import React, { useEffect, useState } from "react";

export default function AcceptInvite() {
  const [ok, setOk] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
    setOk(!!t);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const res = await fetch("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Failed");
    alert("Account created. You can now log in.");
    window.location.href = "/";
  }

  if (!ok) return <p>Missing invite token.</p>;

  return (
    <div>
      <h2>Set your password</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 400 }}>
        <input
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          placeholder="Choose a strong password"
          required
        />
        <button type="submit">Create Account</button>
      </form>
    </div>
  );
}