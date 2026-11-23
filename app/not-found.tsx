import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  const s = { stroke: "#7C3AED", strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "#fff", textAlign: "center", fontFamily: "var(--font-montserrat), Montserrat, system-ui, sans-serif", color: "#1a1a2e" }}>
      <svg viewBox="0 0 640 200" style={{ width: "min(640px, 100%)", height: "auto" }} fill="none" aria-hidden="true">
        {/* sparks */}
        <g {...s} strokeWidth={4}>
          <path d="M320 12v26M320 162v26M278 28l16 16M362 28l-16 16M278 172l16-16M362 172l-16-16" />
        </g>
        {/* left plug + cable */}
        <path d="M0 120c60-22 130-26 218-10" {...s} strokeWidth={9} />
        <path d="M0 120c60-22 130-26 218-10" stroke="#fff" strokeWidth={3} />
        <rect x="222" y="96" width="22" height="26" rx="5" fill="#f5f3ff" {...s} />
        <rect x="244" y="72" width="62" height="78" rx="14" fill="#f5f3ff" {...s} />
        <path d="M262 98h24M262 110h24M262 122h24" {...s} strokeWidth={4} />
        {/* right plug + cable */}
        <path d="M640 120c-60-22-130-26-218-10" {...s} strokeWidth={9} />
        <path d="M640 120c-60-22-130-26-218-10" stroke="#fff" strokeWidth={3} />
        <rect x="396" y="96" width="22" height="26" rx="5" fill="#f5f3ff" {...s} />
        <rect x="334" y="72" width="62" height="78" rx="14" fill="#f5f3ff" {...s} />
        <path d="M334 94h-22M334 126h-22M334 110h-14" {...s} strokeWidth={5} />
      </svg>
      <div style={{ fontSize: "clamp(72px, 14vw, 128px)", fontWeight: 900, lineHeight: 1, marginTop: 8, color: "#7C3AED" }}>404</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "18px 0 10px" }}>Oops! Page not found</h1>
      <p style={{ maxWidth: 440, fontSize: 14, lineHeight: 1.7, color: "#666", margin: 0 }}>
        The page you are looking for doesn&rsquo;t exist or has been moved. Check the address, or head back home.
      </p>
      <Link href="/" style={{ marginTop: 28, padding: "14px 30px", border: "3px solid #7C3AED", borderRadius: 999, fontSize: 13, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "#7C3AED", textDecoration: "none" }}>
        Go back home
      </Link>
    </main>
  );
}
