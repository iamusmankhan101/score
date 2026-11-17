import styles from "./Pricing.module.css";
import { Check } from "lucide-react";

const CONTACT_SALES_URL = "https://wa.me/+923029646928?text=Hi%2C%20I%27m%20interested%20in%20a%20Salon%20Central%20plan.";

const plans: Array<{
  badge: string;
  badgeStyle: Record<string, string>;
  name: string;
  desc: string;
  price: string;
  period: string;
  features: (string | { label: string; soon: boolean })[];
  cta: string;
  ctaHref: string;
  ctaClass: string;
  featured: boolean;
}> = [
  {
    badge: "No WhatsApp",
    badgeStyle: { background: "#cffafe", color: "#0e7490" },
    name: "Starter",
    desc: "Core salon management without WhatsApp automation.",
    price: "Contact Sales",
    period: "",
    features: [
      "Point of Sale (POS)",
      "Unlimited appointment booking",
      "Branded online web booking page",
      "Unlimited staff & client management",
      "Inventory management",
      "Invoicing",
      "Revenue management",
      "Services management",
    ],
    cta: "Contact Sales",
    ctaHref: CONTACT_SALES_URL,
    ctaClass: "btn btn-outline",
    featured: false,
  },
  {
    badge: "Most Popular",
    badgeStyle: {},
    name: "Pro",
    desc: "The complete toolkit for growing salons.",
    price: "Contact Sales",
    period: "",
    features: [
      "Point of Sale (POS)",
      "Unlimited appointment booking",
      "Branded online web booking page",
      "Unlimited staff & client management",
      "Inventory management",
      "Invoicing",
      "Revenue management",
      "Services management",
      "whatsapp reminders",
    ],
    cta: "Contact Sales",
    ctaHref: CONTACT_SALES_URL,
    ctaClass: "btn btn-primary",
    featured: true,
  },
  {
    badge: "Premium",
    badgeStyle: { background: "#fef3c7", color: "#d97706" },
    name: "Premium",
    desc: "Everything in Pro plus virtual try-on and multi-location branch management.",
    price: "Contact Sales",
    period: "",
    features: [
      "Point of Sale (POS)",
      "Unlimited appointment booking",
      "Branded online web booking page",
      "Unlimited staff & client management",
      "Inventory management",
      "Invoicing",
      "Revenue management",
      "Services management",
      "whatsapp reminders",
      "virtual try on",
      "multi-location branch management",
    ],
    cta: "Contact Sales",
    ctaHref: CONTACT_SALES_URL,
    ctaClass: "btn btn-outline",
    featured: false,
  },
];

type Props = {
  prices?: Record<string, number | null>; // monthly price per lowercase plan name; missing/null = Contact Sales
  symbol?: string;
  annual?: boolean;                        // show the discounted per-month price, billed yearly
  discount?: number;                       // e.g. 0.2 = 20% off when annual
  showHeader?: boolean;
};

export default function Pricing({ prices, symbol = "", annual = false, discount = 0.2, showHeader = true }: Props) {
  const fmt = (n: number) => `${symbol}${n.toLocaleString("en-US")}`;
  return (
    <section className={styles.section} id="pricing">
      {showHeader && <div className="text-center">
        <div className="section-label" data-animate data-delay="0">✦ Pricing</div>
        <h2 className="section-title" data-animate data-delay="0.1">Plans Built Around<br />Your Salon.</h2>
        <p className="section-sub" data-animate data-delay="0.2">Talk to our sales team and choose the setup that fits your salon.</p>
      </div>}
      <div className={styles.grid}>
        {plans.map((p, i) => {
          const base = prices?.[p.name.toLowerCase()];
          const amount = base == null ? null : annual ? Math.round(base * (1 - discount)) : base;
          return (
          <div key={p.name} data-animate data-delay={`${0.25 + i * 0.12}`} className={`${styles.card} ${p.featured ? styles.featured : ""}`}>
            <div className={styles.badge} style={p.badgeStyle}>{p.badge}</div>
            <div className={styles.planName}>{p.name}</div>
            <p className={styles.planDesc}>{p.desc}</p>
            <div className={styles.price}>
              {amount == null ? (
                <span className={`${styles.amount} ${styles.contactPrice}`}>Contact Sales</span>
              ) : (
                <div>
                  <span className={styles.amount}>{fmt(amount)}</span>
                  <span className={styles.period}> /month</span>
                  {annual && <div className={styles.billed}>Billed {fmt(amount * 12)} yearly</div>}
                </div>
              )}
            </div>
            <ul className={styles.features}>
              {p.features.map((f) => {
                const label = typeof f === "string" ? f : f.label;
                const soon  = typeof f === "object" && f.soon;
                return (
                  <li key={label}>
                    <span className={styles.checkIcon}><Check size={10} strokeWidth={3} /></span>
                    <span>{label}</span>
                    {soon && <span className={styles.soonBadge}>Coming Soon</span>}
                  </li>
                );
              })}
            </ul>
            <a href={p.ctaHref} target="_blank" rel="noopener noreferrer" className={`${p.ctaClass} ${styles.planBtn}`}>{amount == null ? p.cta : "Get Started"}</a>
          </div>
          );
        })}
      </div>
    </section>
  );
}
