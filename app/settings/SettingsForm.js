"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({ user }) {
  const router = useRouter();
  const [tab, setTab] = useState("details");

  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const hasPin = !!user.pin_hash;

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef(null);

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

  async function savePin() {
    setPinError("");
    setPinSuccess("");

    if (!/^\d{4}$/.test(newPin)) {
      setPinError("PIN must be exactly 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match");
      return;
    }
    if (hasPin && !/^\d{4}$/.test(currentPin)) {
      setPinError("Enter your current PIN");
      return;
    }

    setSavingPin(true);
    try {
      const res = await fetch("/api/user/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: newPin, currentPin: hasPin ? currentPin : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save PIN");

      setPinSuccess(hasPin ? "PIN changed successfully" : "PIN set successfully");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      router.refresh();
    } catch (err) {
      setPinError(err.message);
    } finally {
      setSavingPin(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError("");
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not upload image");

      router.refresh();
    } catch (err) {
      setAvatarError(err.message);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: "pointer", display: "inline-block", position: "relative" }}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Profile"
              style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div className="avatar" style={{ width: 72, height: 72, fontSize: 22 }}>
              {name ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : user.phone.slice(-2)}
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
            {uploadingAvatar ? "Uploading…" : "Tap to change photo"}
          </div>
        </div>
        {avatarError && <div className="error-text">{avatarError}</div>}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setTab("details")}
          className={tab === "details" ? "btn" : "btn ghost"}
          style={{ flex: 1 }}
        >
          Edit details
        </button>
        <button
          onClick={() => setTab("pin")}
          className={tab === "pin" ? "btn" : "btn ghost"}
          style={{ flex: 1 }}
        >
          Transaction PIN
        </button>
      </div>

      {tab === "details" && (
        <div className="card-section">
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
        </div>
      )}

      {tab === "pin" && (
        <div className="card-section">
          {!hasPin && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>
              Add a 4-digit PIN for extra security before purchases and wallet actions.
            </p>
          )}
          {hasPin && (
            <div className="field">
              <label>Current PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
              />
            </div>
          )}
          <div className="field">
            <label>New PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
            />
          </div>
          <div className="field">
            <label>Confirm PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
            />
          </div>
          {pinError && <div className="error-text">{pinError}</div>}
          {pinSuccess && <div style={{ color: "green", fontSize: 13 }}>{pinSuccess}</div>}
          <button className="btn ghost" disabled={savingPin} onClick={savePin}>
            {savingPin ? "Saving…" : hasPin ? "Change PIN" : "Set PIN"}
          </button>
        </div>
      )}

      <button className="btn danger" disabled={loggingOut} onClick={handleLogout}>
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </>
  );
}