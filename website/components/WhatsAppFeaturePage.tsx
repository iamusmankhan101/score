"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  Bell,
  Clock,
  Star,
  Package,
  FileText,
  Send,
  ChevronDown,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DemoModal from "./DemoModal";
import styles from "./SchedulingFeaturePage.module.css";
import { siteConfig } from "@/lib/seo";

/* ─── hero WhatsApp card ─────────────────────────────────── */
function HeroWhatsApp() {
  return (
    <div className={styles.heroCard} aria-label="Salon Central WhatsApp automation preview">
      {/* header */}
      <div className={styles.heroCardTop}>
        <div>
          <span>WhatsApp Automation</span>
          <strong>Glow Studio</strong>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: 999,
            background: "#dcfce7",
            color: "#166534",
            fontSize: "0.72rem",
            fontWeight: 900,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
          Live
        </div>
      </div>

      {/* messages */}
      <div style={{ display: "grid", gap: 10 }}>
        {[
          {
            tag: "Booking confirmation",
            tagColor: "#166534",
            tagBg: "#dcfce7",
            msg: "Hi Sana, your Hair Color appointment at Glow Studio is confirmed for Wed 28 May at 2:00 PM. See you soon! 💜",
            time: "Just now",
          },
          {
            tag: "24hr reminder",
            tagColor: "#1e40af",
            tagBg: "#dbeafe",
            msg: "Hi Fatima, reminder: your Hydra Facial is tomorrow at 11:30 AM at Glow Studio. Reply C to confirm or R to reschedule.",
            time: "Scheduled",
          },
          {
            tag: "Follow-up",
            tagColor: "#6b21a8",
            tagBg: "#ede9fe",
            msg: "Hi Maria, thank you for visiting Glow Studio! We hope you loved your Bridal Trial. We would love to see you again 💜",
            time: "After visit",
          },
        ].map((m) => (
          <div
            key={m.tag}
            style={{
              padding: "12px 14px",
              borderRadius: 16,
              background: "#f8f7ff",
              border: "1px solid #ede9fe",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span
                style={{
                  padding: "2px 9px",
                  borderRadius: 999,
                  fontSize: "0.66rem",
                  fontWeight: 900,
                  background: m.tagBg,
                  color: m.tagColor,
                }}
              >
                {m.tag}
              </span>
              <span style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 700 }}>{m.time}</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#312a3d", lineHeight: 1.5, margin: 0 }}>{m.msg}</p>
          </div>
        ))}
      </div>

      <div className={styles.floatingNote} style={{ right: -20, top: 200 }}>
        <CheckCircle2 size={15} />
        <span>3 automations active</span>
      </div>
    </div>
  );
}

/* ─── feature row visuals ───────────────────────────────── */
function ConfirmationPanel() {
  return (
    <div className={styles.messagesPanel}>
      <div className={styles.messageHeader}>
        <MessageCircle size={18} />
        <span>Glow Studio · Booking confirmation</span>
      </div>
      <div className={styles.chatBubble}>
        Hi Sana, your <strong>Hair Color</strong> appointment at Glow Studio is confirmed
        for <strong>Wed 28 May at 2:00 PM</strong>. We look forward to seeing you! 💜
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 12px",
          borderRadius: 10,
          background: "#f0fdf4",
          fontSize: "0.72rem",
          fontWeight: 900,
          color: "#166534",
        }}
      >
        <CheckCircle2 size={13} />
        Sent automatically when appointment is booked
      </div>
    </div>
  );
}

