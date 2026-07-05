import { LoginButton } from "@/components/LoginButton";

const features = [
  { icon: "⚡", title: "Lightning-fast uploads", desc: "Optimize and transform assets automatically with a single API call." },
  { icon: "🔒", title: "Secure by default", desc: "Temporary signed URLs, tenant boundaries, and burn-on-read controls built in." },
  { icon: "🧩", title: "Multi-tenant ready", desc: "Give each customer clean isolation without building custom infrastructure." },
  { icon: "🌍", title: "Global delivery", desc: "Edge-ready media routing that stays fast for teams everywhere." },
];

const metrics = [
  { value: "< 350ms", label: "Avg. upload latency" },
  { value: "24+", label: "Countries served" },
  { value: "1k+", label: "Trusted by teams" },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#060816", color: "#e2e8f0", overflowX: "hidden" }}>

      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(99,102,241,0.25), transparent)" }} />
        <div style={{
          position: "absolute", inset: 0, opacity: 0.35,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "linear-gradient(to bottom, black, transparent 55%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 55%)",
        }} />
      </div>

      {/* Header */}
      <header style={{ position: "relative", zIndex: 10, width: "100%", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ height: 32, width: 32, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(99,102,241,0.35)", flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 700, fontSize: 16, color: "#fff", letterSpacing: "-0.02em" }}>
              Pickaso
            </span>
          </div>
          <LoginButton />
        </div>
      </header>

      {/* Main */}
      <main style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 1100, padding: "0 32px", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Hero */}
          <section style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 96, paddingBottom: 80, width: "100%" }}>

            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.1)", padding: "4px 12px", fontSize: 12, fontWeight: 500, color: "#a5b4fc", marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", display: "inline-block" }} />
              Now in public beta
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#fff", maxWidth: 780, marginBottom: 24 }}>
              Media infrastructure{" "}
              <span style={{ background: "linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                for modern teams.
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: 18, color: "#94a3b8", maxWidth: 520, lineHeight: 1.7, marginBottom: 40 }}>
              Upload, transform, and deliver rich media without stitching together custom pipelines or brittle storage rules.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, marginBottom: 64 }}>
              <a href="#features" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "linear-gradient(135deg, #6366f1, #7c3aed)", padding: "12px 28px", fontSize: 14, fontWeight: 600, color: "#fff", textDecoration: "none", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}>
                Get started
              </a>
              <a href="#docs" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", padding: "12px 28px", fontSize: 14, fontWeight: 600, color: "#cbd5e1", textDecoration: "none" }}>
                View docs
              </a>
            </div>

            {/* Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, width: "100%", maxWidth: 520, marginBottom: 80 }}>
              {metrics.map((m) => (
                <div key={m.label} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", padding: "20px 16px", backdropFilter: "blur(8px)" }}>
                  <p style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>{m.value}</p>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>{m.label}</p>
                </div>
              ))}
            </div>

            {/* Feature cards */}
            <div id="features" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, width: "100%" }}>
              {features.map((f) => (
                <div key={f.title} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", padding: 20, textAlign: "left", backdropFilter: "blur(8px)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(124,58,237,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 12 }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>{f.title}</h3>
                  <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px 32px", textAlign: "center", fontSize: 12, color: "#334155" }}>
        © 2026 Pickaso Inc. All rights reserved. · Built with Next.js and Neon Auth.
      </footer>
    </div>
  );
}
