"use client";

import { useState, useEffect, useRef } from "react";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function togglePanel() {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadNotifications();
      if (unreadCount > 0) {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true }),
        });
        setUnreadCount(0);
      }
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      <button
        onClick={togglePanel}
        style={{
          background: "none",
          border: "none",
          fontSize: 20,
          cursor: "pointer",
          position: "relative",
          padding: 4,
        }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "#e53935",
              color: "#fff",
              borderRadius: "50%",
              width: 16,
              height: 16,
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 36,
            width: 300,
            maxHeight: 380,
            overflowY: "auto",
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            zIndex: 50,
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ padding: "12px 16px", fontWeight: 700, borderBottom: "1px solid #eee" }}>
            Notifications
          </div>
          {loading && (
            <div style={{ padding: 16, fontSize: 13, color: "var(--ink-soft)" }}>Loading…</div>
          )}
          {!loading && notifications.length === 0 && (
            <div style={{ padding: 16, fontSize: 13, color: "var(--ink-soft)" }}>
              No notifications yet.
            </div>
          )}
          {!loading &&
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f2f2f2",
                  background: n.is_read ? "#fff" : "#f7f9ff",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.title}</div>
                {n.message && (
                  <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>
                    {n.message}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                  {timeAgo(n.created_at)}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