function ReminderPanel() {
  return (
    <div className={styles.blockPanel}>
      <div className={styles.blockHeader}>
        <Clock size={17} />
        <span style={{ fontWeight: 900, color: "#17112a" }}>Reminder timing</span>
      </div>
      <div className={styles.blockArea}>
        <div className={styles.openSlot}>
          <div style={{ fontWeight: 900, fontSize: "0.88rem" }}>24 hours before</div>
          <span>Default reminder window: configurable in settings</span>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 14,
            background: "#ede9fe",
            color: "#4c1d95",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: "0.88rem", marginBottom: 4 }}>Message preview</div>
          <span style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
            Hi {"{name}"}, reminder: your {"{service}"} is tomorrow at {"{time}"} at {"{salon_name}"}.
            Reply C to confirm or R to reschedule.
          </span>
        </div>
      </div>
    </div>
  );
}

function FollowUpPanel() {
  return (
    <div className={styles.messagesPanel}>
      <div className={styles.messageHeader}>
        <Star size={18} />
        <span>Glow Studio · Post-visit follow-up</span>
      </div>
      <div className={styles.chatBubble}>
        Hi Maria, thank you for visiting <strong>Glow Studio</strong>! We hope you loved your{" "}
        <strong>Bridal Trial</strong>. We would love to see you again soon 💜
      </div>
      <div className={styles.chatBubbleMuted}>
        ⭐⭐⭐⭐⭐ How was your experience?
      </div>
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 900,
          color: "#6b21a8",
          background: "#f5f3ff",
          padding: "8px 12px",
          borderRadius: 10,
        }}
      >
        Sent automatically when appointment is marked completed
      </div>
    </div>
  );
}

function TemplatePanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          background: "#f5f3ff",
          border: "1px solid #ede9fe",
          marginBottom: 4,
        }}
      >
        <div style={{ fontSize: "0.7rem", fontWeight: 900, color: "#7c3aed", marginBottom: 8 }}>
          REMINDER TEMPLATE
        </div>
        <div style={{ fontSize: "0.8rem", color: "#312a3d", lineHeight: 1.6 }}>
          Hi{" "}
          <span style={{ background: "#ddd6fe", borderRadius: 6, padding: "1px 6px", fontWeight: 900 }}>
            {"{{name}}"}
          </span>
          , reminder: your{" "}
          <span style={{ background: "#ddd6fe", borderRadius: 6, padding: "1px 6px", fontWeight: 900 }}>
            {"{{service}}"}
          </span>{" "}
          is on{" "}
          <span style={{ background: "#ddd6fe", borderRadius: 6, padding: "1px 6px", fontWeight: 900 }}>
            {"{{date}}"}
          </span>{" "}
          at{" "}
          <span style={{ background: "#ddd6fe", borderRadius: 6, padding: "1px 6px", fontWeight: 900 }}>
            {"{{time}}"}
          </span>
          .
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["{{name}}", "{{service}}", "{{date}}", "{{time}}", "{{salon_name}}"].map((v) => (
          <span
            key={v}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: "#ddd6fe",
              color: "#5b21b6",
              fontSize: "0.7rem",
              fontWeight: 900,
            }}
          >
            {v}
          </span>
        ))}
      </div>
      <div className={styles.checkoutBody}>
        <div>
          <span>Templates available</span>
          <strong>Confirmation, Reminder, Follow-up, Low Stock</strong>
        </div>
      </div>
    </div>
  );
}

function LowStockPanel() {
  return (
    <div className={styles.messagesPanel}>
      <div className={styles.messageHeader}>
        <Package size={18} />
        <span>Glow Studio · Low stock alert</span>
      </div>
      <div className={styles.chatBubble}>
        ⚠️ <strong>Low Stock Alert</strong> from Glow Studio: 2 item(s) running low:
        Loreal Hair Color (2 left), Skin Serum SPF50 (1 left). Please restock soon.
      </div>
      <div
        style={{
          display: "grid",
          gap: 6,
          padding: "10px 12px",
          borderRadius: 10,
          background: "#fff7ed",
          fontSize: "0.74rem",
          fontWeight: 800,
          color: "#92400e",
        }}
      >
        <div>Sent to salon owner phone once per day</div>
        <div style={{ color: "#9ca3af" }}>Triggered when stock falls below minimum level</div>
      </div>
    </div>
  );
}

