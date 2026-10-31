"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter the email address you signed up with.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string };
      if (!data.ok) {
        setError(data.error || "Couldn't send the email. Please try again.");
        return;
      }
      setMessage(data.message || "If an account exists for that email, a reset link is on its way.");
    } catch {
      setError("Couldn't reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.authPage}>
      <div className={styles.authShell} style={{ gridTemplateColumns: "1fr" }}>
        <section className={styles.formPanel}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <div className={styles.formIcon} style={{ marginBottom: 14 }}>
                {message ? <ShieldCheck size={19} /> : <Mail size={19} />}
              </div>
              <h1 className={styles.formTitle}>{message ? "Check your email" : "Forgot password?"}</h1>
              <p className={styles.formSubtitle}>
                {message
                  ? "Open the link we sent to choose a new password. It expires in 30 minutes."
                  : "Enter the email on your account and we'll send a link to set a new password."}
              </p>
            </div>

            {message ? (
              <>
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", borderRadius: 10, padding: "12px 14px", fontSize: 13, fontWeight: 600, lineHeight: 1.6 }}>
                  {message}
                </div>
                <p className={styles.footerText} style={{ marginTop: 18 }}>
                  Nothing arrived? Check spam, or{" "}
                  <button type="button" onClick={() => { setMessage(""); setError(""); }} className={styles.footerLink} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}>
                    try another email
                  </button>
                  .
                </p>
              </>
            ) : (
              <>
                <label className={styles.field}>
                  <span className={styles.label}>Email</span>
                  <div className={styles.inputWrap}>
                    <Mail size={16} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && submit()}
                    />
                  </div>
                </label>

                {error && <div className={styles.error}>{error}</div>}

                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className={styles.primaryButton}
                  style={submitting ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                >
                  {submitting ? "Sending…" : <><span>Send reset link</span> <ArrowRight size={14} /></>}
                </button>
              </>
            )}

            <p className={styles.footerText}>
              <Link href="/sign-in" className={styles.footerLink} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <ArrowLeft size={13} /> Back to sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
