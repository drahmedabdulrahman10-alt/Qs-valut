import React, { useState, useEffect } from "react";
import { Sparkles, X, Check, ArrowRight, RefreshCw, AlertCircle, Eye, Code } from "lucide-react";
import { Question } from "../types/question.ts";
import { FormattedAnswerView } from "./FormattedAnswerView.tsx";
import { requestAnswerFormatting } from "../lib/answerFormattingService.ts";

interface FormatAnswerModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onApply: (formattedMarkdown: string) => Promise<void>;
}

export function FormatAnswerModal({
  question,
  isOpen,
  onClose,
  onApply,
}: FormatAnswerModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formattedText, setFormattedText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"rendered" | "raw">("rendered");
  const [providerUsed, setProviderUsed] = useState<string>("");
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const rawAnswer = question.answer || "";

  useEffect(() => {
    if (isOpen && rawAnswer) {
      // If the question already has an answerMarkdown, initialize with it or trigger fresh format
      startFormatting();
    }
  }, [isOpen, question.id]);

  const startFormatting = async () => {
    if (!rawAnswer.trim()) {
      setError("This question does not have an answer to format.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await requestAnswerFormatting(rawAnswer);
      setFormattedText(res.formattedAnswer);
      setProviderUsed(res.providerUsed);
    } catch (err: any) {
      console.error("Format error:", err);
      setError(err.message || "Failed to format answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!formattedText.trim()) return;
    setIsApplying(true);
    try {
      await onApply(formattedText);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save formatted answer.");
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="format-answer-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="format-answer-modal-card"
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                AI Answer Formatting
                {providerUsed && (
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    via {providerUsed}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Structures messy text into readable headings, numbered lists, and bullet points. Medical facts and wording remain strictly unchanged.
              </p>
            </div>
          </div>
          <button
            id="format-answer-modal-close-btn"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Prompt Snippet */}
        <div className="px-5 py-2.5 bg-zinc-100/70 dark:bg-zinc-800/40 border-b border-zinc-200/70 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">Question:</span>
          <span className="truncate italic">{question.question}</span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Formatting Notice</p>
                <p>{error}</p>
              </div>
              <button
                onClick={startFormatting}
                className="px-2 py-1 bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 text-rose-800 dark:text-rose-200 rounded-md font-medium text-[11px]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Side-by-side or stacked comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original Raw Answer */}
            <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/40">
              <div className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                <span>Original Answer (Unformatted)</span>
                <span className="text-[11px] font-normal text-zinc-400">
                  {rawAnswer.length} chars
                </span>
              </div>
              <div className="p-3.5 flex-1 max-h-[360px] overflow-y-auto text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed" dir="auto">
                {rawAnswer || <span className="italic text-zinc-400">Empty answer</span>}
              </div>
            </div>

            {/* Right: Formatted Output Preview */}
            <div className="flex flex-col border border-emerald-200 dark:border-emerald-900/60 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
              <div className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Formatted Result Preview
                </span>

                <div className="flex items-center gap-1 bg-emerald-100/60 dark:bg-emerald-900/60 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveTab("rendered")}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                      activeTab === "rendered"
                        ? "bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-xs"
                        : "text-emerald-800 dark:text-emerald-400 hover:text-emerald-950"
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("raw")}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                      activeTab === "raw"
                        ? "bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-xs"
                        : "text-emerald-800 dark:text-emerald-400 hover:text-emerald-950"
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    Markdown
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 max-h-[360px] overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-48 text-zinc-400 dark:text-zinc-500 gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs font-medium">
                      Structuring answer layout without altering any content...
                    </p>
                  </div>
                ) : activeTab === "rendered" ? (
                  <FormattedAnswerView
                    content={formattedText}
                    placeholder="No formatted result yet."
                  />
                ) : (
                  <textarea
                    value={formattedText}
                    onChange={(e) => setFormattedText(e.target.value)}
                    className="w-full h-full min-h-[220px] font-mono text-xs p-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    dir="auto"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
          <button
            id="format-answer-modal-regenerate-btn"
            type="button"
            onClick={startFormatting}
            disabled={loading || isApplying}
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Re-run formatting
          </button>

          <div className="flex items-center gap-2">
            <button
              id="format-answer-modal-cancel-btn"
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="format-answer-modal-apply-btn"
              type="button"
              onClick={handleApply}
              disabled={loading || isApplying || !formattedText.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Apply Formatting
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
