import Navbar        from "../components/Navbar";
import Hero          from "../components/Hero";
import TrustedBy     from "../components/TrustedBy";
import Features      from "../components/Features";
import HowItWorks    from "../components/HowItWorks";
import WhySalonCentral from "../components/WhySalonCentral";
import Testimonials, { testimonials } from "../components/Testimonials";
import BlogSection   from "../components/BlogSection";
import FAQ           from "../components/FAQ";
import Footer        from "../components/Footer";
import ScrollReveal  from "../components/ScrollReveal";
import { getPublishedPosts } from "../lib/blog";
import { siteConfig } from "../lib/seo";

export const revalidate = 60;

// Reviews and aggregateRating are built from the same `testimonials` array
// the Testimonials section renders below, so this can't drift from what's
// actually visible on the page. Offer pricing intentionally has no numeric
// `price` — every plan is "Contact Sales" (see components/Pricing.tsx), so
// a price field would misrepresent it as free.
const avgRating = testimonials.reduce((sum, t) => sum + t.stars, 0) / testimonials.length;

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "en",
  screenshot: `${siteConfig.url}${siteConfig.ogImage}`,
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "PKR",
    priceRange: "Contact for pricing",
    offerCount: "3",
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        description: "Core salon management without WhatsApp automation. Includes POS, appointment booking, staff and client management, inventory, invoicing, and revenue management.",
        priceCurrency: "PKR",
        priceSpecification: { "@type": "PriceSpecification", description: "Contact sales for pricing" },
      },
      {
        "@type": "Offer",
        name: "Pro",
        description: "Complete toolkit for growing salons. Includes everything in Starter plus WhatsApp reminders.",
        priceCurrency: "PKR",
        priceSpecification: { "@type": "PriceSpecification", description: "Contact sales for pricing" },
      },
      {
        "@type": "Offer",
        name: "Premium",
        description: "Everything in Pro plus virtual try-on and multi-location branch management.",
        priceCurrency: "PKR",
        priceSpecification: { "@type": "PriceSpecification", description: "Contact sales for pricing" },
      },
    ],
  },
  featureList: [
    "Appointment Scheduling",
    "Point of Sale (POS)",
    "WhatsApp Reminders",
    "Online Booking Page",
    "Invoicing",
    "Revenue Management",
    "Staff Management",
    "Client Management",
    "Inventory Management",
    "Loyalty Points",
    "Payroll Management",
    "Virtual Try-On",
    "Multi-location Branch Management",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: avgRating.toFixed(1),
    reviewCount: String(testimonials.length),
    bestRating: "5",
    worstRating: "1",
  },
  review: testimonials.map((t) => ({
    "@type": "Review",
    reviewRating: { "@type": "Rating", ratingValue: String(t.stars), bestRating: "5" },
    author: { "@type": "Person", name: t.name },
    reviewBody: t.text,
  })),
};

export default async function Home() {
  const posts = await getPublishedPosts();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <ScrollReveal />
      <Navbar dark />
      <Hero />
      <TrustedBy />
      <Features />
      <HowItWorks />
      <WhySalonCentral />
      <Testimonials />
      <BlogSection posts={posts} />
      <FAQ />
      <Footer />
    </>
  );
}
