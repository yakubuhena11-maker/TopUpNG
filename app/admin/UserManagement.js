"use client";

import { useState } from "react";

function money(value) { return `₦${(Number(value || 0) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`; }

export default function UserManagement({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [saving, setSaving] = useState("");
  function change(id, key, value) { setUsers(list => list.map(user => user.id === id ? { ...user, [key]: value } : user)); }
  async function save(user) {
    setSaving(user.id);
    try {
      const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(list => list.map(item => item.id === user.id ? data.user : item));
    } catch (err) { alert(err.message); } finally { setSaving(""); }
  }
  return <section className="card-section" style={{ overflowX: "auto" }}>
    <div className="card-title">User management</div>
    <table className="admin-table"><thead><tr><th>Name</th><th>Phone</th><th>Wallet</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead><tbody>
      {users.map(user => <tr key={user.id}>
        <td><input value={user.name || ""} onChange={e => change(user.id, "name", e.target.value)} /></td>
        <td><input value={user.phone} onChange={e => change(user.id, "phone", e.target.value)} /></td>
        <td><input type="number" min="0" value={Math.round(Number(user.wallet_balance || 0) / 100)} onChange={e => change(user.id, "wallet_balance", Number(e.target.value) * 100)} /></td>
        <td>{user.role}</td>
        <td><button className={user.is_active ? "btn" : "btn danger"} style={{ width: "auto", margin: 0, padding: "7px 10px" }} onClick={() => save({ ...user, is_active: !user.is_active })}>{user.is_active ? "Active" : "Inactive"}</button></td>
        <td>{new Date(user.created_at).toLocaleDateString("en-NG")}</td>
        <td><button className="btn ghost" style={{ width: "auto", margin: 0, padding: "7px 10px" }} disabled={saving === user.id} onClick={() => save(user)}>{saving === user.id ? "Saving…" : "Save"}</button></td>
      </tr>)}
    </tbody></table>
  </section>;
}

export { money };