function MessageLogPanel() {
  const logs = [
    { type: "Confirmation", client: "Sana Nawaz", time: "Today 2:14 PM", ok: true },
    { type: "Reminder", client: "Fatima Ali", time: "Today 10:00 AM", ok: true },
    { type: "Follow-up", client: "Maria Khan", time: "Yesterday 6:30 PM", ok: true },
    { type: "Reminder", client: "Aena Malik", time: "Yesterday 9:00 AM", ok: false },
  ];
  return (
    <div className={styles.staffPanel}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
          fontSize: "0.78rem",
          fontWeight: 900,
          color: "#17112a",
        }}
      >
        <span>Message history</span>
        <span style={{ color: "#7c3aed" }}>96% success rate</span>
      </div>
      {logs.map((l, i) => (
        <div key={i} className={styles.staffRow}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: l.ok ? "#16a34a" : "#dc2626",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: "0.85rem", color: "#17112a" }}>{l.client}</strong>
            <span style={{ fontSize: "0.7rem" }}>{l.time}</span>
          </div>
          <em
            style={{
              fontStyle: "normal",
              fontSize: "0.7rem",
              fontWeight: 900,
              padding: "3px 8px",
              borderRadius: 999,
              background: l.type === "Confirmation" ? "#dcfce7" : l.type === "Reminder" ? "#dbeafe" : "#ede9fe",
              color: l.type === "Confirmation" ? "#166534" : l.type === "Reminder" ? "#1e40af" : "#6b21a8",
            }}
          >
            {l.type}
          </em>
        </div>
      ))}
    </div>
  );
}

function ManualSendPanel() {
  return (
    <div className={styles.checkoutPanel}>
      <div className={styles.clientStrip}>
        <div className={styles.avatar}>FK</div>
        <div>
          <strong style={{ color: "#17112a", fontSize: "0.92rem" }}>Fatima Khan</strong>
          <span>+92 300 1234567</span>
        </div>
      </div>
      {[
        { label: "Message type", value: "Reminder" },
        { label: "Service", value: "Hydra Facial" },
        { label: "Date", value: "Sat 31 May" },
        { label: "Time", value: "3:00 PM" },
      ].map((row) => (
        <div key={row.label} className={styles.checkoutBody}>
          <div>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        </div>
      ))}
      <button type="button">Send via WhatsApp</button>
    </div>
  );
}

/* ─── feature rows ──────────────────────────────────────── */
const rows = [
  {
    eyebrow: "Booking confirmation",
    title: "Salon WhatsApp automated messages for every new booking",
    body: "As soon as a booking is created, by staff or via online booking, Salon Central queues a WhatsApp confirmation with the client name, service, date, time, and salon name. No manual step needed.",
    visual: <ConfirmationPanel />,
  },
  {
    eyebrow: "Appointment reminders",
    title: "WhatsApp automated reminders for salon appointments",
    body: "Salon Central's scheduler runs every 60 seconds and sends each client a WhatsApp reminder within your configured window. Only appointments with booked or confirmed status receive reminders. Cancelled and completed ones are skipped.",
    visual: <ReminderPanel />,
  },
  {
    eyebrow: "Post-visit follow-up",
    title: "Salon WhatsApp marketing after every completed appointment",
    body: "Mark an appointment as completed and Salon Central queues a personalised follow-up message. It thanks the client by name, mentions the service, and keeps your salon top-of-mind for the next visit, all without lifting a finger.",
    visual: <FollowUpPanel />,
  },
  {
    eyebrow: "Custom templates",
    title: "Custom WhatsApp message templates for salons",
    body: "Open the template editor and write messages exactly how you want them. Click {{name}}, {{service}}, {{date}}, {{time}}, or {{salon_name}} chips to insert variables. Preview with real client data before saving.",
    visual: <TemplatePanel />,
  },
  {
    eyebrow: "Low stock alerts",
    title: "Get a WhatsApp alert when products run low",
    body: "When any product drops to or below its minimum stock level, Salon Central sends a single daily low-stock alert directly to the salon owner's WhatsApp, listing every item and quantity left. No checking required.",
    visual: <LowStockPanel />,
  },
  {
    eyebrow: "Message history",
    title: "Track every WhatsApp automated message in one log",
    body: "Every confirmation, reminder, follow-up, and alert is logged with client name, phone, message type, timestamp, and send status. Filter by type, check success rate, and spot failed messages at a glance from the dashboard.",
    visual: <MessageLogPanel />,
  },
  {
    eyebrow: "Manual sends",
    title: "WhatsApp marketing for salons, campaigns, and promotions",
    body: "Select a client, choose a message type, fill in the service and time, and send directly via the WhatsApp Business API, or open WhatsApp Web for personal account sending. Useful for follow-ups, custom promotions, rebooking campaigns, and rescheduling.",
    visual: <ManualSendPanel />,
  },
];

