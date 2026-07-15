"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  approved: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  approved: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const res = await fetch("/api/auth/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              emailVerified: firebaseUser.emailVerified,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setApproved(!!data.approved);
          }
        } catch (error) {
          console.error("Failed to sync authenticated user to database:", error);
        }
      } else {
        setApproved(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut(auth);
      setApproved(false);
    } catch (error) {
      console.error("Failed to clean up session on logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, approved, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
