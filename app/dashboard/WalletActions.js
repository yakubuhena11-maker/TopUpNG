"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WalletActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function fundWallet() {
    const amount = prompt("How much do you want to add to your wallet? (₦)");
    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      if (amount) alert("Enter a valid funding amount");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Funding request failed (${res.status})`);
      if (!data.authorization_url) throw new Error("Payment checkout URL was not returned");
      window.location.assign(data.authorization_url);
    } catch (err) {
      console.error("fund wallet error:", err);
      alert(err.message || "Could not start funding");
      setLoading(false);
    }
  }

  return (
    <div className="wallet-actions">
      <button className="solid" disabled={loading} onClick={fundWallet}>
        {loading ? "Redirecting…" : "+ Fund wallet"}
      </button>
      <button onClick={() => router.push("/buy")}>Pay instantly instead</button>
    </div>
  );
}