const faqs = [
  {
    q: "What are WhatsApp automated reminders for salons?",
    a: "WhatsApp automated reminders help beauty salons, hair salons, spas, and barber shops automatically send appointment confirmations, reminders, follow-ups, and notifications to clients. With Salon Central, you can reduce no-shows and improve customer communication without sending messages manually.",
  },
  {
    q: "How does Salon Central's WhatsApp reminder system work?",
    a: "Salon Central automatically sends WhatsApp booking confirmations, appointment reminders, cancellation updates, and post-visit follow-ups based on your salon schedule. Our salon WhatsApp automated messages are triggered at the right time, helping your team save time while keeping clients informed.",
  },
  {
    q: "Can Salon Central send automated WhatsApp appointment reminders?",
    a: "Yes. Salon Central's WhatsApp automated reminders notify clients before their appointments, helping reduce missed bookings and improving attendance. You can customize reminder timings to match your salon's workflow.",
  },
  {
    q: "What types of WhatsApp messages can Salon Central send?",
    a: "Our salon WhatsApp automated messages include appointment confirmations, appointment reminders, rescheduled appointment notifications, cancellation updates, post-visit thank-you messages, birthday wishes, loyalty rewards, and other customer notifications to improve client engagement.",
  },
  {
    q: "Can I use WhatsApp marketing for salons with Salon Central?",
    a: "Yes. WhatsApp marketing for salons allows you to reconnect with existing clients by sending personalized promotions, seasonal offers, loyalty rewards, and service recommendations. Salon Central helps you engage customers responsibly while supporting automated customer communication.",
  },
  {
    q: "How does salon WhatsApp marketing help grow my business?",
    a: "Salon WhatsApp marketing helps increase repeat visits by keeping clients engaged with personalized offers, loyalty rewards, appointment reminders, and important updates. Combined with Salon Central's WhatsApp automated reminders, it helps improve customer retention and salon revenue.",
  },
  {
    q: "Can WhatsApp reminders reduce appointment no-shows?",
    a: "Absolutely. WhatsApp automated reminders ensure clients receive timely notifications before their appointments, making them less likely to forget or miss bookings. This helps beauty salons, hair salons, and spas reduce no-shows and improve daily scheduling.",
  },
  {
    q: "Are WhatsApp messages sent automatically after every booking?",
    a: "Yes. Every appointment created in Salon Central can automatically trigger salon WhatsApp automated messages, including booking confirmations, reminders, and follow-up messages, without requiring any manual effort from your staff.",
  },
  {
    q: "Can I personalize WhatsApp messages for my salon?",
    a: "Yes. Salon Central allows you to personalize WhatsApp automated reminders with your salon name, client name, appointment details, and other information. This creates a more professional and personalized experience for every customer.",
  },
  {
    q: "Why choose Salon Central for WhatsApp automation in Pakistan?",
    a: "Salon Central combines WhatsApp automated reminders, salon WhatsApp marketing, appointment scheduling, salon POS, client management, inventory, invoicing, payroll, and loyalty programs into one platform. If you're looking for an all-in-one salon management software with powerful WhatsApp automation in Pakistan, Salon Central helps you save time, reduce no-shows, and strengthen customer relationships.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{ maxWidth: 860, margin: "0 auto", padding: "84px 5%" }}
      aria-label="WhatsApp automation FAQs"
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          FAQs
        </span>
        <h2 style={{ marginTop: 8 }}>WhatsApp Reminders &amp; Automation: Frequently Asked Questions</h2>
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

/* ─── page ──────────────────────────────────────────────── */
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
    { "@type": "ListItem", position: 2, name: "Features", item: `${siteConfig.url}/#features` },
    { "@type": "ListItem", position: 3, name: "WhatsApp Reminders", item: `${siteConfig.url}/features/whatsapp-reminders` },
  ],
};

