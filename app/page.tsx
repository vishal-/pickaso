import { LoginButton } from "@/components/LoginButton";

const features = [
  {
    icon: "⚡",
    title: "Lightning-fast uploads",
    desc: "Optimize and transform assets automatically with a single API call.",
  },
  {
    icon: "🔒",
    title: "Secure by default",
    desc: "Temporary signed URLs, tenant boundaries, and burn-on-read controls built in.",
  },
  {
    icon: "🧩",
    title: "Multi-tenant ready",
    desc: "Give each customer clean isolation without building custom infrastructure.",
  },
  {
    icon: "🌍",
    title: "Global delivery",
    desc: "Edge-ready media routing that stays fast for teams everywhere.",
  },
];

const metrics = [
  { value: "< 350ms", label: "Avg. upload latency" },
  { value: "24+", label: "Countries served" },
  { value: "1k+", label: "Trusted by teams" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#060816] text-slate-200">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(99,102,241,0.25),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent_55%)] [-webkit-mask-image:linear-gradient(to_bottom,black,transparent_55%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full border-b border-white/10">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-8 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_4px_14px_rgba(99,102,241,0.35)]">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold tracking-[-0.02em] text-white">
              Pickaso
            </span>
          </div>
          <LoginButton />
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 flex-col items-center">
        <div className="flex w-full max-w-[1100px] flex-col items-center px-8">
          {/* Hero */}
          <section className="flex w-full flex-col items-center pb-20 pt-24 text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/35 bg-indigo-500/10 px-3 py-1 text-[12px] font-medium text-indigo-200">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
              Now in public beta
            </div>

            {/* Headline */}
            <h1 className="mb-6 max-w-[780px] font-[family-name:var(--font-space-grotesk)] text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
              Media infrastructure{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                for modern teams.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mb-10 max-w-[520px] text-lg leading-7 text-slate-400">
              Upload, transform, and deliver rich media without stitching
              together custom pipelines or brittle storage rules.
            </p>

            {/* CTAs */}
            <div className="mb-16 flex gap-3">
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 px-7 py-3 text-sm font-semibold text-white no-underline shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
              >
                Get started
              </a>
              <a
                href="#docs"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-slate-300 no-underline"
              >
                View docs
              </a>
            </div>

            {/* Metrics */}
            <div className="mb-20 grid w-full max-w-[520px] grid-cols-3 gap-4">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                >
                  <p className="m-0 text-2xl font-bold text-white">{m.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Feature cards */}
            <div
              id="features"
              className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-sm"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500/20 to-violet-600/10 text-base">
                    {f.icon}
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="m-0 text-xs leading-6 text-slate-500">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-8 py-6 text-center text-xs text-slate-700">
        © 2026 Pickaso. All rights reserved.
      </footer>
    </div>
  );
}
