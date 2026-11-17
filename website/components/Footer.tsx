import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

const CONTACT_SALES_URL = "https://wa.me/+923029646928?text=Hi%2C%20I%27m%20interested%20in%20a%20Salon%20Central%20plan.";

const linkCols: { heading: string; items: { label: string; href: string; external?: boolean }[] }[] = [
  {
    heading: "Product",
    items: [
      { label: "Features",     href: "/#features" },
      { label: "Pricing",      href: "/pricing" },
      { label: "How It Works", href: "/#how" },
      { label: "Testimonials", href: "/#testimonials" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "Why Salon Central", href: "/#why" },
      { label: "Contact Us",        href: "/contact" },
      { label: "Get Started",       href: CONTACT_SALES_URL, external: true },
    ],
  },
  {
    heading: "Compare",
    items: [
      { label: "vs Blusha",   href: "/compare/salon-central-vs-blusha" },
      { label: "vs Websol",   href: "/compare/salon-central-vs-websol" },
      { label: "vs Hulm",     href: "/compare/salon-central-vs-hulm" },
      { label: "vs Asaan POS", href: "/compare/salon-central-vs-asaan-pos" },
      { label: "vs OneClick", href: "/compare/salon-central-vs-oneclick" },
      { label: "vs Oscar",    href: "/compare/salon-central-vs-oscar" },
      { label: "vs eHisabKitab", href: "/compare/salon-central-vs-ehisabkitab" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        {/* ── Brand col ── */}
        <div className={styles.brand}>
          <div className={styles.logoWrap}>
            <Image
              src="/salon-central-logo.png"
              alt="Salon Central"
              width={1080}
              height={1080}
              style={{ height: "110px", width: "110px", objectFit: "contain" }}
            />
          </div>
          <p className={styles.tagline}>
            The all-in-one operating system for Pakistan&apos;s beauty industry.
            Manage bookings, staff, and revenue, all from one dashboard.
          </p>
          <a href="tel:+923029646928" className={styles.phone}>+92 302 9646928</a>
        </div>

        {/* ── Link cols ── */}
        <div className={styles.cols}>
          {linkCols.map(({ heading, items }) => (
            <div key={heading} className={styles.col}>
              <h4 className={styles.colHead}>{heading}</h4>
              <ul className={styles.colList}>
                {items.map((item) => (
                  <li key={item.label}>
                    {item.external ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className={styles.colLink}>{item.label}</a>
                    ) : (
                      <Link href={item.href} className={styles.colLink}>{item.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className={styles.bottom}>
        <span style={{ color: "#fff" }}>© 2026 Salon Central. All rights reserved.</span>
        <div className={styles.legal}>
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
