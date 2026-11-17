import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ContactForm from "../../components/ContactForm";
import styles from "./contact.module.css";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Contact Salon Central",
  description:
    "Talk to the Salon Central team on WhatsApp or email. Ask about pricing, book a demo, or get help setting up your salon or clinic.",
  path: "/contact",
});

const WHATSAPP = "https://wa.me/923029646928";

const ways = [
  { title: "WhatsApp", text: "+92 302 9646928", sub: "Fastest way to reach us", href: WHATSAPP },
  { title: "Sales email", text: "support@saloncentral.xyz", sub: "Pricing, demos, plans", href: "mailto:support@saloncentral.xyz" },
  { title: "Privacy", text: "privacy@saloncentral.xyz", sub: "Data and privacy requests", href: "mailto:privacy@saloncentral.xyz" },
];

const faqs = [
  { q: "How much does Salon Central cost?", a: "Pricing depends on the size of your salon or clinic. Send us a message and we will recommend a plan." },
  { q: "Can I see a demo first?", a: "Yes. Choose “Book a demo” in the form and we will walk you through the software on WhatsApp or a call." },
  { q: "Can you move my existing client list over?", a: "Yes. Send us your client list (Excel or CSV) and we will help you import it." },
  { q: "I'm already a customer and need help.", a: "Choose “Support” in the form or message us on WhatsApp with your salon name." },
];

export default function ContactPage() {
  return (
    <>
      <Navbar forceSolid />
      <main className={styles.page}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Contact</span>
          <h1>Let&apos;s talk about your salon</h1>
          <p>Questions about pricing, a demo, or getting set up? Tell us a little and we will get back to you.</p>
        </section>

        <section className={styles.grid}>
          <ContactForm />

          <aside className={styles.side}>
            {ways.map((w) => (
              <a key={w.title} href={w.href} className={styles.way} {...(w.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                <span className={styles.wayTitle}>{w.title}</span>
                <span className={styles.wayText}>{w.text}</span>
                <span className={styles.waySub}>{w.sub}</span>
              </a>
            ))}
            <div className={styles.way}>
              <span className={styles.wayTitle}>Based in</span>
              <span className={styles.wayText}>Lahore, Pakistan</span>
              <span className={styles.waySub}>English and Urdu spoken</span>
            </div>
          </aside>
        </section>

        <section className={styles.faq}>
          <h2>Common questions</h2>
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
