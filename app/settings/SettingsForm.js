"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({ user }) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error("Could not save changes");
      router.refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      <div className="section-label">Edit details</div>
      <div className="field">
        <label>Full name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
      </div>
      <div className="field">
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <div className="field">
        <label>Phone number</label>
        <input value={user.phone} disabled />
      </div>
      <button className="btn ghost" disabled={saving} onClick={saveChanges}>
        {saving ? "Saving…" : "Save changes"}
      </button>

      <div className="divider" />

      <button className="btn danger" disabled={loggingOut} onClick={handleLogout}>
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </>
  );
  }
