import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listTransactions, getTransaction, updateTransactionStatus } from "@/lib/db";
import { verifyPayment } from "@/lib/paystack";
import { purchaseAirtime, purchaseData } from "@/lib/vtpass";
import WalletActions from "./WalletActions";

function initials(name, phone) {
  if (name) return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return phone.slice(-2);
}

function formatNaira(kobo) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

async function tryCompleteTransaction(reference) {
  if (!reference) return;
  const tx = await getTransaction(reference);
  if (!tx || tx.status === "success") return;

  try {
    if (tx.payment_method !== "wallet") {
      const result = await verifyPayment(reference);
      if (result.data.status !== "success") {
        await updateTransactionStatus(reference, "failed");
        return;
      }
    }

    const baseAmountNaira = tx.base_amount / 100;
    let vtpassResult;
    if (tx.type === "airtime") {
      vtpassResult = await purchaseAirtime({
        requestId: tx.reference,
        phone: tx.phone,
        network: tx.network,
        amountNaira: baseAmountNaira,
      });
    } else {
      vtpassResult = await purchaseData({
        requestId: tx.reference,
        phone: tx.phone,
        network: tx.network,
        variationCode: tx.plan_code,
      });
    }

    await updateTransactionStatus(reference, "success", {
      vtpass_ref: vtpassResult?.content?.transactions?.transactionId || null,
    });
  } catch (err) {
    console.error("dashboard auto-verify error:", err.response?.data || err.message);
    await updateTransactionStatus(reference, "failed");
  }
}

export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  if (params?.paid) {
    await tryCompleteTransaction(params.paid);
  }

  const recent = await listTransactions(user.id, 6);

  return (
    <div className="wrap">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Profile"
              className="avatar"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="avatar">{initials(user.name, user.phone)}</div>
          )}
          <div>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 14.5 }}>
              Hi, {user.name ? user.name.split(" ")[0] : "there"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{user.phone}</div>
          </div>
        </div>
        <Link href="/settings" className="gear">⚙</Link>
      </div>

      <div className="wallet-card">
        <div className="wallet-label">Wallet balance</div>
        <div className="wallet-balance">{formatNaira(user.wallet_balance)}</div>
        <WalletActions />
      </div>

      <div className="quick-grid">
        <Link href="/buy?type=data" className="quick-tile">
          <div className="icon">📶</div>
          <div className="label">Buy Data</div>
          <div className="desc">All networks</div>
        </Link>
        <Link href="/buy?type=airtime" className="quick-tile">
          <div className="icon">📞</div>
          <div className="label">Buy Airtime</div>
          <div className="desc">All networks</div>
        </Link>
      </div>

      <div className="main-pad">
        <Link href="/referral" style={{ textDecoration: "none" }}>
          <div className="stub" style={{ marginTop: 0, marginBottom: 22 }}>
            <div className="stub-row">
              <span>your referral code</span>
              <b>{user.referral_code}</b>
            </div>
            <div className="stub-row">
              <span>tap to view earnings →</span>
              <b></b>
            </div>
          </div>
        </Link>

        <div className="section-label">Recent activity</div>
        {recent.length === 0 && (
          <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>No transactions yet.</p>
        )}
        {recent.map((tx) => (
          <div className="tx-row" key={tx.id}>
            <div className="tx-info">
              <div className="name">
                {tx.network.toUpperCase()} · {tx.type === "data" ? "Data" : "Airtime"}
              </div>
              <div className="meta">{new Date(tx.created_at).toLocaleString()}</div>
            </div>
            <div className="tx-amount">-{formatNaira(tx.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}