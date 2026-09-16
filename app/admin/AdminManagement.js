"use client";

import { useState } from "react";

function formatNaira(kobo) {
  return `₦${(Number(kobo || 0) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function AdminManagement({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [saving, setSaving] = useState("");

  async function save(user) {
    setSaving(user.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((current) => current.map((item) => item.id === user.id ? data.user : item));
    } catch (err) { alert(err.message || "Could not update user"); }
    finally { setSaving(""); }
  }

  function change(id, key, value) {
    setUsers((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));
  }

  return (
    <section className="card-section" style={{ overflowX: "auto" }}>
      <div className="card-title">User management</div>
      <table className="admin-table"><thead><tr><th>Name</th><th>Phone</th><th>Wallet</th><th>Role</th><th>Status</th><th>Joined</th><th /></tr></thead><tbody>
        {users.map((user) => <tr key={user.id}>
          <td><input value={user.name || ""} onChange={(e) => change(user.id, "name", e.target.value)} style={{ minWidth: 120 }} /></td>
          <td><input value={user.phone || ""} onChange={(e) => change(user.id, "phone", e.target.value)} style={{ minWidth: 110 }} /></td>
          <td><input type="number" min="0" value={Math.round(Number(user.wallet_balance || 0) / 100)} onChange={(e) => change(user.id, "wallet_balance", Number(e.target.value) * 100)} style={{ width: 90 }} /></td>
          <td>{user.role}</td>
          <td><button className={user.is_active ? "btn" : "btn danger"} style={{ padding: "7px 10px", margin: 0, width: "auto" }} onClick={() => save({ ...user, is_active: !user.is_active })}>{user.is_active ? "Active" : "Inactive"}</button></td>
          <td>{new Date(user.created_at).toLocaleDateString("en-NG")}</td>
          <td><button className="btn ghost" style={{ padding: "7px 10px", margin: 0, width: "auto" }} disabled={saving === user.id} onClick={() => save(user)}>{saving === user.id ? "Saving…" : "Save"}</button></td>
        </tr>)}
      </tbody></table>
      {!users.length && <p className="fineprint">No users found.</p>}
      <p className="fineprint" style={{ textAlign: "left", marginBottom: 0 }}>Wallet balances are entered in naira. Account changes take effect immediately.</p>
    </section>
  );
}
