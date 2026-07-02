import { LoginButton } from "@/components/LoginButton";

export default function Home() {
  return (
    <div className="relative text-gray-100 overflow-x-hidden min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">

      {/* Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />
        <div className="absolute top-[30%] left-[-10%] w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 py-5 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Pickaso
          </span>
        </div>
        <LoginButton />
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-5xl mx-auto w-full">

        <h1 className="text-5xl md:text-[4.5rem] font-bold tracking-tight text-white leading-[1.08] mb-6"
          style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Enterprise media management
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">
            for your SaaS. In 5 minutes.
          </span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Stop building asset pipelines and complex bucket logic.
          Pickaso is a pluggable, lightning-fast media layer with native multi-tenancy.
        </p>

        {/* CTA + Code block side by side on md+ */}
        <div className="w-full max-w-4xl flex flex-col md:flex-row items-center md:items-stretch gap-6">

          {/* CTA */}
          <div className="flex flex-col items-center md:items-start justify-center gap-4 md:w-1/3 shrink-0">
            <a href="#docs"
              className="group relative inline-flex items-center justify-center p-px overflow-hidden text-sm font-semibold rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-[1.02] w-full md:w-auto">
              <span className="relative w-full text-center px-7 py-3 bg-gray-950 rounded-xl transition-all duration-200 group-hover:bg-opacity-0">
                Get API Key →
              </span>
            </a>
            <p className="text-gray-600 text-xs">No credit card required</p>
          </div>

          {/* Code block */}
          <div className="flex-1 w-full bg-gray-900/50 border border-gray-800/80 rounded-2xl p-5 text-left font-mono text-xs text-gray-400 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-gray-600 text-[10px]">POST /v1/assets/upload</span>
            </div>
            <div className="space-y-1">
              <p><span className="text-purple-400">POST</span> <span className="text-gray-300">/v1/assets/upload</span></p>
              <p className="text-gray-600">{"// Sharp processes & returns optimized variants"}</p>
              <p className="mt-3 text-gray-500">{"{"}</p>
              <p>&nbsp;&nbsp;<span className="text-emerald-400">"url"</span><span className="text-gray-500">:</span> <span className="text-amber-300/80">"https://cdn.pickaso.com/.../orig.webp"</span><span className="text-gray-500">,</span></p>
              <p>&nbsp;&nbsp;<span className="text-emerald-400">"variants"</span><span className="text-gray-500">:</span> <span className="text-gray-500">{"{"}</span> <span className="text-amber-300/80">"sm"</span><span className="text-gray-500">:</span> <span className="text-amber-300/80">"..."</span><span className="text-gray-500">,</span> <span className="text-amber-300/80">"md"</span><span className="text-gray-500">:</span> <span className="text-amber-300/80">"..."</span><span className="text-gray-500">,</span> <span className="text-amber-300/80">"lg"</span><span className="text-gray-500">:</span> <span className="text-amber-300/80">"..."</span> <span className="text-gray-500">{"}"}</span></p>
              <p className="text-gray-500">{"}"}</p>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl mt-16">
          {[
            { icon: "⚡️", title: "Sharp-Engineered", desc: "Auto-converts to optimized WebP/AVIF instantly." },
            { icon: "🔒", title: "Dynamic Security", desc: "Temporary upload tokens and Burn-on-Read support." },
            { icon: "🗂", title: "Multi-Tenant First", desc: "Physical isolation tailored for SaaS scaling." },
            { icon: "🌍", title: "Edge Delivery", desc: "Cloudflare CDN for low-latency global routing." },
          ].map((f) => (
            <div key={f.title} className="p-4 rounded-xl border border-gray-800/60 bg-gray-900/30 hover:bg-gray-900/60 hover:border-gray-700/60 transition-all duration-200 text-left">
              <div className="text-xl mb-2">{f.icon}</div>
              <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-900/60 py-6 px-6 text-center text-xs text-gray-700">
        © 2026 Pickaso Inc. All rights reserved. Powered by Next.js &amp; Neon.
      </footer>
    </div>
  );
}
