import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { countUsers, countTransactions, listUsers, listAdminTransactions, getAllSettings } from "@/lib/db";

function formatNaira(kobo) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const [userCount, transactionCount, users, transactions, settings] = await Promise.all([
    countUsers(), countTransactions(), listUsers(10), listAdminTransactions(10), getAllSettings(),
  ]);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <div className="wordmark">top<span>up</span>ng</div>
          <h1>Admin dashboard</h1>
          <p className="sub">Monitor activity and manage platform settings.</p>
        </div>
        <Link href="/dashboard" className="btn ghost" style={{ width: "auto", display: "inline-block", textDecoration: "none", marginTop: 0 }}>
          Back to app
        </Link>
      </header>

      <section className="admin-grid">
        <div className="admin-stat"><div className="label">Total users</div><div className="value">{userCount}</div></div>
        <div className="admin-stat"><div className="label">Transactions</div><div className="value">{transactionCount}</div></div>
        <div className="admin-stat"><div className="label">Purchase markup</div><div className="value">{settings.purchase_markup_percent || "0"}%</div></div>
        <div className="admin-stat"><div className="label">Wallet fee</div><div className="value">{settings.wallet_funding_fee_percent || "0"}%</div></div>
      </section>

      <section className="card-section">
        <div className="card-title">Platform settings</div>
        <div className="admin-settings">
          <div className="field"><label>Purchase markup (%)</label><input defaultValue={settings.purchase_markup_percent || "0"} readOnly /></div>
          <div className="field"><label>Wallet funding fee (%)</label><input defaultValue={settings.wallet_funding_fee_percent || "0"} readOnly /></div>
          <div className="field"><label>Referral reward (kobo)</label><input defaultValue={settings.referral_reward_kobo || "0"} readOnly /></div>
        </div>
        <p className="fineprint" style={{ textAlign: "left", marginBottom: 0 }}>Settings are managed through the protected admin settings API.</p>
      </section>

      <div className="admin-columns">
        <section className="card-section">
          <div className="card-title">Recent users</div>
          <table className="admin-table"><thead><tr><th>User</th><th>Wallet</th><th>Role</th></tr></thead><tbody>
            {users.map((item) => <tr key={item.id}><td><b>{item.name || "Unnamed user"}</b><div className="muted">{item.phone}</div></td><td>{formatNaira(item.wallet_balance)}</td><td>{item.role}</td></tr>)}
          </tbody></table>
        </section>
        <section className="card-section">
          <div className="card-title">Recent transactions</div>
          <table className="admin-table"><thead><tr><th>Transaction</th><th>Amount</th><th>Status</th></tr></thead><tbody>
            {transactions.map((item) => <tr key={item.id}><td><b>{item.network.toUpperCase()} · {item.type}</b><div className="muted">{item.phone}</div></td><td>{formatNaira(item.amount)}</td><td><span className={`status-pill ${item.status}`}>{item.status}</span></td></tr>)}
          </tbody></table>
        </section>
      </div>
    </main>
  );
}
