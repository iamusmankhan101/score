"use client";
import { useEffect, useState } from "react";
import styles from "./CookieConsent.module.css";

const STORAGE_KEY = "salon_central_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show once — if the visitor already made a choice (accept or
    // decline), never show it again on later visits/pages.
    if (localStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  function choose(value: "accepted" | "declined") {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.wrap} role="dialog" aria-label="Cookie consent" aria-live="polite">
      <div className={styles.banner}>
        <p className={styles.text}>
          We only use essential cookies and storage, to keep you signed in and remember your choices. No advertising
          or tracking cookies. Read our <a href="/privacy">Privacy Policy</a> to learn more.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.decline} onClick={() => choose("declined")}>
            Decline
          </button>
          <button type="button" className={styles.accept} onClick={() => choose("accepted")}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
