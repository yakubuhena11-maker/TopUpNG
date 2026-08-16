"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  async function sendOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("otp");
    } catch (err) {
      setError(err.message || "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  function handleDigitChange(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) inputsRef.current[i + 1]?.focus();
  }

  async function verifyOtp() {
    setError("");
    setLoading(true);
    try {
      const code = digits.join("");
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, ref }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Could not verify code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap main-pad">
      <div style={{ paddingTop: 24 }}>
        <div className="wordmark">
          top<span>up</span>ng
        </div>

        {step === "phone" ? (
          <>
            <h1>Welcome back.</h1>
            <p className="sub">
              Enter your phone number — we&apos;ll text you a code, no password to remember.
            </p>
            {ref && (
              <p className="sub" style={{ color: "var(--primary)" }}>
                Signing up with referral code: <b>{ref}</b>
              </p>
            )}
            <div className="field">
              <label>Phone number</label>
              <input
                type="tel"
                placeholder="080X XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn" disabled={loading || phone.length < 10} onClick={sendOtp}>
              {loading ? "Sending…" : "Send code →"}
            </button>
          </>
        ) : (
          <>
            <h1>Enter the code.</h1>
            <p className="sub">
              Sent to <b>{phone}</b>. It expires in 5 minutes.
            </p>
            <div className="otp-row">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                />
              ))}
            </div>
            {error && <div className="error-text">{error}</div>}
            <button
              className="btn"
              disabled={loading || digits.some((d) => !d)}
              onClick={verifyOtp}
            >
              {loading ? "Verifying…" : "Verify & continue"}
            </button>
            <p className="fineprint">
              Wrong number?{" "}
              <a onClick={() => setStep("phone")} style={{ cursor: "pointer", color: "var(--primary)" }}>
                Go back
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
      }
