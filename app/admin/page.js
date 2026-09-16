import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { countUsers, countTransactions, listAdminTransactions, getAllSettings } from "@/lib/db";
import { listAdminUsers, adminAnalytics } from "@/lib/admin-db";
import UserManagement from "./UserManagement";

function formatNaira(kobo) {
  return `₦${(Number(kobo || 0) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-NG");
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const [userCount, transactionCount, users, transactions, settings, analytics] = await Promise.all([
    countUsers(), countTransactions(), listAdminUsers(), listAdminTransactions(10), getAllSettings(), adminAnalytics(),
  ]);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <div className="wordmark">top<span>up</span>ng</div>
          <h1>Admin dashboard</h1>
          <p className="sub">Manage users, monitor revenue, and track platform activity.</p>
        </div>
        <Link href="/dashboard" className="btn ghost" style={{ width: "auto", display: "inline-block", textDecoration: "none", marginTop: 0 }}>
          Back to app
        </Link>
      </header>

      <section className="admin-grid">
        <div className="admin-stat"><div className="label">Total users</div><div className="value">{userCount}</div></div>
        <div className="admin-stat"><div className="label">Successful purchases</div><div className="value">{analytics.summary.purchaseCount}</div></div>
        <div className="admin-stat"><div className="label">Markup revenue</div><div className="value">{formatNaira(analytics.summary.markupRevenue)}</div></div>
        <div className="admin-stat"><div className="label">Funding fee revenue</div><div className="value">{formatNaira(analytics.summary.fundingFeeRevenue)}</div></div>
      </section>

      <section className="card-section">
        <div className="card-title">Revenue and volume</div>
        <div className="admin-grid">
          <div className="admin-stat"><div className="label">Wallet funding volume</div><div className="value">{formatNaira(analytics.summary.fundingVolume)}</div></div>
          <div className="admin-stat"><div className="label">Purchase volume</div><div className="value">{formatNaira(analytics.summary.purchaseVolume)}</div></div>
          <div className="admin-stat"><div className="label">Transactions</div><div className="value">{transactionCount}</div></div>
          <div className="admin-stat"><div className="label">Markup setting</div><div className="value">{settings.purchase_markup_percent || "0"}%</div></div>
        </div>
      </section>

      <UserManagement initialUsers={users} />

      <div className="admin-columns">
        <section className="card-section">
          <div className="card-title">Transactions by type</div>
          <table className="admin-table"><thead><tr><th>Type</th><th>Count</th><th>Volume</th></tr></thead><tbody>
            {analytics.types.map((item) => <tr key={item.type}><td>{item.type}</td><td>{item.count}</td><td>{formatNaira(item.volume)}</td></tr>)}
          </tbody></table>
        </section>
        <section className="card-section">
          <div className="card-title">Transactions by network</div>
          <table className="admin-table"><thead><tr><th>Network</th><th>Count</th><th>Volume</th></tr></thead><tbody>
            {analytics.networks.map((item) => <tr key={item.network}><td>{item.network.toUpperCase()}</td><td>{item.count}</td><td>{formatNaira(item.volume)}</td></tr>)}
          </tbody></table>
        </section>
      </div>

      <div className="admin-columns">
        <section className="card-section">
          <div className="card-title">Daily trend · last 14 days</div>
          <table className="admin-table"><thead><tr><th>Day</th><th>Transactions</th><th>Revenue</th></tr></thead><tbody>
            {analytics.trend.map((item) => <tr key={String(item.day)}><td>{formatDate(item.day)}</td><td>{item.count}</td><td>{formatNaira(item.revenue)}</td></tr>)}
          </tbody></table>
        </section>
        <section className="card-section">
          <div className="card-title">Top users by purchase volume</div>
          <table className="admin-table"><thead><tr><th>User</th><th>Count</th><th>Volume</th></tr></thead><tbody>
            {analytics.topUsers.map((item) => <tr key={item.phone}><td><b>{item.name || "Unnamed user"}</b><div className="muted">{item.phone}</div></td><td>{item.count}</td><td>{formatNaira(item.volume)}</td></tr>)}
          </tbody></table>
        </section>
      </div>

      <section className="card-section">
        <div className="card-title">Platform settings</div>
        <div className="admin-settings">
          <div className="field"><label>Purchase markup (%)</label><input defaultValue={settings.purchase_markup_percent || "0"} readOnly /></div>
          <div className="field"><label>Wallet funding fee (%)</label><input defaultValue={settings.wallet_funding_fee_percent || "0"} readOnly /></div>
          <div className="field"><label>Referral reward (kobo)</label><input defaultValue={settings.referral_reward_kobo || "0"} readOnly /></div>
        </div>
        <p className="fineprint" style={{ textAlign: "left", marginBottom: 0 }}>Settings are managed through the protected admin settings API.</p>
      </section>

      <section className="card-section">
        <div className="card-title">Recent transactions</div>
        <table className="admin-table"><thead><tr><th>Transaction</th><th>Amount</th><th>Status</th></tr></thead><tbody>
          {transactions.map((item) => <tr key={item.id}><td><b>{item.network.toUpperCase()} · {item.type}</b><div className="muted">{item.phone}</div></td><td>{formatNaira(item.amount)}</td><td><span className={`status-pill ${item.status}`}>{item.status}</span></td></tr>)}
        </tbody></table>
      </section>
    </main>
  );
}
