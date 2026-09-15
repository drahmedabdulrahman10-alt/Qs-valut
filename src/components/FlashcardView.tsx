import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  Star,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Eye,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { Question, QuestionDifficulty } from "../types/question.ts";
import { useQuestions } from "../context/QuestionsContext.tsx";
import { FormattedAnswerView } from "./FormattedAnswerView.tsx";

interface FlashcardViewProps {
  onNavigateToAdd: () => void;
}

export function FlashcardView({ onNavigateToAdd }: FlashcardViewProps) {
  const { questions, subjects, toggleImportant, recordReview } = useQuestions();

  // Review Pool Filters
  const [poolFilter, setPoolFilter] = useState<"all" | "needs_review" | "important">("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Deck state
  const [deck, setDeck] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filter pool questions
  const filteredPool = useMemo(() => {
    return questions.filter((q) => {
      if (poolFilter === "important" && !q.important) return false;
      if (poolFilter === "needs_review" && q.reviewCount > 0 && q.difficulty !== "hard") {
        return false;
      }
      if (selectedSubject !== "all" && q.subject !== selectedSubject) return false;
      return true;
    });
  }, [questions, poolFilter, selectedSubject]);

  // Sync deck when filtered pool changes
  useEffect(() => {
    setDeck(filteredPool);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [filteredPool]);

  // Shuffle deck
  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const currentCard = deck[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, deck.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleRate = async (difficulty: QuestionDifficulty) => {
    if (!currentCard) return;
    await recordReview(currentCard.id, difficulty);
    // Smoothly transition to next card if available
    if (currentIndex < deck.length - 1) {
      handleNext();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (isFlipped) {
        if (e.key === "1") handleRate("easy");
        if (e.key === "2") handleRate("medium");
        if (e.key === "3") handleRate("hard");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, handleNext, handlePrev, currentCard]);

  if (deck.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-12 px-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-850 dark:text-zinc-400 mb-4">
          <Layers className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          No Flashcards Match Your Filter
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-zinc-500">
          {questions.length === 0
            ? "Your Question Vault is empty. Paste and organize study notes first."
            : "Try adjusting your review filters or resetting to 'All Questions'."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {questions.length > 0 ? (
            <button
              onClick={() => {
                setPoolFilter("all");
                setSelectedSubject("all");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset Filters</span>
            </button>
          ) : (
            <button
              onClick={onNavigateToAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              <span>Add First Questions</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / deck.length) * 100);

  return (
    <div className="mx-auto max-w-3xl py-6 px-4 sm:px-6 space-y-6">
      {/* Top Controls: Filter Deck */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={poolFilter}
            onChange={(e) => setPoolFilter(e.target.value as any)}
            className="rounded-lg border border-zinc-200 bg-white py-1.5 px-3 text-xs font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 shadow-xs"
          >
            <option value="all">All Questions ({questions.length})</option>
            <option value="needs_review">Needs Review</option>
            <option value="important">Important Only ⭐</option>
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white py-1.5 px-3 text-xs font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 shadow-xs"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name} ({s.count})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            title="Shuffle deck"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 shadow-xs"
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
          <span>
            Card {currentIndex + 1} of {deck.length}
          </span>
          <span>{progressPercent}% completed</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-zinc-900 dark:bg-zinc-200 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Flashcard Card Display */}
      <div
        id={`flashcard-${currentCard.id}`}
        className="min-h-[380px] rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between dark:border-zinc-800 dark:bg-zinc-900 transition-all"
      >
        {/* Card Header */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                {currentCard.subject || "General"}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400 uppercase tracking-wider">
                {currentCard.type}
              </span>
            </div>

            <button
              onClick={() => toggleImportant(currentCard.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                currentCard.important
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-zinc-300 hover:text-amber-500 dark:text-zinc-600"
              }`}
              title={currentCard.important ? "Starred as Important" : "Mark as Important"}
            >
              <Star className={`h-5 w-5 ${currentCard.important ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Question Text */}
          <div className="my-3">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Question
            </span>
            <p className="font-serif-study text-lg sm:text-xl font-normal leading-relaxed text-zinc-900 dark:text-zinc-100">
              {currentCard.question}
            </p>
          </div>

          {/* If MCQ, show choices on front so user can reflect */}
          {currentCard.type === "mcq" && currentCard.options && currentCard.options.length > 0 && (
            <div className="mt-4 space-y-2">
              {currentCard.options.map((opt, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3.5 py-2 text-xs sm:text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300"
                >
                  {opt}
                </div>
              ))}
            </div>
          )}

          {/* Revealed Answer Box */}
          {isFlipped && (
            <div className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/25 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Verified Answer</span>
              </div>

              {currentCard.answer ? (
                <FormattedAnswerView
                  content={currentCard.answerMarkdown || currentCard.answer}
                  placeholder="No answer recorded."
                />
              ) : (
                <p className="text-xs italic text-zinc-500">
                  No answer was recorded in the original notes.
                </p>
              )}

              {currentCard.explanation && (
                <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40">
                  <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Explanation:
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {currentCard.explanation}
                  </p>
                </div>
              )}

              {currentCard.source && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Source: {currentCard.source}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action / Reveal Button */}
        <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80">
          {!isFlipped ? (
            <button
              id="reveal-answer-btn"
              onClick={() => setIsFlipped(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Reveal Answer (Press Space)</span>
            </button>
          ) : (
            <div className="space-y-3">
              <span className="block text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Rate Question Difficulty
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="rate-easy-btn"
                  onClick={() => handleRate("easy")}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/60 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70 transition-colors"
                >
                  Easy (1)
                </button>
                <button
                  id="rate-med-btn"
                  onClick={() => handleRate("medium")}
                  className="rounded-xl border border-amber-200 bg-amber-50/60 py-2.5 text-xs sm:text-sm font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70 transition-colors"
                >
                  Medium (2)
                </button>
                <button
                  id="rate-hard-btn"
                  onClick={() => handleRate("hard")}
                  className="rounded-xl border border-rose-200 bg-rose-50/60 py-2.5 text-xs sm:text-sm font-bold text-rose-800 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70 transition-colors"
                >
                  Hard (3)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 shadow-xs"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous (Left Arrow)</span>
        </button>

        <span className="text-xs text-zinc-400 hidden sm:inline">
          Space: flip card • Arrows: navigate
        </span>

        <button
          onClick={handleNext}
          disabled={currentIndex === deck.length - 1}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 shadow-xs"
        >
          <span>Next (Right Arrow)</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
