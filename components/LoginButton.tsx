"use client";

import { UserButton } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth";

export function LoginButton() {
  return (
    <button
      onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })}
      className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-full border border-indigo-500/40 transition-colors duration-200"
    >
      Sign in
    </button>
  );
}
