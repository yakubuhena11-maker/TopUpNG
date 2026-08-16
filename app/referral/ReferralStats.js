"use client";

import { useEffect, useState } from "react";

function formatNaira(kobo) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function ReferralStats({ referralCode }) {
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const link = typeof window !== "undefined"
    ? `${window.location.origin}/login?ref=${referralCode}`
    : "";

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="stub">
        <div className="stub-row">
          <span>your code</span>
          <b>{referralCode}</b>
        </div>
        <div className="stub-row">
          <span>referrals so far</span>
          <b>{stats ? stats.referral_count : "—"}</b>
        </div>
        <div className="stub-total">
          <span className="label">Total earned</span>
          <span className="amount">{stats ? formatNaira(stats.total_earned) : "—"}</span>
        </div>
      </div>

      <div className="field" style={{ marginTop: 22 }}>
        <label>Your invite link</label>
        <input value={link} readOnly />
      </div>
      <button className="btn" onClick={copyLink}>
        {copied ? "Copied!" : "Copy invite link"}
      </button>
    </>
  );
  }
