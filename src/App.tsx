/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";
import { QuestionsProvider, useQuestions } from "./context/QuestionsContext.tsx";
import { Header, ActiveTab } from "./components/Header.tsx";
import { MobileNav } from "./components/MobileNav.tsx";
import { LoginView } from "./components/LoginView.tsx";
import { DashboardView } from "./components/DashboardView.tsx";
import { AddQuestionsView } from "./components/AddQuestionsView.tsx";
import { QuestionListView } from "./components/QuestionListView.tsx";
import { FlashcardView } from "./components/FlashcardView.tsx";
import { SettingsView } from "./components/SettingsView.tsx";
import { EditQuestionModal } from "./components/EditQuestionModal.tsx";
import { Question } from "./types/question.ts";
import { AlertCircle, X, WifiOff } from "lucide-react";

function MainContent() {
  const { user, loading: authLoading } = useAuth();
  const {
    questions,
    loading: questionsLoading,
    error: questionsError,
    clearError,
    updateQuestion,
    recentSubjects,
  } = useQuestions();

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterSubject, setFilterSubject] = useState<string | undefined>(undefined);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleNavigateToListWithFilter = (type?: string, subject?: string) => {
    setFilterType(type);
    setFilterSubject(subject);
    setActiveTab("list");
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Initializing Question Vault...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors pb-16 md:pb-8 font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === "list") {
            setFilterType(undefined);
            setFilterSubject(undefined);
          }
          setActiveTab(tab);
        }}
        questionCount={questions.length}
      />

      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
              <span>Offline mode active. Your question vault remains accessible offline, and any new edits will sync once reconnected.</span>
            </div>
          </div>
        </div>
      )}

      {/* Global error banner if Firestore reports issue */}
      {questionsError && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{questionsError}</span>
            </div>
            <button
              onClick={clearError}
              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Switcher */}
      <main id="main-view-container" className="animate-in fade-in duration-150">
        {activeTab === "dashboard" && (
          <DashboardView
            onNavigateToAdd={() => setActiveTab("add")}
            onNavigateToReview={() => setActiveTab("flashcards")}
            onNavigateToListWithFilter={handleNavigateToListWithFilter}
            onEditQuestion={(q) => setEditingQuestion(q)}
          />
        )}

        {activeTab === "add" && (
          <AddQuestionsView
            onSuccessNavigateToList={() => {
              setFilterType(undefined);
              setFilterSubject(undefined);
              setActiveTab("list");
            }}
            onSuccessNavigateToReview={() => setActiveTab("flashcards")}
            onNavigateToSettings={() => setActiveTab("settings")}
          />
        )}

        {activeTab === "list" && (
          <QuestionListView
            key={`${filterType || "all"}_${filterSubject || "all"}`}
            initialFilterType={filterType}
            initialFilterSubject={filterSubject}
            onNavigateToAdd={() => setActiveTab("add")}
            onEditQuestion={(q) => setEditingQuestion(q)}
          />
        )}

        {activeTab === "flashcards" && (
          <FlashcardView onNavigateToAdd={() => setActiveTab("add")} />
        )}

        {activeTab === "settings" && <SettingsView />}
      </main>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          isOpen={true}
          onClose={() => setEditingQuestion(null)}
          onSave={async (id, updates) => {
            await updateQuestion(id, updates);
            setEditingQuestion(null);
          }}
          availableSubjects={recentSubjects}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === "list") {
            setFilterType(undefined);
            setFilterSubject(undefined);
          }
          setActiveTab(tab);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QuestionsProvider>
          <MainContent />
        </QuestionsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
