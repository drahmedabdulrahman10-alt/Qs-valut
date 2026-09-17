import React, { useState } from "react";
import { BookOpen, Sparkles, ShieldCheck, Layers, ArrowRight, AlertCircle, ExternalLink, Copy, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { firebaseConfig } from "../lib/firebase.ts";

export function LoginView() {
  const { signInWithGoogle, authError } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHostname = typeof window !== "undefined" ? window.location.hostname : "";

  const handleCopyDomain = () => {
    if (currentHostname && navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setLocalError(null);
    setIsUnauthorizedDomain(false);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      const code = err?.code || "";
      const msg = err?.message || "";
      if (code === "auth/unauthorized-domain" || msg.includes("unauthorized-domain")) {
        setIsUnauthorizedDomain(true);
        setLocalError(
          `This domain (${currentHostname}) is not authorized in Firebase Authentication.`
        );
      } else if (code === "auth/popup-blocked") {
        setLocalError("The sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (code === "auth/cancelled-popup-request" || code === "auth/popup-closed-by-user") {
        setLocalError("Sign-in was cancelled. Please try again.");
      } else {
        setLocalError(err?.message || "Could not sign in with Google. Please try again.");
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md mb-4">
          <BookOpen className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Question Vault
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Intelligent personal study vault. Paste messy questions, structure them instantly with AI, and master them with flashcards.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {isUnauthorizedDomain ? (
            <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
              <div className="flex items-start gap-2.5 mb-2 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>Domain Authorization Required / مطلوب تفعيل النطاق</span>
              </div>
              <p className="mb-3 text-[13px] leading-relaxed">
                Firebase rejects logins from new domains like Vercel until you add the domain to your Firebase Authorized Domains list.
              </p>
              <div className="flex items-center gap-2 bg-white/70 dark:bg-black/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800 mb-3 font-mono text-[11px] select-all">
                <span className="truncate flex-1 font-bold text-zinc-800 dark:text-zinc-200">{currentHostname}</span>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 font-sans font-medium text-[11px] transition-colors"
                >
                  {copiedDomain ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedDomain ? "Copied" : "Copy Domain"}
                </button>
              </div>
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 font-medium underline hover:text-amber-700 dark:hover:text-amber-300"
              >
                Open Firebase Console &rarr; Authorized Domains
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (authError || localError) && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <span>{localError || authError}</span>
            </div>
          )}

          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white py-3 px-4 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 active:scale-[0.99] disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-750 transition-all"
          >
            {signingIn ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900 dark:border-t-white" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{signingIn ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Key Features
            </h2>
            <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>AI auto-parsing of MCQs, Short Answers, and Enumerations</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Secure Cloud Firestore (strictly isolated per Google UID)</span>
              </li>
              <li className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Interactive Flashcard review with performance ratings</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
          Personal study repository • Powered by Gemini AI & Firebase Firestore
        </p>
      </div>
    </div>
  );
}
