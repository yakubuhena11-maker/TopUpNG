"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const MIN_PASSWORD_LENGTH = 4;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const resetToken = searchParams.get("reset");
  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  function validatePasswordFields() {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  }

  async function submit(path, body) {
    setError("");
    setMessage("");
    setResetUrl("");
    setLoading(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.resetUrl) setResetUrl(data.resetUrl);
      if (data.message) {
        setMessage(data.message);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (mode === "reset") {
      if (!resetToken) {
        setError("Reset token is missing");
        return;
      }
      if (!validatePasswordFields()) return;
      return submit("/api/auth/reset-password", { token: resetToken, password, confirmPassword });
    }

    if (mode === "forgot") {
      if (!phone || phone.replace(/\D/g, "").length < 10) {
        setError("Enter a valid phone number");
        return;
      }
      return submit("/api/auth/forgot-password", { phone });
    }

    if (mode === "signup") {
      if (!phone || phone.replace(/\D/g, "").length < 10) {
        setError("Enter a valid phone number");
        return;
      }
      if (!validatePasswordFields()) return;
      return submit("/api/auth/register", { phone, password, confirmPassword, ref });
    }

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    if (!password) {
      setError("Enter your password");
      return;
    }
    return submit("/api/auth/login", { phone, password });
  }

  const titles = {
    login: "Welcome back.",
    signup: "Create your account.",
    forgot: "Forgot your password?",
    reset: "Choose a new password.",
  };

  return (
    <div className="wrap main-pad">
      <div style={{ paddingTop: 24 }}>
        <div className="wordmark">
          top<span>up</span>ng
        </div>

        <h1>{titles[mode]}</h1>
        <p className="sub">
          {mode === "login"
            ? "Log in with your phone number and password."
            : mode === "signup"
              ? "Create a secure password of at least 4 characters."
              : mode === "forgot"
                ? "Enter your phone number and we’ll generate reset instructions."
                : "Set your new password before continuing."}
        </p>

        {mode === "signup" && ref && (
          <p className="sub" style={{ color: "var(--primary)" }}>
            Signing up with referral code: <b>{ref}</b>
          </p>
        )}

        {(mode === "login" || mode === "signup" || mode === "forgot") && (
          <div className="field">
            <label>Phone number</label>
            <input
              type="tel"
              placeholder="080X XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        )}

        {(mode === "login" || mode === "signup" || mode === "reset") && (
          <div className="field">
            <label>{mode === "reset" ? "New password" : "Password"}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        {(mode === "signup" || mode === "reset") && (
          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        )}

        {error && <div className="error-text">{error}</div>}
        {message && <p className="fineprint" style={{ color: "var(--success)" }}>{message}</p>}
        {resetUrl && (
          <p className="fineprint" style={{ wordBreak: "break-all" }}>
            Development reset link: <a href={resetUrl}>{resetUrl}</a>
          </p>
        )}

        <button className="btn" disabled={loading} onClick={handleSubmit}>
          {loading
            ? "Working…"
            : mode === "login"
              ? "Log in →"
              : mode === "signup"
                ? "Create account →"
                : mode === "forgot"
                  ? "Generate reset link"
                  : "Reset password →"}
        </button>

        <p className="fineprint">
          {mode === "login" && (
            <>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode("signup");
                  setError("");
                }}
              >
                Create an account
              </a>
              {" · "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode("forgot");
                  setError("");
                }}
              >
                Forgot password?
              </a>
            </>
          )}
          {mode !== "login" && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMode("login");
                setError("");
              }}
            >
              Back to login
            </a>
          )}
        </p>
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
