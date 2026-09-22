import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  X,
  Star,
  Layers,
  ArrowUpDown,
  BookOpen,
  PlusCircle,
  HelpCircle,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  Sparkles,
  BookmarkCheck,
  Bookmark,
} from "lucide-react";
import { Question, QuestionType, QuestionDifficulty } from "../types/question.ts";
import { useQuestions } from "../context/QuestionsContext.tsx";
import { QuestionCard } from "./QuestionCard.tsx";
import { FormatAnswerModal } from "./FormatAnswerModal.tsx";
import { BulkFormatModal } from "./BulkFormatModal.tsx";

interface QuestionListViewProps {
  key?: React.Key;
  initialFilterType?: string;
  initialFilterSubject?: string;
  onNavigateToAdd: () => void;
  onEditQuestion: (q: Question) => void;
}

export function QuestionListView({
  initialFilterType,
  initialFilterSubject,
  onNavigateToAdd,
  onEditQuestion,
}: QuestionListViewProps) {
  const {
    questions,
    subjects,
    toggleImportant,
    deleteQuestion,
    bulkDeleteQuestions,
    updateQuestion,
    studyCheckpointQuestionId,
    studyCheckpointQuestion,
    toggleStudyCheckpoint,
    setStudyCheckpoint,
  } = useQuestions();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>(
    initialFilterType && ["mcq", "short_answer", "enumerate"].includes(initialFilterType)
      ? initialFilterType
      : "all"
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(initialFilterSubject || "all");
  const [importantOnly, setImportantOnly] = useState<boolean>(initialFilterType === "important");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [needsReviewOnly, setNeedsReviewOnly] = useState<boolean>(
    initialFilterType === "needs_review"
  );
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "review_count">("newest");

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState<boolean>(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState<boolean>(false);
  const [bulkActionNotice, setBulkActionNotice] = useState<string | null>(null);

  // Formatting state
  const [formattingQuestion, setFormattingQuestion] = useState<Question | null>(null);
  const [isBulkFormatting, setIsBulkFormatting] = useState<boolean>(false);

  // Study Checkpoint state
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<string | null>(null);
  const [checkpointNotice, setCheckpointNotice] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const handleContinueWhereStopped = () => {
    if (!studyCheckpointQuestionId) {
      setCheckpointNotice({
        message: "No study checkpoint saved yet. Tap the bookmark icon on any question to mark where you stopped studying.",
        type: "info",
      });
      setTimeout(() => setCheckpointNotice(null), 5000);
      return;
    }

    const targetQuestion = questions.find((q) => q.id === studyCheckpointQuestionId);
    if (!targetQuestion) {
      setCheckpointNotice({
        message: "The saved study checkpoint question is no longer in your vault.",
        type: "info",
      });
      setStudyCheckpoint(null);
      setTimeout(() => setCheckpointNotice(null), 4000);
      return;
    }

    // If active filters hide the checkpoint question, clear them so the element is rendered
    const isVisibleInFiltered = filteredQuestions.some((q) => q.id === studyCheckpointQuestionId);
    if (!isVisibleInFiltered) {
      clearAllFilters();
    }

    const questionIndex = questions.findIndex((q) => q.id === studyCheckpointQuestionId) + 1;
    setCheckpointNotice({
      message: `Resumed from Study Checkpoint: Question #${questionIndex} (${targetQuestion.subject || "General"})`,
      type: "success",
    });
    setHighlightedQuestionId(studyCheckpointQuestionId);

    // Smooth scroll to the target question card
    setTimeout(() => {
      const el = document.getElementById(`question-card-${studyCheckpointQuestionId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);

    // Remove highlight after 3.5s
    setTimeout(() => {
      setHighlightedQuestionId(null);
    }, 3500);

    setTimeout(() => {
      setCheckpointNotice(null);
    }, 5000);
  };

  // Filtered and sorted questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesQuestion = q.question.toLowerCase().includes(term);
        const matchesAnswer = q.answer ? q.answer.toLowerCase().includes(term) : false;
        const matchesSubject = q.subject.toLowerCase().includes(term);
        const matchesSource = q.source ? q.source.toLowerCase().includes(term) : false;
        const matchesTags = q.tags ? q.tags.some((t) => t.toLowerCase().includes(term)) : false;

        if (!matchesQuestion && !matchesAnswer && !matchesSubject && !matchesSource && !matchesTags) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== "all" && q.type !== selectedType) {
        return false;
      }

      // Subject filter
      if (selectedSubject !== "all" && q.subject.toLowerCase() !== selectedSubject.toLowerCase()) {
        return false;
      }

      // Important filter
      if (importantOnly && !q.important) {
        return false;
      }

      // Needs review
      if (needsReviewOnly && q.reviewCount > 0 && q.difficulty !== "hard") {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "review_count") {
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      }
      return 0;
    });
  }, [
    questions,
    searchTerm,
    selectedType,
    selectedSubject,
    importantOnly,
    needsReviewOnly,
    difficultyFilter,
    sortBy,
  ]);

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedType !== "all" ||
    selectedSubject !== "all" ||
    importantOnly ||
    needsReviewOnly ||
    difficultyFilter !== "all";

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setSelectedSubject("all");
    setImportantOnly(false);
    setNeedsReviewOnly(false);
    setDifficultyFilter("all");
  };

  // Bulk Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allVisibleSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => selectedIds.has(q.id));

  const handleSelectAllVisible = () => {
    if (allVisibleSelected) {
      // Deselect all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredQuestions.forEach((q) => next.delete(q.id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredQuestions.forEach((q) => next.add(q.id));
        return next;
      });
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeletingBulk(true);
    try {
      const count = await bulkDeleteQuestions(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsConfirmingBulkDelete(false);
      setBulkActionNotice(`Successfully deleted ${count} questions.`);
      setTimeout(() => setBulkActionNotice(null), 4000);
    } catch (err: any) {
      console.error("Bulk delete error:", err);
      alert(err?.message || "Failed to delete selected questions.");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8 space-y-6 pb-24">
      {/* Search and Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Question Bank
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Search, filter, select, and manage questions across all your predefined subjects.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            id="continue-study-checkpoint-btn"
            type="button"
            onClick={handleContinueWhereStopped}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              studyCheckpointQuestionId
                ? "border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300 dark:hover:bg-teal-900/50 shadow-xs"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
            }`}
            title={
              studyCheckpointQuestionId
                ? "Continue where you stopped studying"
                : "No checkpoint saved yet (tap bookmark on any question)"
            }
          >
            <BookmarkCheck
              className={`h-4 w-4 ${
                studyCheckpointQuestionId ? "text-teal-600 dark:text-teal-400 fill-current" : "text-zinc-400"
              }`}
            />
            <span>Continue Where I Stopped</span>
            {studyCheckpointQuestionId && (
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
            )}
          </button>

          {filteredQuestions.length > 0 && (
            <button
              id="select-all-btn"
              type="button"
              onClick={handleSelectAllVisible}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                allVisibleSelected
                  ? "border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
              }`}
            >
              {allVisibleSelected ? (
                <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Square className="h-4 w-4 text-zinc-400" />
              )}
              <span>{allVisibleSelected ? "Deselect All" : "Select All"}</span>
            </button>
          )}

          <button
            onClick={onNavigateToAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white self-start md:self-auto transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Questions</span>
          </button>
        </div>
      </div>

      {checkpointNotice && (
        <div
          id="checkpoint-notice-banner"
          className={`rounded-xl border p-3 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200 ${
            checkpointNotice.type === "success"
              ? "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300"
              : "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <BookmarkCheck className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
            <span>{checkpointNotice.message}</span>
          </div>
          <button
            onClick={() => setCheckpointNotice(null)}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {bulkActionNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between">
          <span>{bulkActionNotice}</span>
          <button onClick={() => setBulkActionNotice(null)} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Global Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          id="global-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by question text, answer, subject, source, or tags..."
          className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-10 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 shadow-xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Type pills */}
        <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setSelectedType("all")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              selectedType === "all"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setSelectedType("mcq")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              selectedType === "mcq"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            MCQ
          </button>
          <button
            onClick={() => setSelectedType("short_answer")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              selectedType === "short_answer"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Short Answer
          </button>
          <button
            onClick={() => setSelectedType("enumerate")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              selectedType === "enumerate"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Enumerate
          </button>
        </div>

        {/* Subject Filter Dropdown */}
        <select
          id="filter-subject-select"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white py-1.5 px-3 text-xs font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 shadow-xs cursor-pointer"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name} ({s.count})
            </option>
          ))}
        </select>

        {/* Important Star toggle */}
        <button
          onClick={() => setImportantOnly(!importantOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
            importantOnly
              ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
              : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${importantOnly ? "fill-amber-500 text-amber-500" : "text-zinc-400"}`} />
          <span>Important</span>
        </button>

        {/* Needs Review */}
        <button
          onClick={() => setNeedsReviewOnly(!needsReviewOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
            needsReviewOnly
              ? "border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
              : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-zinc-400" />
          <span>Needs Review</span>
        </button>

        {/* Difficulty */}
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white py-1.5 px-3 text-xs font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 shadow-xs cursor-pointer"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        {/* Sort Select */}
        <div className="ml-auto flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-zinc-200 bg-white py-1.5 px-3 text-xs font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 shadow-xs cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="review_count">Most Reviewed</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 px-2 py-1 cursor-pointer"
          >
            <X className="h-3 w-3" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Results Count & Selection Status */}
      <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <div>
          Showing {filteredQuestions.length} of {questions.length} {questions.length === 1 ? "question" : "questions"}
          {selectedSubject !== "all" && (
            <span className="ml-1 text-zinc-800 dark:text-zinc-200 font-semibold">
              in {selectedSubject}
            </span>
          )}
        </div>
        {selectedIds.size > 0 && (
          <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
            {selectedIds.size} selected
          </div>
        )}
      </div>

      {/* Question Cards Grid */}
      {filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white/50 dark:bg-zinc-900/40">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mb-3">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            No Questions Found
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try adjusting your search keywords or clearing active filters."
              : "Your question bank is currently empty. Start by importing questions with AI."}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearAllFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Reset All Filters
            </button>
          ) : (
            <button
              onClick={onNavigateToAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Import Questions Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onToggleImportant={toggleImportant}
              onEdit={onEditQuestion}
              onDelete={deleteQuestion}
              onFormatAnswer={(question) => setFormattingQuestion(question)}
              selectable={true}
              selected={selectedIds.has(q.id)}
              onToggleSelect={handleToggleSelect}
              defaultAnswerVisible={false}
              isStudyCheckpoint={studyCheckpointQuestionId === q.id}
              onToggleStudyCheckpoint={toggleStudyCheckpoint}
              isHighlighted={highlightedQuestionId === q.id}
            />
          ))}
        </div>
      )}

      {/* Floating Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div
          id="bulk-action-toolbar"
          className="fixed bottom-6 inset-x-4 max-w-xl mx-auto z-40 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shadow-xs">
                ✓
              </span>
              <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                {selectedIds.size} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={allVisibleSelected ? handleDeselectAll : handleSelectAllVisible}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
              >
                {allVisibleSelected ? "Deselect All" : `Select All (${filteredQuestions.length})`}
              </button>

              <button
                type="button"
                id="bulk-format-selected-btn"
                onClick={() => setIsBulkFormatting(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
                title="Format all selected answers with AI"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Format Answers</span>
              </button>

              <button
                type="button"
                id="delete-selected-btn"
                onClick={() => setIsConfirmingBulkDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {isConfirmingBulkDelete && (
        <div
          id="bulk-delete-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/50">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Delete {selectedIds.size} selected {selectedIds.size === 1 ? "question" : "questions"}?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              This will permanently delete the selected questions from your Firestore Question Vault. This action affects only questions belonging to your account and cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingBulk}
                onClick={() => setIsConfirmingBulkDelete(false)}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-bulk-delete-action-btn"
                disabled={isDeletingBulk}
                onClick={handleConfirmBulkDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-red-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeletingBulk ? "Deleting..." : `Delete ${selectedIds.size}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Format Single Answer Modal */}
      {formattingQuestion && (
        <FormatAnswerModal
          question={formattingQuestion}
          isOpen={Boolean(formattingQuestion)}
          onClose={() => setFormattingQuestion(null)}
          onApply={async (formattedMarkdown) => {
            await updateQuestion(formattingQuestion.id, {
              answerMarkdown: formattedMarkdown,
            });
            setFormattingQuestion(null);
          }}
        />
      )}

      {/* Bulk Format Answers Modal */}
      {isBulkFormatting && (
        <BulkFormatModal
          isOpen={isBulkFormatting}
          selectedQuestions={questions.filter((q) => selectedIds.has(q.id))}
          onClose={() => setIsBulkFormatting(false)}
          onUpdateQuestion={async (id, updates) => {
            await updateQuestion(id, updates);
          }}
          onComplete={() => {
            setSelectedIds(new Set());
          }}
        />
      )}
    </div>
  );
}

