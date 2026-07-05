"use client";

import Link from "next/link";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { authClient } from "@/lib/auth";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard`,
      });
    } catch (error) {
      console.error("Google login failed", error);
      alert("Google sign-in could not be started. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Sign in to Pickaso
          </h1>
          <p className="mt-2 text-sm text-gray-400 text-center">
            Access your media workspace
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-gray-900/60 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FcGoogle className="h-5 w-5 shrink-0" />
            {isLoading ? "Signing in…" : "Continue with Google"}
          </button>

          <p className="mt-5 text-center text-xs text-gray-600">
            By signing in you agree to our{" "}
            <span className="text-gray-500 cursor-pointer hover:text-gray-400">Terms</span>
            {" & "}
            <span className="text-gray-500 cursor-pointer hover:text-gray-400">Privacy Policy</span>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
