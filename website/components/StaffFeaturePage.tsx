"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, UserCog, Users, Scissors,
  BarChart2, Star, Shield, CheckCircle2, ChevronDown,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DemoModal from "./DemoModal";
import styles from "./SchedulingFeaturePage.module.css";
import { siteConfig } from "@/lib/seo";

/* ─── hero staff card ────────────────────────────────────── */
function HeroStaff() {
  const team = [
    { initials: "ZK", name: "Zara K.",  role: "Senior Stylist", rev: "PKR 1,86,000", appts: 54, color: "#7c3aed", roleBg: "#ede9fe", roleC: "#7c3aed" },
    { initials: "NM", name: "Nida M.",  role: "Nail Artist",    rev: "PKR 98,400",   appts: 36, color: "#db2777", roleBg: "#fdf2f8", roleC: "#db2777" },
    { initials: "SA", name: "Sara A.",  role: "Junior Stylist", rev: "PKR 64,200",   appts: 28, color: "#d97706", roleBg: "#fffbeb", roleC: "#d97706" },
  ];
  return (
    <div className={styles.heroCard} aria-label="Salon Central staff management preview">
      <div className={styles.heroCardTop}>
        <div>
          <span>Staff</span>
          <strong>3 Active</strong>
        </div>
        <button type="button">Add Staff</button>
      </div>
      {team.map((s) => (
        <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "#f8f7ff", border: "1px solid #ede9fe", marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: s.color + "22", color: s.color, fontWeight: 900, fontSize: "0.78rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {s.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#17112a" }}>{s.name}</div>
            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "0.64rem", fontWeight: 900, background: s.roleBg, color: s.roleC }}>{s.role}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 900, color: s.color }}>{s.rev}</div>
            <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>{s.appts} appts</div>
          </div>
        </div>
      ))}
      <div className={styles.floatingNote} style={{ right: -20, top: 180 }}>
        <BarChart2 size={14} />
        <span>Live performance stats</span>
      </div>
    </div>
  );
}

