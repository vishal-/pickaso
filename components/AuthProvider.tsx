"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth";
import "@neondatabase/auth-ui/css";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <NeonAuthUIProvider authClient={authClient} redirectTo="/dashboard">
      {children}
    </NeonAuthUIProvider>
  );
}