export default function WhatsAppFeaturePage() {
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

        {/* ── hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <div className={styles.kicker}>
                <MessageCircle size={16} />
                WhatsApp marketing for salons
              </div>
              <h1>Salon WhatsApp marketing and automated reminders</h1>
              <p>
                Salon Central sends salon WhatsApp automated messages for booking confirmations, appointment reminders, post-visit follow-ups, promotions, birthday messages, and low-stock alerts, all triggered automatically so your team handles zero manual messages.
              </p>
              <div className={styles.heroActions}>
                <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
                  Get started <ArrowRight size={17} />
                </button>
                <Link href="/pricing" className={styles.secondaryCta}>
                  View pricing
                </Link>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.imageChip}>
                <Image src="/salon-central-logo.png" alt="Salon Central logo" width={96} height={96} />
                <span>Salon Central OS</span>
              </div>
              <HeroWhatsApp />
            </div>
          </div>
          <div className={styles.wave} aria-hidden="true" />
        </section>

        {/* ── feature rows ── */}
        <section className={styles.featureStack}>
          {rows.map((row, index) => (
            <article
              key={row.title}
              className={`${styles.featureRow} ${index % 2 ? styles.flip : ""}`}
            >
              <div className={styles.rowCopy}>
                <span>{row.eyebrow}</span>
                <h2>{row.title}</h2>
                <p>{row.body}</p>
              </div>
              <div className={styles.rowVisual}>{row.visual}</div>
            </article>
          ))}
        </section>

        {/* ── cta band ── */}
        <section className={styles.ctaBand}>
          <div>
            <span>Confirmations, reminders, follow-ups, promotions, and alerts</span>
            <h2>Let salon WhatsApp marketing work 24/7</h2>
          </div>
          <div className={styles.ctaActions}>
            <button type="button" onClick={() => setDemoOpen(true)} className={styles.primaryCta}>
              Get started <ArrowRight size={17} />
            </button>
            <Link href="/pricing" className={styles.secondaryDark}>
              View pricing
            </Link>
          </div>
        </section>

        {/* ── mini stats ── */}
        <section className={styles.miniStats} aria-label="WhatsApp automation advantages">
          <div>
            <CheckCircle2 size={19} />
            <strong>Booking confirmations</strong>
            <span>Sent the moment a booking is created: no manual step from your team.</span>
          </div>
          <div>
            <Bell size={19} />
            <strong>Automated reminders</strong>
            <span>Configurable reminder window keeps no-show rates low without any effort.</span>
          </div>
          <div>
            <Send size={19} />
            <strong>WhatsApp follow-ups</strong>
            <span>Thank clients and invite them back automatically after every visit.</span>
          </div>
          <div>
            <FileText size={19} />
            <strong>Full message log</strong>
            <span>Every message tracked with client, type, timestamp, and delivery status.</span>
          </div>
        </section>

        <FaqSection />
      </main>
      <Footer />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}
