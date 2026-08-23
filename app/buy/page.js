"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NETWORKS = [
  { id: "mtn", label: "MTN", dot: "mtn" },
  { id: "glo", label: "Glo", dot: "glo" },
  { id: "airtel", label: "Airtel", dot: "airtel" },
  { id: "9mobile", label: "9mobile", dot: "mobile9" },
];

const DATA_PLANS = [
  { code: "1.5gb-30", size: "1.5GB", validity: "30 days", amount: 850 },
  { code: "3.5gb-30", size: "3.5GB", validity: "30 days", amount: 1500 },
  { code: "7gb-30", size: "7GB", validity: "30 days", amount: 2800 },
  { code: "15gb-30", size: "15GB", validity: "30 days", amount: 5000 },
];

export default function BuyPage() {
  const router = useRouter();
  const [network, setNetwork] = useState("mtn");
  const [type, setType] = useState("data");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState(DATA_PLANS[1]);
  const [airtimeAmount, setAirtimeAmount] = useState(500);
  const [payMethod, setPayMethod] = useState("paystack");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amount = type === "data" ? plan.amount : airtimeAmount;
  const reference = "TOPUP-" + Math.random().toString(36).slice(2, 10).toUpperCase();

  async function pay() {
    setError("");
    if (!phone || phone.length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/transactions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          network,
          type,
          plan_code: type === "data" ? plan.code : null,
          amount,
          payment_method: payMethod,
          pin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        router.push(`/dashboard`);
      }
    } catch (err) {
      setError(err.message || "Could not start purchase");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap main-pad">
      <div style={{ paddingTop: 20 }}>
        <div className="wordmark">
          top<span>up</span>ng
        </div>
        <h1>Top up in under a minute.</h1>
        <p className="sub">Pick a network, enter the number, pay.</p>

        <div className="section-label">01 — Network</div>
        <div className="network-grid">
          {NETWORKS.map((n) => (
            <div
              key={n.id}
              className={`network ${network === n.id ? "selected" : ""}`}
              onClick={() => setNetwork(n.id)}
            >
              <div className={`dot ${n.dot}`}></div>
              <div className="network-name">{n.label}</div>
            </div>
          ))}
        </div>

        <div className="section-label">02 — What are you buying</div>
        <div className="toggle">
          <button className={type === "data" ? "active" : ""} onClick={() => setType("data")}>
            Data
          </button>
          <button className={type === "airtime" ? "active" : ""} onClick={() => setType("airtime")}>
            Airtime
          </button>
        </div>

        <div className="section-label">03 — Phone number</div>
        <div className="field">
          <input
            type="tel"
            placeholder="080X XXX XXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {type === "data" ? (
          <>
            <div className="section-label">04 — Choose a plan</div>
            <div className="plan-grid">
              {DATA_PLANS.map((p) => (
                <div
                  key={p.code}
                  className={`plan ${plan.code === p.code ? "selected" : ""}`}
                  onClick={() => setPlan(p)}
                >
                  <div className="size">{p.size}</div>
                  <div className="validity">{p.validity}</div>
                  <div className="price">₦{p.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="section-label">04 — Amount</div>
            <div className="plan-grid">
              {[200, 500, 1000, 2000].map((a) => (
                <div
                  key={a}
                  className={`plan ${airtimeAmount === a ? "selected" : ""}`}
                  onClick={() => setAirtimeAmount(a)}
                >
                  <div className="size">₦{a.toLocaleString()}</div>
                  <div className="validity">Airtime</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="section-label">05 — Pay with</div>
        <div className="toggle">
          <button className={payMethod === "paystack" ? "active" : ""} onClick={() => setPayMethod("paystack")}>
            Card / Transfer
          </button>
          <button className={payMethod === "wallet" ? "active" : ""} onClick={() => setPayMethod("wallet")}>
            Wallet balance
          </button>
        </div>

        <div className="stub">
          <div className="stub-row"><span>network</span><b>{network.toUpperCase()}</b></div>
          <div className="stub-row"><span>number</span><b>{phone || "—"}</b></div>
          <div className="stub-row">
            <span>{type === "data" ? "plan" : "type"}</span>
            <b>{type === "data" ? `${plan.size} · ${plan.validity}` : "Airtime"}</b>
          </div>
          <div className="stub-row"><span>ref</span><b>{reference}</b></div>
          <div className="stub-total">
            <span className="label">Total</span>
            <span className="amount">₦{amount.toLocaleString()}</span>
          </div>
        </div>
        <p className="fineprint">Final price may include a small service fee.</p>

        <div className="section-label">06 — Transaction PIN</div>
        <div className="field">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="Enter your 4-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        {error && <div className="error-text">{error}</div>}
        <button className="btn" disabled={loading} onClick={pay}>
          {loading ? "Processing…" : payMethod === "wallet" ? "Pay from wallet →" : "Pay with Paystack →"}
        </button>
      </div>
    </div>
  );
}