"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole } from "lucide-react";
import styles from "../auth.module.css";
import { PASSWORD_HINT, validatePasswordStrength } from "@/lib/password-policy";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (submitting) return;
    setError("");
    if (!token) {
      setError("This reset link is invalid. Request a new one.");
      return;
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setError(data.error || "Couldn't reset the password. Please request a new link.");
        return;
      }
      setDone(true);
    } catch {
      setError("Couldn't reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !!token && !validatePasswordStrength(password) && password === confirm;

  return (
    <main className={styles.authPage}>
      <div className={styles.authShell} style={{ gridTemplateColumns: "1fr" }}>
        <section className={styles.formPanel}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <div className={styles.formIcon} style={{ marginBottom: 14 }}>
                {done ? <Check size={19} /> : <LockKeyhole size={19} />}
              </div>
              <h1 className={styles.formTitle}>{done ? "Password updated" : "Choose a new password"}</h1>
              <p className={styles.formSubtitle}>
                {done
                  ? "Every device has been signed out. Sign in with your new password to continue."
                  : PASSWORD_HINT}
              </p>
            </div>

            {done ? (
              <Link href="/sign-in" className={styles.primaryButton} style={{ textDecoration: "none" }}>
                <span>Go to sign in</span> <ArrowRight size={14} />
              </Link>
            ) : !token ? (
              <>
                <div className={styles.error}>This reset link is invalid or incomplete. Request a new one.</div>
                <Link href="/forgot-password" className={styles.primaryButton} style={{ textDecoration: "none" }}>
                  <span>Request a new link</span> <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <>
                <label className={styles.field}>
                  <span className={styles.label}>New password</span>
                  <div className={styles.inputWrap}>
                    <LockKeyhole size={16} className={styles.inputIcon} />
                    <input
                      className={`${styles.input} ${styles.passwordInput}`}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="New password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && submit()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className={styles.iconButton}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Confirm new password</span>
                  <div className={styles.inputWrap}>
                    <LockKeyhole size={16} className={styles.inputIcon} />
                    <input
                      className={`${styles.input} ${styles.passwordInput}`}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Repeat the new password"
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && submit()}
                    />
                  </div>
                </label>

                {error && <div className={styles.error}>{error}</div>}

                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSubmit || submitting}
                  className={styles.primaryButton}
                  style={!canSubmit || submitting ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                >
                  {submitting ? "Saving…" : <><span>Set new password</span> <ArrowRight size={14} /></>}
                </button>
              </>
            )}

            {!done && (
              <p className={styles.footerText}>
                <Link href="/sign-in" className={styles.footerLink} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <ArrowLeft size={13} /> Back to sign in
                </Link>
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
