"use client";

import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";

export function PendingApproval() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#030712] text-slate-100 px-6 py-12">
      {/* Background gradients for ambient premium glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 text-center shadow-2xl shadow-black/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Clock/Security Icon */}
        <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/5 mb-6">
          <svg
            className="w-8 h-8 text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Pending Approval
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Your account is currently pending administrator approval. You will receive access to your dashboard, media apps, and API services as soon as your account is activated.
        </p>

        <div className="mt-6 rounded-xl border border-white/5 bg-slate-950/40 p-4 text-left">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 uppercase tracking-wider font-semibold">User Email</span>
            <span className="text-slate-300 font-medium font-mono">{user?.email || "—"}</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-3">
            <span className="text-slate-500 uppercase tracking-wider font-semibold">Status</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Awaiting Review
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            Check Status
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500/30 hover:bg-slate-500/10 focus:outline-none"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