/* ─── feature visuals ────────────────────────────────────── */
function RolesPanel() {
  const roles = [
    { role: "Owner",          c: "#7c3aed", bg: "#ede9fe" },
    { role: "Manager",        c: "#0369a1", bg: "#e0f2fe" },
    { role: "Senior Stylist", c: "#059669", bg: "#ecfdf5" },
    { role: "Junior Stylist", c: "#d97706", bg: "#fffbeb" },
    { role: "Receptionist",   c: "#db2777", bg: "#fdf2f8" },
    { role: "Trainee",        c: "#6b7280", bg: "#f9fafb" },
  ];
  return (
    <div className={styles.blockPanel}>
      <div className={styles.blockHeader} style={{ marginBottom: 14 }}>
        <Shield size={16} />
        <span style={{ fontWeight: 900, color: "#17112a" }}>6 staff roles</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {roles.map((r) => (
          <div key={r.role} style={{ padding: "10px 12px", borderRadius: 10, background: r.bg, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.c, flexShrink: 0 }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 900, color: r.c }}>{r.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceAssignPanel() {
  const services = [
    { name: "Hair Color",       price: "PKR 4,500", assigned: true  },
    { name: "Keratin Treatment",price: "PKR 6,000", assigned: true  },
    { name: "Bridal Makeup",    price: "PKR 18,000",assigned: true  },
    { name: "Nail Extension",   price: "PKR 2,800", assigned: false },
    { name: "Hydra Facial",     price: "PKR 3,200", assigned: false },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#7c3aed22", color: "#7c3aed", fontWeight: 900, fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>ZK</div>
        <div>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#17112a" }}>Zara K.</div>
          <div style={{ fontSize: "0.68rem", color: "#9ca3af" }}>Assign services</div>
        </div>
      </div>
      {services.map((s) => (
        <div key={s.name} className={styles.staffRow}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: s.assigned ? "#7c3aed" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {s.assigned && <CheckCircle2 size={10} color="#fff" />}
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: "0.84rem", color: "#17112a" }}>{s.name}</strong>
          </div>
          <em style={{ color: "#7c3aed", fontStyle: "normal", fontWeight: 900, fontSize: "0.75rem" }}>{s.price}</em>
        </div>
      ))}
    </div>
  );
}

function PerformancePanel() {
  const staff = [
    { name: "Zara K.",  rev: "PKR 1,86,000", appts: 54, pct: 100, color: "#7c3aed" },
    { name: "Nida M.",  rev: "PKR 98,400",   appts: 36, pct: 53,  color: "#db2777" },
    { name: "Sara A.",  rev: "PKR 64,200",   appts: 28, pct: 35,  color: "#d97706" },
  ];
  return (
    <div className={styles.staffPanel}>
      <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#17112a", marginBottom: 14 }}>Revenue by stylist: This month</div>
      {staff.map((s) => (
        <div key={s.name} className={styles.staffRow}>
          <div className={styles.avatarSmall} style={{ background: s.color + "22", color: s.color, fontSize: "0.6rem", fontWeight: 900 }}>
            {s.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <strong style={{ fontSize: "0.84rem", color: "#17112a" }}>{s.name}</strong>
              <span style={{ fontSize: "0.8rem", fontWeight: 900, color: s.color }}>{s.rev}</span>
            </div>
            <div style={{ height: 5, background: "#f0f0f8", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: "0.65rem", color: "#9ca3af", marginTop: 2 }}>{s.appts} appointments</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StaffDetailPanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div className={styles.clientStrip}>
        <div className={styles.avatar} style={{ background: "#7c3aed22", color: "#7c3aed", fontSize: "0.85rem" }}>ZK</div>
        <div>
          <strong style={{ color: "#17112a", fontSize: "0.95rem" }}>Zara Khan</strong>
          <span>Senior Stylist · Active</span>
        </div>
      </div>
      {[
        { label: "Total Appointments", value: "54" },
        { label: "Completed",          value: "48" },
        { label: "Revenue",            value: "PKR 1,86,000", purple: true },
        { label: "Phone",              value: "+92 300 1234567" },
      ].map((row) => (
        <div key={row.label} className={styles.checkoutBody}>
          <div>
            <span>{row.label}</span>
            <strong style={{ color: (row as { purple?: boolean }).purple ? "#7c3aed" : "#17112a" }}>{row.value}</strong>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
        {["Hair Color", "Keratin", "Bridal"].map((sp) => (
          <span key={sp} style={{ padding: "3px 10px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 900, background: "#ede9fe", color: "#7c3aed" }}>{sp}</span>
        ))}
      </div>
    </div>
  );
}

function PlanLimitPanel() {
  return (
    <div className={styles.blockPanel}>
      <div className={styles.blockHeader} style={{ marginBottom: 14 }}>
        <Users size={16} />
        <span style={{ fontWeight: 900, color: "#17112a" }}>Team size by plan</span>
      </div>
      <div className={styles.blockArea}>
        <div style={{ padding: 14, borderRadius: 14, background: "#f5f3ff", border: "1px solid #ede9fe" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "#9ca3af", marginBottom: 2 }}>SALON CENTRAL FREE</div>
          <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#17112a" }}>Up to 5 staff members</div>
        </div>
        <div style={{ padding: 14, borderRadius: 14, background: "#7c3aed", border: "none" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "rgba(255,255,255,.65)", marginBottom: 2 }}>SALON CENTRAL PRO & PREMIUM</div>
          <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#fff" }}>Unlimited staff members</div>
        </div>
        <div style={{ padding: 12, borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "0.74rem", fontWeight: 800, color: "#166534" }}>
          ✓ Each staff member links to their own appointments, services, and revenue stats
        </div>
      </div>
    </div>
  );
}

/* ─── feature rows ───────────────────────────────────────── */
const rows = [
  {
    eyebrow: "Staff profiles",
    title: "Staff management software with one profile per team member",
    body: "Create a profile for each team member with their name, phone, and role. Specialties are populated automatically from the services you assign them. Every profile gets a colour-coded role badge so the team is instantly recognisable across the dashboard.",
    visual: <StaffDetailPanel />,
  },
  {
    eyebrow: "6 staff roles",
    title: "A staff management system for salon roles",
    body: "Choose from Owner, Manager, Senior Stylist, Junior Stylist, Receptionist, and Trainee. Each role has a distinct colour badge that appears on appointment cards, calendars, and performance reports, so your front desk always knows who is doing what.",
    visual: <RolesPanel />,
  },
  {
    eyebrow: "Service assignment",
    title: "Control which services each staff member can perform",
    body: "Open any staff profile and tick the services they are trained for. Only those services appear when booking an appointment for that stylist. Price, duration, and service name all carry through automatically. No repeated data entry.",
    visual: <ServiceAssignPanel />,
  },
  {
    eyebrow: "Performance stats",
    title: "Staff managing software with performance stats",
    body: "Every staff card shows their total appointments and revenue earned in the current period. The performance panel ranks all active team members by revenue with a proportional bar, so you can spot top performers and who needs support at a glance.",
    visual: <PerformancePanel />,
  },
  {
    eyebrow: "Plan limits",
    title: "Start free, scale your team as you grow",
    body: "The Free plan supports up to 5 staff members. Upgrade to Salon Central Pro or Premium for unlimited team size. Adding a staff member takes under 30 seconds: name, phone, role, and services, then they are live in the system immediately.",
    visual: <PlanLimitPanel />,
  },
];

const faqs = [
  {
    q: "What is staff management software?",
    a: "Staff management software helps beauty salons, hair salons, spas, and barber shops manage employees, schedules, attendance, commissions, and performance from one platform. Salon Central's staff management system simplifies day-to-day operations by keeping all employee information organized.",
  },
  {
    q: "How does Salon Central's staff management system work?",
    a: "Salon Central's staff management system lets you create employee profiles, assign services, manage work schedules, monitor attendance, calculate commissions, and track performance. It's an all-in-one staff managing software built specifically for salon businesses.",
  },
  {
    q: "Can I manage employee schedules and shifts?",
    a: "Yes. Salon Central's staff scheduling software allows you to assign shifts, manage employee availability, and organize daily work schedules from one calendar. This helps avoid scheduling conflicts and improves team productivity.",
  },
  {
    q: "Can I track staff attendance?",
    a: "Absolutely. Salon Central's employee attendance software lets you monitor employee attendance, working hours, and shift history. This information can also be used for payroll and performance reporting.",
  },
  {
    q: "Can I assign appointments to specific staff members?",
    a: "Yes. Every appointment can be assigned to a specific stylist, beautician, therapist, or barber. Salon Central's salon staff management software automatically updates each employee's schedule, making appointment management simple and efficient.",
  },
  {
    q: "Can I monitor staff performance?",
    a: "Yes. Salon Central's employee management software provides detailed reports on services completed, sales generated, commissions earned, appointments handled, and customer activity. These insights help you reward top performers and improve team productivity.",
  },
  {
    q: "Can I manage commissions and payroll for my staff?",
    a: "Yes. Salon Central's salon employee management system integrates with payroll and commission management. Staff commissions are automatically calculated based on completed services and product sales, reducing manual work and payroll errors.",
  },
  {
    q: "Is the staff management system suitable for multiple branches?",
    a: "Yes. Whether you manage one salon or multiple locations, Salon Central's staff management software allows you to organize employees, schedules, attendance, and performance across all branches from a centralized dashboard.",
  },
  {
    q: "Can I store employee information securely?",
    a: "Yes. Salon Central's employee management software securely stores staff profiles, contact details, employment information, commission structures, attendance records, and work history. Everything is accessible from one cloud-based dashboard whenever you need it.",
  },
  {
    q: "Why choose Salon Central for staff management?",
    a: "Salon Central combines a powerful staff management system, staff management software, staff managing software, employee management software, staff scheduling software, employee attendance software, payroll, appointment scheduling, salon POS, client management, inventory, invoicing, revenue reporting, and WhatsApp automation into one complete salon management platform. It's designed to help beauty salons, hair salons, spas, nail salons, and barber shops improve staff productivity, simplify operations, and grow their business.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{ maxWidth: 860, margin: "0 auto", padding: "84px 5%" }}
      aria-label="Staff management FAQs"
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          FAQs
        </span>
        <h2 style={{ marginTop: 8 }}>Salon Staff Management Software: Frequently Asked Questions</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={item.q}
              style={{
                border: "1px solid #e8e8f0",
                borderRadius: 14,
                background: "#fff",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "18px 22px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#17112a",
                }}
              >
                {item.q}
                <ChevronDown
                  size={18}
                  color="#7c3aed"
                  style={{ flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}
                />
              </button>
              {isOpen && (
                <div style={{ padding: "0 22px 20px", fontSize: "0.92rem", lineHeight: 1.65, color: "#4b4459" }}>
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

/* ─── page ───────────────────────────────────────────────── */
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
    { "@type": "ListItem", position: 2, name: "Features", item: `${siteConfig.url}/#features` },
    { "@type": "ListItem", position: 3, name: "Staff Management", item: `${siteConfig.url}/features/staff-management` },
  ],
};

export default function StaffFeaturePage() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Navbar />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <div className={styles.kicker}>
                <UserCog size={16} />
                Staff management software
              </div>
              <h1>Staff management system for salon teams</h1>
              <p>
                Salon Central is staff managing software for beauty salons, hair salons, and spas. Give every team member a profile with their role, specialties, assigned services, and live performance stats, so your salon runs with clarity from the moment the doors open.
              </p>
              <div className={styles.heroActions}>
                <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
                  Get started <ArrowRight size={17} />
                </button>
                <Link href="/pricing" className={styles.secondaryCta}>View pricing</Link>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.imageChip}>
                <Image src="/salon-central-logo.png" alt="Salon Central logo" width={96} height={96} />
                <span>Salon Central Staff</span>
              </div>
              <HeroStaff />
            </div>
          </div>
          <div className={styles.wave} aria-hidden="true" />
        </section>

        <section className={styles.featureStack}>
          {rows.map((row, i) => (
            <article key={row.title} className={`${styles.featureRow} ${i % 2 ? styles.flip : ""}`}>
              <div className={styles.rowCopy}>
                <span>{row.eyebrow}</span>
                <h2>{row.title}</h2>
                <p>{row.body}</p>
              </div>
              <div className={styles.rowVisual}>{row.visual}</div>
            </article>
          ))}
        </section>

        <section className={styles.ctaBand}>
          <div>
            <span>Free plan includes up to 5 staff</span>
            <h2>Run your team with salon staff management software</h2>
          </div>
          <div className={styles.ctaActions}>
            <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
              Get started <ArrowRight size={17} />
            </button>
            <Link href="/pricing" className={styles.secondaryDark}>View pricing</Link>
          </div>
        </section>

        <section className={styles.miniStats} aria-label="Staff management advantages">
          <div>
            <Shield size={19} />
            <strong>Staff roles</strong>
            <span>Owner, Manager, Senior Stylist, Junior Stylist, Receptionist, Trainee.</span>
          </div>
          <div>
            <Scissors size={19} />
            <strong>Service assignment</strong>
            <span>Control exactly which services each team member can perform.</span>
          </div>
          <div>
            <BarChart2 size={19} />
            <strong>Team performance</strong>
            <span>Live appointments count and revenue per stylist, updated in real time.</span>
          </div>
          <div>
            <Star size={19} />
            <strong>Unlimited on Pro</strong>
            <span>No team size cap on Salon Central Pro and Premium plans.</span>
          </div>
        </section>

        <FaqSection />
      </main>
      <Footer />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
