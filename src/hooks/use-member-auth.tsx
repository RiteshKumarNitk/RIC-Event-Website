"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";

interface MemberData {
  id: string;
  memberId: number;
  name: string;
  phone: string;
  email: string;
  categoryType: string;
  categoryAcronym: string;
}

interface MemberAuthContextType {
  member: MemberData | null;
  loading: boolean;
  memberLogin: (memberId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  memberLogout: () => Promise<void>;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined);

export function MemberAuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchedRef = useRef(false);

  const fetchMember = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    try {
      const res = await fetch("/api/auth/member-me");
      if (res.ok) {
        const data = await res.json();
        if (data.member) setMember(data.member);
      }
    } catch {
      // Not logged in
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMember(); }, [fetchMember]);

  const memberLogin = async (memberId: string, password: string) => {
    try {
      const res = await fetch("/api/auth/member-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: parseInt(memberId), password }),
      });
      const data = await res.json();
      if (res.ok && data.member) {
        setMember(data.member);
        return { success: true };
      }
      return { success: false, error: data.error || "Invalid credentials" };
    } catch {
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const memberLogout = async () => {
    await fetch("/api/auth/member-logout", { method: "POST" });
    fetchedRef.current = false;
    setMember(null);
    setLoading(true);
    router.push("/member-login");
  };

  return (
    <MemberAuthContext.Provider value={{ member, loading, memberLogin, memberLogout }}>
      {children}
    </MemberAuthContext.Provider>
  );
}

export function useMemberAuth() {
  const context = useContext(MemberAuthContext);
  if (!context) throw new Error("useMemberAuth must be used within a MemberAuthProvider");
  return context;
}
