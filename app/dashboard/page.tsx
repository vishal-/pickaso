import Link from "next/link";

const stats = [
  { label: "Total Assets", value: "0", icon: "🖼️", change: "—" },
  { label: "Storage Used", value: "0 MB", icon: "💾", change: "—" },
  { label: "API Calls (30d)", value: "0", icon: "⚡️", change: "—" },
  { label: "Tenants", value: "1", icon: "🏢", change: "Active" },
];

const quickActions = [
  { label: "Upload Asset", desc: "Add images or files to your workspace", icon: "⬆️", href: "#" },
  { label: "Generate Token", desc: "Create a temporary upload token", icon: "🔑", href: "#" },
  { label: "View API Docs", desc: "Explore endpoints and examples", icon: "📄", href: "#" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Pickaso
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:block">Dashboard</span>
          <Link
            href="/login"
            className="text-xs text-gray-400 hover:text-gray-200 border border-white/10 rounded-full px-3 py-1.5 transition-colors"
          >
            Sign out
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back. Here's what's happening in your workspace.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-gray-900/50 p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">{s.label}</span>
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-600">{s.change}</p>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="md:col-span-2 rounded-xl border border-white/8 bg-gray-900/50 p-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              {quickActions.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-4 p-4 rounded-lg border border-white/5 bg-white/3 hover:bg-white/6 hover:border-indigo-500/20 transition-all group"
                >
                  <span className="text-2xl">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{a.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Getting started */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 flex flex-col">
            <h2 className="text-sm font-semibold text-gray-300 mb-1">Get started</h2>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Your workspace is ready. Follow these steps to integrate Pickaso into your app.
            </p>
            <ol className="flex flex-col gap-3 flex-1">
              {[
                "Create your first tenant",
                "Generate an API key",
                "Upload your first asset",
                "Serve via CDN URL",
              ].map((step, i) => (
                <li key={step} className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-semibold text-[10px]">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <a href="#docs" className="mt-6 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Read the docs →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
