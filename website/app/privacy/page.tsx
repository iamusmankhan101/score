import LegalLayout from "../../components/LegalLayout";
import styles from "../legal.module.css";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What personal information Salon Central collects (such as names, email addresses and phone numbers), why we collect it, how we use and protect it, who we share it with, and your rights.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalLayout>
      <div className={styles.doc}>
        <h1>Privacy Policy</h1>
        <span className={styles.updated}>Last updated: 11 October 2026</span>

        <div className={styles.summary}>
          <p>
            <strong>The short version:</strong> we collect the information needed to run Salon Central: mainly names,
            email addresses and phone numbers, plus the business records salons keep in the software. We use it to
            provide the service, send the messages you ask us to send, keep accounts secure and handle billing. We do
            not sell personal information, we do not use advertising or tracking cookies, and a salon&apos;s client
            data belongs to that salon.
          </p>
        </div>

        <h2>1. Who we are and what this policy covers</h2>
        <p>
          Salon Central (&ldquo;<strong>we</strong>&rdquo;, &ldquo;<strong>us</strong>&rdquo;, &ldquo;
          <strong>our</strong>&rdquo;) provides salon and clinic management software, based in Lahore, Pakistan. This
          policy covers:
        </p>
        <ul>
          <li>our website, <a href="https://www.saloncentral.xyz">saloncentral.xyz</a>;</li>
          <li>
            the Salon Central app at <a href="https://app.saloncentral.xyz">app.saloncentral.xyz</a>, including each
            salon&apos;s online booking page, client app and digital loyalty card;
          </li>
          <li>the Salon Central WordPress plugin and website booking embed.</li>
        </ul>
        <p>It applies to three groups of people:</p>
        <ul>
          <li>
            <strong>Salon owners and their staff</strong>, who have accounts in Salon Central;
          </li>
          <li>
            <strong>Salon clients</strong>, whose details a salon keeps in Salon Central, or who book online, use a
            salon&apos;s client app or loyalty card;
          </li>
          <li>
            <strong>Website visitors</strong>, including anyone who requests a demo.
          </li>
        </ul>

        <h2>2. Our role: your data vs. a salon&apos;s client data</h2>
        <p>
          For salon accounts, website visitors and demo requests, Salon Central decides how the information is used,
          so we are responsible for it (the &ldquo;data controller&rdquo;).
        </p>
        <p>
          A salon&apos;s <strong>client records belong to that salon</strong>. The salon decides what to record and
          how to use it, and we store and process that information on the salon&apos;s behalf, following its
          instructions (we are the &ldquo;data processor&rdquo;). If you are a client of a salon and have a question
          about your information, please contact the salon first; we will help the salon answer it.
        </p>

        <h2>3. Information we collect</h2>

        <h3>Salon owners and staff</h3>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr><th>Information</th><th>When we collect it</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Name, email address, phone number</strong>, salon or business name</td>
                <td>When you sign up, or when a salon owner creates a staff login for you</td>
              </tr>
              <tr>
                <td>Password (stored only in scrambled, &ldquo;hashed&rdquo; form, never readable), or your Google account name, email and ID if you sign in with Google</td>
                <td>When you create or sign in to your account</td>
              </tr>
              <tr>
                <td>Your plan, invoices, and payment proofs (e.g. a bank or EasyPaisa transfer screenshot)</td>
                <td>When you subscribe or pay for Salon Central</td>
              </tr>
              <tr>
                <td>Staff records: name, phone, role, services, pay and commission details, attendance times</td>
                <td>When a salon adds and manages its team</td>
              </tr>
              <tr>
                <td>Approximate location of your phone at check-in</td>
                <td>Only if your salon uses QR attendance check-in, to confirm you are at the salon. Your browser asks your permission first.</td>
              </tr>
              <tr>
                <td>Sign-in and security details: browser and device type, IP address, approximate city and country, sign-in times, two-step sign-in codes</td>
                <td>Each time you sign in, so you can see and sign out your devices and we can protect your account</td>
              </tr>
              <tr>
                <td>Messages you send us</td>
                <td>When you contact support by email or WhatsApp</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Salon clients</h3>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr><th>Information</th><th>When it is collected</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Name, phone number, email address</strong> (if given), birthday (if given)</td>
                <td>When you book online, or when the salon adds you as a client</td>
              </tr>
              <tr>
                <td>Appointments, services, staff, bills, payments, loyalty points and visit history</td>
                <td>As you visit and pay the salon</td>
              </tr>
              <tr>
                <td>Notes and preferences, such as hair colour formulas, and feedback or reviews you give</td>
                <td>When the salon records them, or when you leave feedback</td>
              </tr>
              <tr>
                <td>
                  <strong>Health-related information</strong> at aesthetic clinics: treatment notes, aftercare,
                  signed consent forms
                </td>
                <td>When a clinic records your treatment. This is sensitive information; see section 6.</td>
              </tr>
              <tr>
                <td>Payment proof screenshots</td>
                <td>If you pay a deposit online and upload proof of payment</td>
              </tr>
              <tr>
                <td>Your photo</td>
                <td>Only if the salon uses Virtual Try-On to preview a hairstyle or colour on you</td>
              </tr>
              <tr>
                <td>Notification permission</td>
                <td>Only if you turn on notifications in a salon&apos;s client app</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Website visitors</h3>
        <ul>
          <li>
            <strong>Demo requests:</strong> your <strong>name, email address, phone number</strong> and preferred
            date and time when you fill in the &ldquo;Book a Demo&rdquo; form. If you then tap &ldquo;Send on
            WhatsApp&rdquo;, the same details go to us through WhatsApp.
          </li>
          <li>
            <strong>Technical information:</strong> like every website, our servers receive your IP address and
            browser details when you visit. We use these only to deliver and protect the site.
          </li>
        </ul>

        <h2>4. Why we collect it and how we use it</h2>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr><th>We use information to&hellip;</th><th>Why</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Create and run your account, and show your salon&apos;s data in the app</td>
                <td>To provide the service you signed up for</td>
              </tr>
              <tr>
                <td>Take and manage bookings, and send appointment confirmations, reminders, follow-ups, birthday and other messages by WhatsApp</td>
                <td>To provide the service, as set up and requested by the salon</td>
              </tr>
              <tr>
                <td>Email you: account emails, sign-in codes, daily sales reports, billing reminders and important notices</td>
                <td>To provide the service and keep your account secure</td>
              </tr>
              <tr>
                <td>Verify sign-ins, run two-step sign-in, detect suspicious activity and limit repeated attempts</td>
                <td>To protect your account and our platform</td>
              </tr>
              <tr>
                <td>Bill salons and confirm payments</td>
                <td>To fulfil our agreement with you</td>
              </tr>
              <tr>
                <td>Respond to demo requests and support messages</td>
                <td>Because you asked us to</td>
              </tr>
              <tr>
                <td>Report sales to FBR for salons that turn on FBR integration</td>
                <td>Because the salon is legally required to, and asks us to do it</td>
              </tr>
              <tr>
                <td>Fix problems and improve Salon Central</td>
                <td>Our legitimate interest in a reliable, useful product</td>
              </tr>
              <tr>
                <td>Keep records and respond to lawful requests</td>
                <td>To meet our legal obligations</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          We do <strong>not</strong> sell personal information, use it for advertising, or use a salon&apos;s client
          list for our own marketing.
        </p>

        <h2>5. How we collect it</h2>
        <ul>
          <li><strong>Directly from you</strong>: forms you fill in (sign-up, booking, demo request, feedback), and messages you send us.</li>
          <li><strong>From a salon</strong>: client and staff details that a salon enters or imports into Salon Central.</li>
          <li><strong>Automatically</strong>: sign-in and device details when you use the app, and basic technical details when you visit the website.</li>
          <li><strong>From Google</strong>: your name and email address, if you choose to sign in with Google.</li>
        </ul>

        <h2>6. Sensitive information</h2>
        <p>
          Some features involve more sensitive information: health-related notes and consent forms at aesthetic
          clinics, clients&apos; photos for Virtual Try-On, and phone location for staff attendance check-in. Each one
          is used only for that feature. Access is limited to the salon&apos;s own authorised staff. Salons are
          responsible for getting their clients&apos; consent where the law requires it.
        </p>

        <h2>7. Who we share information with</h2>
        <p>
          We share information only with the services we need to run Salon Central, only what each one needs, and
          never so they can use it for their own purposes:
        </p>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr><th>Service</th><th>What for</th><th>What they receive</th></tr>
            </thead>
            <tbody>
              <tr><td>Vercel</td><td>Hosting the website and app</td><td>All app traffic passes through it</td></tr>
              <tr><td>Turso</td><td>Database where Salon Central data is stored</td><td>The data described above</td></tr>
              <tr><td>Resend</td><td>Sending emails</td><td>Email address, name, email contents</td></tr>
              <tr>
                <td>WhatsApp message providers (WaSender, BotSailor, Zaptick, ChakraHQ, YCloud), depending on the salon&apos;s setup</td>
                <td>Sending WhatsApp messages for the salon</td>
                <td>Client name, phone number, message text</td>
              </tr>
              <tr><td>Google</td><td>Sign in with Google, Google Wallet loyalty cards, website fonts</td><td>Name and email (sign-in), name and points (Wallet), your IP address (fonts)</td></tr>
              <tr><td>Google Gemini (AI)</td><td>Virtual Try-On, only when a salon uses it</td><td>The client&apos;s photo and the chosen style</td></tr>
              <tr><td>Google Sheets</td><td>Recording website demo requests</td><td>Name, email, phone, preferred time</td></tr>
              <tr><td>Federal Board of Revenue (FBR)</td><td>Tax reporting, only for salons that turn it on</td><td>Sale details as FBR requires</td></tr>
              <tr><td>Browser notification services (e.g. Google, Apple, Mozilla)</td><td>Delivering notifications you turned on</td><td>The notification itself</td></tr>
              <tr><td>Cloudinary</td><td>Images on our blog</td><td>Blog images (no personal information)</td></tr>
            </tbody>
          </table>
        </div>
        <p>We may also share information:</p>
        <ul>
          <li><strong>When the law requires it</strong>, for example in response to a valid court order or a request from a government authority;</li>
          <li><strong>To protect people or our platform</strong>, for example to prevent fraud or abuse;</li>
          <li>
            <strong>If our business changes hands</strong>, for example in a merger or sale, in which case this policy
            will continue to protect your information.
          </li>
        </ul>
        <p>
          Some of these providers store or process data outside Pakistan. We choose established providers that protect
          the data they handle.
        </p>

        <h2>8. How we protect it</h2>
        <ul>
          <li>All connections are encrypted (HTTPS).</li>
          <li>Passwords are stored only as secure hashes; sign-in sessions can be signed out remotely and expire automatically.</li>
          <li>Two-step sign-in (a code by email or authenticator app) is available, and on by default, for salon owners and admins.</li>
          <li>Each salon can only see its own data, and staff only see what their role allows.</li>
          <li>Repeated failed sign-ins are slowed down and blocked.</li>
          <li>Data is backed up regularly so it can be restored if something goes wrong.</li>
        </ul>
        <p>
          No system is perfectly secure. If a breach affects your personal information, we will tell you and the
          relevant authorities as the law requires.
        </p>

        <h2>9. How long we keep it</h2>
        <ul>
          <li><strong>Salon accounts and their data</strong>: for as long as the account is open.</li>
          <li>
            <strong>When an account is deleted</strong>: its data is removed from the live system straight away. A
            safety backup is kept for <strong>30 days</strong>, in case the deletion was a mistake, and then
            permanently deleted.
          </li>
          <li><strong>Automatic backups</strong>: kept for between 7 and 30 days.</li>
          <li><strong>Sign-in sessions</strong>: expire after 7 days; sign-in codes after 10 minutes.</li>
          <li><strong>Billing records</strong>: as long as tax and accounting laws require.</li>
          <li><strong>Demo requests</strong>: until we no longer need them to follow up, or until you ask us to delete them.</li>
        </ul>

        <h2>10. Cookies and similar technologies</h2>
        <p>We keep this to a minimum:</p>
        <ul>
          <li>
            <strong>Sign-in cookie</strong> on the app: keeps you signed in. It is essential, cannot be read by other
            websites, and is removed when you sign out or it expires.
          </li>
          <li>
            <strong>Your browser&apos;s local storage</strong>: the app keeps a copy of your salon&apos;s data on your
            device so it works quickly and offline, and the website remembers your cookie choice.
          </li>
          <li>
            <strong>No advertising or tracking cookies.</strong> We do not use third-party analytics or advertising
            trackers.
          </li>
        </ul>

        <h2>11. Your rights</h2>
        <p>Subject to the law that applies to you, you can ask us to:</p>
        <ul>
          <li>tell you what personal information we hold about you and give you a copy;</li>
          <li>correct information that is wrong or incomplete;</li>
          <li>delete your information, or close your account;</li>
          <li>give you your data in a format you can take elsewhere;</li>
          <li>stop or limit some uses of your information, or withdraw consent you gave earlier.</li>
        </ul>
        <p>
          Salon owners can view, edit, export and delete most of their data in the app at any time. To make a request,
          email <a href="mailto:privacy@saloncentral.xyz">privacy@saloncentral.xyz</a>. We will reply within 30 days and
          may need to confirm your identity first. Salon clients: please contact your salon, which controls your
          records; we will help it respond.
        </p>
        <p>
          <strong>WhatsApp messages:</strong> if you no longer want messages from a salon, reply to the salon or ask it
          to stop. Salons are responsible for messaging only clients who agreed to it.
        </p>

        <h2>12. Children</h2>
        <p>
          Salon Central accounts are for adults running or working at a business. Salons may record information about
          clients under 18 (for example, a child&apos;s haircut booked by a parent); salons are responsible for having a
          parent&apos;s or guardian&apos;s permission where needed. We do not knowingly collect information directly from
          children.
        </p>

        <h2>13. Changes to this policy</h2>
        <p>
          We may update this policy as Salon Central changes. We will post the new version here with a new
          &ldquo;Last updated&rdquo; date, and tell salon owners about important changes by email or in the app.
        </p>

        <h2>14. Contact us</h2>
        <p>Questions, requests or concerns about your privacy:</p>
        <ul>
          <li>Email: <a href="mailto:privacy@saloncentral.xyz">privacy@saloncentral.xyz</a></li>
          <li>Support: <a href="mailto:support@saloncentral.xyz">support@saloncentral.xyz</a></li>
          <li>Location: Lahore, Pakistan</li>
        </ul>
      </div>
    </LegalLayout>
  );
}
