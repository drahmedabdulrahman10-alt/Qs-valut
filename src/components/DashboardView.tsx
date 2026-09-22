import React from "react";
import {
  BookOpen,
  Star,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  FolderOpen,
  PlusCircle,
  Clock,
  ChevronRight,
  HelpCircle,
  BookmarkCheck,
} from "lucide-react";
import { useQuestions } from "../context/QuestionsContext.tsx";
import { QuestionCard } from "./QuestionCard.tsx";
import { Question } from "../types/question.ts";

interface DashboardViewProps {
  onNavigateToAdd: () => void;
  onNavigateToReview: () => void;
  onNavigateToListWithFilter: (filterType?: string, filterSubject?: string) => void;
  onEditQuestion: (q: Question) => void;
}

export function DashboardView({
  onNavigateToAdd,
  onNavigateToReview,
  onNavigateToListWithFilter,
  onEditQuestion,
}: DashboardViewProps) {
  const {
    questions,
    subjects,
    toggleImportant,
    deleteQuestion,
    loading,
    studyCheckpointQuestionId,
    studyCheckpointQuestion,
    toggleStudyCheckpoint,
    flashcardCheckpointQuestion,
  } = useQuestions();

  const totalQuestions = questions.length;
  const importantCount = questions.filter((q) => q.important).length;
  // Needs review: reviewed 0 times or marked hard
  const needReviewCount = questions.filter(
    (q) => q.reviewCount === 0 || q.difficulty === "hard"
  ).length;
  const masteredCount = questions.filter((q) => q.difficulty === "easy" && q.reviewCount > 0).length;

  const recentQuestions = questions.slice(0, 4);

  if (loading && questions.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900 dark:border-t-white" />
          <span className="text-xs font-medium text-zinc-500">Syncing Question Vault...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Study Overview
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Welcome to your Question Vault. Track your progress, organize notes, and review questions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="dash-add-btn"
            onClick={onNavigateToAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors"
          >
            <Sparkles className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
            <span>Paste & Organize</span>
          </button>

          {totalQuestions > 0 && (
            <button
              id="dash-review-btn"
              onClick={onNavigateToReview}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Review Flashcards</span>
            </button>
          )}
        </div>
      </div>

      {/* Study Checkpoint Resume Banner */}
      {studyCheckpointQuestion && (
        <div
          id="dashboard-study-checkpoint-card"
          className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 sm:p-5 dark:border-teal-900/60 dark:bg-teal-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in duration-200"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white dark:bg-teal-500 dark:text-zinc-950 shadow-xs">
              <BookmarkCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                  Study Checkpoint Active
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                  {studyCheckpointQuestion.subject || "General"}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1" dir="auto">
                {studyCheckpointQuestion.question}
              </p>
            </div>
          </div>
          <button
            id="dashboard-resume-checkpoint-btn"
            onClick={() => {
              onNavigateToListWithFilter();
              setTimeout(() => {
                const el = document.getElementById(`question-card-${studyCheckpointQuestion.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }, 200);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-teal-800 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400 transition-colors shrink-0 cursor-pointer"
          >
            <span>Resume Where You Stopped</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Flashcard Checkpoint Resume Banner */}
      {flashcardCheckpointQuestion && (
        <div
          id="dashboard-flashcard-checkpoint-card"
          className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 sm:p-5 dark:border-indigo-900/60 dark:bg-indigo-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in fade-in duration-200"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white dark:bg-indigo-500 dark:text-zinc-950 shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                  Flashcard Checkpoint Active
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                  {flashcardCheckpointQuestion.subject || "General"}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1" dir="auto">
                {flashcardCheckpointQuestion.question}
              </p>
            </div>
          </div>
          <button
            id="dashboard-resume-flashcard-btn"
            onClick={onNavigateToReview}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 dark:bg-indigo-500 dark:text-zinc-950 dark:hover:bg-indigo-400 transition-colors shrink-0 cursor-pointer"
          >
            <span>Resume Flashcard Where You Stopped</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Questions */}
        <button
          onClick={() => onNavigateToListWithFilter()}
          className="text-left rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 transition-all group"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">All Questions</span>
            <BookOpen className="h-4 w-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
            {totalQuestions}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>View entire collection</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </div>
        </button>

        {/* Important */}
        <button
          onClick={() => onNavigateToListWithFilter("important")}
          className="text-left rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-800/80 transition-all group"
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Important</span>
            <Star className="h-4 w-4 fill-current" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
            {importantCount}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-amber-600 dark:text-amber-400">
            <span>High priority questions</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </div>
        </button>

        {/* Need Review */}
        <button
          onClick={() => onNavigateToListWithFilter("needs_review")}
          className="text-left rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800/80 transition-all group"
        >
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Need Review</span>
            <RotateCcw className="h-4 w-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
            {needReviewCount}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-indigo-600 dark:text-indigo-400">
            <span>Unreviewed or difficult</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </div>
        </button>

        {/* Mastered */}
        <button
          onClick={() => onNavigateToListWithFilter("mastered")}
          className="text-left rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800/80 transition-all group"
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mastered</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
            {masteredCount}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400">
            <span>Marked easy with review</span>
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </div>
        </button>
      </div>

      {/* Main Grid: Subjects & Recently Added */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subjects Column (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-zinc-400" />
              <span>Subjects & Categories</span>
            </h2>
            <span className="text-xs text-zinc-400">{subjects.length} total</span>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {subjects.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                No subjects yet. Subjects are automatically indexed as you import questions.
              </div>
            ) : (
              subjects.map(({ name, count }) => (
                <button
                  key={name}
                  onClick={() => onNavigateToListWithFilter(undefined, name)}
                  className="w-full flex items-center justify-between py-3 px-1 text-left text-sm font-medium text-zinc-800 hover:text-indigo-600 dark:text-zinc-200 dark:hover:text-indigo-400 transition-colors group"
                >
                  <span className="truncate pr-2">{name}</span>
                  <span className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-bg-indigo-950/50 dark:group-text-indigo-300">
                    {count}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Recently Added Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400" />
              <span>Recently Added</span>
            </h2>
            {totalQuestions > 4 && (
              <button
                onClick={() => onNavigateToListWithFilter()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {recentQuestions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center bg-white/50 dark:bg-zinc-900/40">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mb-3">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Your Vault is Empty
              </h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
                Paste your lecture notes, word documents, or exam review files to have Gemini automatically structure them.
              </p>
              <button
                onClick={onNavigateToAdd}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Import First Questions</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentQuestions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  onToggleImportant={toggleImportant}
                  onEdit={onEditQuestion}
                  onDelete={deleteQuestion}
                  defaultAnswerVisible={false}
                  isStudyCheckpoint={studyCheckpointQuestionId === q.id}
                  onToggleStudyCheckpoint={toggleStudyCheckpoint}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
