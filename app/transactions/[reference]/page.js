import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTransaction } from "@/lib/db";

function formatNaira(kobo) {
  return `₦${(Number(kobo || 0) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default async function TransactionDetailPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { reference } = await params;
  const transaction = await getTransaction(reference);
  if (!transaction || transaction.user_id !== user.id) redirect("/dashboard");

  return (
    <div className="wrap main-pad">
      <div className="buy-shell">
        <div className="buy-header" style={{ marginBottom: 16 }}>
          <Link href="/dashboard" className="back-link">← Back</Link>
        </div>

        <div className="card-section">
          <div className="card-title">Transaction details</div>
          <div className="info-list">
            <div className="info-row"><span>Reference</span><b>{transaction.reference}</b></div>
            <div className="info-row"><span>Status</span><b>{transaction.status}</b></div>
            <div className="info-row"><span>Network</span><b>{transaction.network.toUpperCase()}</b></div>
            <div className="info-row"><span>Type</span><b>{transaction.type === "data" ? "Data" : "Airtime"}</b></div>
            <div className="info-row"><span>Phone</span><b>{transaction.phone}</b></div>
            <div className="info-row"><span>Plan</span><b>{transaction.plan_code || "—"}</b></div>
            <div className="info-row"><span>Amount</span><b>{formatNaira(transaction.amount)}</b></div>
            <div className="info-row"><span>Date</span><b>{new Date(transaction.created_at).toLocaleString()}</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}
