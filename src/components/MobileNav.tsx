import React from "react";
import { LayoutDashboard, PlusCircle, Layers, Search, Settings } from "lucide-react";
import { ActiveTab } from "./Header.tsx";

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 px-2 py-1.5"
    >
      <div className="grid grid-cols-5 gap-1">
        <button
          id="mobile-nav-home"
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "dashboard"
              ? "text-zinc-900 dark:text-white font-semibold"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <LayoutDashboard className={`h-5 w-5 mb-1 ${activeTab === "dashboard" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span>Home</span>
        </button>

        <button
          id="mobile-nav-add"
          onClick={() => setActiveTab("add")}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "add"
              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <PlusCircle className={`h-5 w-5 mb-1 ${activeTab === "add" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span>Add</span>
        </button>

        <button
          id="mobile-nav-review"
          onClick={() => setActiveTab("flashcards")}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "flashcards"
              ? "text-indigo-600 dark:text-indigo-400 font-semibold"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Layers className={`h-5 w-5 mb-1 ${activeTab === "flashcards" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span>Review</span>
        </button>

        <button
          id="mobile-nav-search"
          onClick={() => setActiveTab("list")}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "list"
              ? "text-zinc-900 dark:text-white font-semibold"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Search className={`h-5 w-5 mb-1 ${activeTab === "list" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span>Search</span>
        </button>

        <button
          id="mobile-nav-settings"
          onClick={() => setActiveTab("settings")}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "settings"
              ? "text-zinc-900 dark:text-white font-semibold"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Settings className={`h-5 w-5 mb-1 ${activeTab === "settings" ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
}
