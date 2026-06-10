"use client";

import { createContext, useContext, ReactNode } from 'react';
import { SessionProvider, useSession, signIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider
      refetchInterval={0}           // Disable automatic polling
      refetchOnWindowFocus={false}  // Don't refetch when tab gets focus
    >
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
};

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, fullName: string) => Promise<any>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const loading = status === "loading";
  const user = session?.user ? { ...session.user, uid: session.user.id || session.user.email } : null;

  const login = async (email: string, pass: string) => {
    const result = await signIn("credentials", { email, password: pass, redirect: false });
    if (result?.error) {
      const error = new Error(result.error);
      (error as any).code = result.status === 401 ? "auth/invalid-credential" : "auth/login-failed";
      throw error;
    }
    return result;
  };
  
  const signup = async (email: string, pass: string, fullName: string) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password: pass, name: fullName }),
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || "Signup failed");
      (error as any).code = data.code;
      throw error;
    }
    try {
      return await login(email, pass);
    } catch (loginError: any) {
      const error = new Error("Account created but login failed. Please try logging in.");
      (error as any).code = loginError.code || "auth/signup-login-failed";
      throw error;
    }
  };

  const logout = async () => {
    await nextAuthSignOut({ redirect: false });
    router.push('/');
  };

  const signInWithGoogle = async () => {
    return await signIn("google", { redirect: false });
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    signInWithGoogle
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
