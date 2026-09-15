import React, { useState } from "react";
import { Sparkles, X, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Question } from "../types/question.ts";
import { requestAnswerFormatting } from "../lib/answerFormattingService.ts";

interface BulkFormatModalProps {
  isOpen: boolean;
  selectedQuestions: Question[];
  onClose: () => void;
  onUpdateQuestion: (id: string, updates: Partial<Question>) => Promise<void>;
  onComplete: () => void;
}

export function BulkFormatModal({
  isOpen,
  selectedQuestions,
  onClose,
  onUpdateQuestion,
  onComplete,
}: BulkFormatModalProps) {
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [skippedCount, setSkippedCount] = useState<number>(0);
  const [errors, setErrors] = useState<{ id: string; error: string }[]>([]);

  if (!isOpen) return null;

  const handleStartFormatting = async () => {
    setInProgress(true);
    setCompleted(false);
    setCurrentIndex(0);
    setSuccessCount(0);
    setSkippedCount(0);
    setErrors([]);

    let successful = 0;
    let skipped = 0;
    const errorList: { id: string; error: string }[] = [];

    for (let i = 0; i < selectedQuestions.length; i++) {
      const q = selectedQuestions[i];
      setCurrentIndex(i + 1);

      if (!q.answer || !q.answer.trim()) {
        skipped++;
        setSkippedCount(skipped);
        continue;
      }

      try {
        const res = await requestAnswerFormatting(q.answer);
        if (res.formattedAnswer) {
          await onUpdateQuestion(q.id, {
            answerMarkdown: res.formattedAnswer,
          });
          successful++;
          setSuccessCount(successful);
        } else {
          skipped++;
          setSkippedCount(skipped);
        }
      } catch (err: any) {
        console.error(`Failed to format question ${q.id}:`, err);
        errorList.push({ id: q.id, error: err.message || "Failed" });
        setErrors([...errorList]);
      }

      // Brief breathing room between requests to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setInProgress(false);
    setCompleted(true);
    onComplete();
  };

  const total = selectedQuestions.length;
  const progressPercent = total > 0 ? Math.round((currentIndex / total) * 100) : 0;

  return (
    <div
      id="bulk-format-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="bulk-format-modal-card"
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white">
                Format Selected Answers
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {total} question{total === 1 ? "" : "s"} selected
              </p>
            </div>
          </div>
          {!inProgress && (
            <button
              id="bulk-format-modal-close-btn"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {!inProgress && !completed && (
            <>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                The formatting system will restructure the answers of the <strong>{total}</strong> selected questions into clean Markdown with bold headings, numbered steps, and bullet lists.
              </p>
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold">Content Guarantee:</span> Medical facts, terminology, and wording remain strictly intact. Questions without an answer will be safely skipped.
              </div>
            </>
          )}

          {inProgress && (
            <div className="space-y-4 py-3">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Formatting {currentIndex} of {total}...
                </span>
                <span>{progressPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-[11px] text-zinc-400 text-center">
                Please keep this window open while formatting is in progress.
              </p>
            </div>
          )}

          {completed && (
            <div className="space-y-3 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white">
                Formatting Completed
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Formatted <strong>{successCount}</strong> answer{successCount === 1 ? "" : "s"} successfully.
                {skippedCount > 0 && ` (${skippedCount} skipped due to empty answers)`}
              </p>

              {errors.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 text-left">
                  <div className="flex items-center gap-1.5 font-medium mb-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.length} question(s) encountered an issue and kept their original answer.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
          {!inProgress && !completed && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                id="start-bulk-format-btn"
                type="button"
                onClick={handleStartFormatting}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Start Formatting
              </button>
            </>
          )}

          {completed && (
            <button
              id="bulk-format-done-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-xs"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
