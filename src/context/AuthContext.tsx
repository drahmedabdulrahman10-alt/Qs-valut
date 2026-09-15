import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle as fbSignIn, logOut as fbLogOut, testConnection } from "../lib/firebase.ts";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  logOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Initial connection test as required by Firebase skill
    const timer = setTimeout(() => {
      testConnection().catch((err) => {
        console.warn("Firestore connection check notice:", err);
      });
    }, 250);

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (error) => {
        console.error("Auth state change error:", error);
        setAuthError(error.message);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const loggedUser = await fbSignIn();
      return loggedUser;
    } catch (err: any) {
      const msg = err?.message || "Failed to sign in with Google.";
      setAuthError(msg);
      throw err;
    }
  };

  const logOut = async () => {
    try {
      await fbLogOut();
    } catch (err: any) {
      console.error("Log out error:", err);
      setAuthError(err?.message || "Failed to log out.");
      throw err;
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        logOut,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
