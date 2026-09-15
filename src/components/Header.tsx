import React from "react";
import {
  BookOpen,
  PlusCircle,
  Search,
  Layers,
  LayoutDashboard,
  Moon,
  Sun,
  LogOut,
  User as UserIcon,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { useTheme } from "../context/ThemeContext.tsx";

export type ActiveTab = "dashboard" | "add" | "list" | "flashcards" | "settings";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  questionCount: number;
}

export function Header({ activeTab, setActiveTab, questionCount }: HeaderProps) {
  const { user, logOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95 transition-colors"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            id="brand-logo-btn"
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm transition-transform group-hover:scale-105">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                Question Vault
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                {questionCount} {questionCount === 1 ? "question" : "questions"}
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav id="desktop-nav" className="hidden md:flex items-center gap-1">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "dashboard"
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white font-semibold"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-tab-add"
            onClick={() => setActiveTab("add")}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "add"
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white font-semibold"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            <PlusCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Add Questions</span>
          </button>

          <button
            id="nav-tab-list"
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "list"
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white font-semibold"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Questions</span>
          </button>

          <button
            id="nav-tab-flashcards"
            onClick={() => setActiveTab("flashcards")}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "flashcards"
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white font-semibold"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Flashcards</span>
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "settings"
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white font-semibold"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right actions: Theme & User profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 transition-transform hover:-rotate-12" />
            )}
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <div
                id="user-avatar"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs overflow-hidden border border-zinc-300 dark:border-zinc-700"
                title={user.email || "User"}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : user.displayName ? (
                  user.displayName.charAt(0).toUpperCase()
                ) : user.email ? (
                  user.email.charAt(0).toUpperCase()
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
              </div>

              <div className="hidden lg:block text-left text-xs max-w-[140px] truncate">
                <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {user.displayName || "Study Scholar"}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400 truncate text-[11px]">
                  {user.email}
                </div>
              </div>

              <button
                id="signout-btn"
                onClick={() => logOut()}
                title="Sign out of Question Vault"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
