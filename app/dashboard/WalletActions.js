"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WalletActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function fundWallet() {
    const amount = prompt("How much do you want to add to your wallet? (₦)");
    if (!amount || isNaN(amount)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.authorization_url;
    } catch (err) {
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
