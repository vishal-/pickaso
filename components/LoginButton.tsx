"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function LoginButton() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />;
  }

  if (user) {
    const displayName = user.displayName || user.email || "User";
    const avatarSrc = user.photoURL || "";

    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-white/10 px-2.5 py-1.5 text-sm font-medium text-white transition hover:bg-white/15"
      >
        {avatarSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={avatarSrc}
            alt={displayName}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="max-w-[8rem] truncate">{displayName}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-full border border-indigo-500/40 transition-colors duration-200"
    >
      Sign in
    </Link>
  );
}
