"use client";
import Link from "next/link";
import styles from "./Hero.module.css";

/* ── decorative salon-tool line icons ─────────────────────── */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function ScissorsIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <line x1="8.5" y1="7.5" x2="20" y2="19" />
      <line x1="8.5" y1="16.5" x2="20" y2="5" />
    </svg>
  );
}

function HairdryerIcon() {
  return (
    <svg {...iconProps}>
      <ellipse cx="10" cy="9" rx="6" ry="4" />
      <rect x="8" y="12.5" width="4" height="7" rx="2" />
      <line x1="20.5" y1="7" x2="22.5" y2="6" />
      <line x1="20.5" y1="9" x2="23" y2="9" />
      <line x1="20.5" y1="11" x2="22.5" y2="12" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className={styles.hero} id="home">

      {/* ── floating salon-tool icon chips ── */}
      <div className={`${styles.iconChip} ${styles.iconUL}`} aria-hidden="true"><ScissorsIcon /></div>
      <div className={`${styles.iconChip} ${styles.iconUR}`} aria-hidden="true"><HairdryerIcon /></div>

      {/* ── headline + subtitle + buttons ── */}
      <div className={styles.content}>
        <h1 className={styles.title} data-animate data-delay="0.1">
          Simplify Salon Operations<br />
          <span className={styles.revenueLine}>
            <span className={styles.tenXHighlight}>
              <span className={styles.tenXText}>10x</span>
              <svg className={styles.tenXCircle} viewBox="0 0 150 92" preserveAspectRatio="none" aria-hidden="true">
                <path d="M18 56 C7 35 28 14 68 10 C111 6 144 24 140 51 C136 79 91 88 48 78 C28 74 17 66 18 56 Z" />
                <path d="M26 62 C14 42 33 21 72 17 C112 13 135 29 131 51 C127 73 91 80 52 72 C36 69 25 65 26 62 Z" />
              </svg>
            </span>{" "}
            Your Revenue
          </span>
        </h1>
        <p className={styles.sub} data-animate data-delay="0.25">
          All-in-one salon management software with a built-in salon POS system and CRM.
          Manage bookings, clients, staff and revenue from start to finish.
        </p>
        <div className={styles.btns}>
          <Link href="/pricing" className={styles.btnPrimary}>View Pricing</Link>
        </div>
      </div>

    </section>
  );
}
