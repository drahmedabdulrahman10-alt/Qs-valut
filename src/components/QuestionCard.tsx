/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Star,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  CheckCircle2,
  ListOrdered,
  HelpCircle,
  Clock,
  Sparkles,
  BookOpen,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Question } from "../types/question.ts";
import { FormattedAnswerView } from "./FormattedAnswerView.tsx";

interface QuestionCardProps {
  key?: React.Key;
  question: Question;
  onToggleImportant: (id: string) => void;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onFormatAnswer?: (question: Question) => void;
  defaultAnswerVisible?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectable?: boolean;
  isStudyCheckpoint?: boolean;
  onToggleStudyCheckpoint?: (id: string) => void;
  isHighlighted?: boolean;
}

export function QuestionCard({
  question,
  onToggleImportant,
  onEdit,
  onDelete,
  onFormatAnswer,
  defaultAnswerVisible = false,
  selected = false,
  onToggleSelect,
  selectable = false,
  isStudyCheckpoint = false,
  onToggleStudyCheckpoint,
  isHighlighted = false,
}: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(defaultAnswerVisible);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const typeColor =
    question.type === "mcq"
      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
      : question.type === "enumerate"
      ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";

  const typeLabel =
    question.type === "mcq"
      ? "MCQ"
      : question.type === "enumerate"
      ? "Enumerate"
      : "Short Answer";

  /**
   * Formats structured text preserving paragraphs, numbered lists, and bullet points
   */
  const renderFormattedAnswer = (text: string) => {
    // Check if text has multiple paragraphs or lines
    const paragraphs = text.split(/\r?\n\s*\r?\n/);

    return (
      <div className="space-y-2 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans" dir="auto">
        {paragraphs.map((paragraph, pIdx) => {
          const lines = paragraph.split(/\r?\n/).filter(Boolean);
          const isAllListItems = lines.length > 1 && lines.every((l) => /^(\d+[\.\)]|\-|\*|•)/.test(l.trim()));

          if (isAllListItems) {
            return (
              <div key={pIdx} className="space-y-1 pl-1">
                {lines.map((line, lIdx) => (
                  <div key={lIdx} className="flex items-start gap-2">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 select-none">
                      {line.match(/^(\d+[\.\)]|\-|\*|•)/)?.[0]}
                    </span>
                    <span className="flex-1">
                      {line.replace(/^(\d+[\.\)]|\-|\*|•)\s*/, "")}
                    </span>
                  </div>
                ))}
              </div>
            );
          }

          return (
            <p key={pIdx} className="whitespace-pre-line leading-relaxed">
              {paragraph}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <article
      id={`question-card-${question.id}`}
      className={`rounded-2xl border transition-all p-5 sm:p-6 shadow-xs ${
        isHighlighted
          ? "ring-4 ring-teal-400/80 dark:ring-teal-400/70 border-teal-500 bg-teal-50/20 dark:bg-teal-950/20 shadow-md scale-[1.01]"
          : isStudyCheckpoint
          ? "border-teal-300 dark:border-teal-700 bg-white dark:bg-zinc-900 shadow-xs"
          : selected
          ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:border-indigo-500 dark:ring-indigo-500/30 dark:bg-indigo-950/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:shadow-sm"
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {selectable && (
            <label
              htmlFor={`select-question-${question.id}`}
              className="flex items-center cursor-pointer select-none mr-1"
              title="Select question"
            >
              <input
                type="checkbox"
                id={`select-question-${question.id}`}
                checked={selected}
                onChange={() => onToggleSelect && onToggleSelect(question.id)}
                className="h-4 w-4 rounded-md border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer accent-indigo-600"
                aria-label={`Select question ${question.question.substring(0, 30)}`}
              />
            </label>
          )}
          {isStudyCheckpoint && (
            <span
              id={`checkpoint-badge-${question.id}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-teal-100/90 text-teal-800 border border-teal-300 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-700"
            >
              <BookmarkCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Study Checkpoint</span>
            </span>
          )}
          {question.subject && (
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              {question.subject}
            </span>
          )}
          <span
            className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-lg border ${typeColor}`}
          >
            {typeLabel}
          </span>
          {question.difficulty && (
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${
                question.difficulty === "easy"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : question.difficulty === "hard"
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {question.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onToggleStudyCheckpoint && (
            <button
              id={`checkpoint-btn-${question.id}`}
              type="button"
              onClick={() => onToggleStudyCheckpoint(question.id)}
              title={
                isStudyCheckpoint
                  ? "Active Study Checkpoint (tap to remove)"
                  : "Mark as Study Checkpoint (where I stopped studying)"
              }
              aria-label={
                isStudyCheckpoint
                  ? "Active Study Checkpoint (tap to remove)"
                  : "Mark as Study Checkpoint (where I stopped studying)"
              }
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isStudyCheckpoint
                  ? "text-teal-600 bg-teal-50 hover:bg-teal-100 dark:text-teal-300 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 ring-1 ring-teal-300 dark:ring-teal-700"
                  : "text-zinc-400 hover:text-teal-600 hover:bg-teal-50/60 dark:text-zinc-500 dark:hover:text-teal-400 dark:hover:bg-teal-950/40"
              }`}
            >
              {isStudyCheckpoint ? (
                <BookmarkCheck className="h-4 w-4 fill-current" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          )}

          <button
            id={`star-btn-${question.id}`}
            onClick={() => onToggleImportant(question.id)}
            title={question.important ? "Starred as Important" : "Mark as Important"}
            className={`p-1.5 rounded-lg transition-colors ${
              question.important
                ? "text-amber-500 hover:text-amber-600 dark:text-amber-400"
                : "text-zinc-400 hover:text-amber-500 dark:text-zinc-500 dark:hover:text-amber-400"
            }`}
          >
            <Star className={`h-4 w-4 ${question.important ? "fill-current" : ""}`} />
          </button>

          <button
            id={`edit-btn-${question.id}`}
            onClick={() => onEdit(question)}
            title="Edit question"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 rounded-lg transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/50 p-1 rounded-md border border-red-200 dark:border-red-900">
              <span className="text-[11px] font-medium text-red-700 dark:text-red-300 px-1">Delete?</span>
              <button
                id={`confirm-del-${question.id}`}
                onClick={() => onDelete(question.id)}
                className="text-xs px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded"
              >
                No
              </button>
            </div>
          ) : (
            <button
              id={`del-btn-${question.id}`}
              onClick={() => setConfirmDelete(true)}
              title="Delete question"
              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Prominent Question Section */}
      <div className="mb-4">
        <h3
          className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed font-sans"
          dir="auto"
        >
          {question.question}
        </h3>
      </div>

      {/* Options for MCQ */}
      {question.type === "mcq" && question.options && question.options.length > 0 && (
        <div className="mb-4 space-y-1.5 pl-1">
          {question.options.map((opt, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-800 dark:border-zinc-800/80 dark:bg-zinc-950/40 dark:text-zinc-300 font-sans"
              dir="auto"
            >
              {opt}
            </div>
          ))}
        </div>
      )}

      {/* Show / Hide Answer Button */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
        <button
          id={`toggle-answer-${question.id}`}
          onClick={() => setShowAnswer(!showAnswer)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          {showAnswer ? (
            <>
              <ChevronUp className="h-4 w-4" />
              <span>Hide Answer</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              <span>Show Answer</span>
            </>
          )}
        </button>

        {question.reviewCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            <Clock className="h-3 w-3" />
            <span>Reviewed {question.reviewCount}x</span>
          </span>
        )}
      </div>

      {/* Answer Section - Prominent Visual Separation */}
      {showAnswer && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 dark:border-emerald-900/60 dark:bg-emerald-950/25 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-emerald-200/60 dark:border-emerald-900/40">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950">
                Answer
              </span>
              {question.answerMarkdown && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3" />
                  Formatted
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {question.answerMarkdown && (
                <button
                  type="button"
                  onClick={() => setShowRaw(!showRaw)}
                  className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 underline cursor-pointer"
                >
                  {showRaw ? "Show Formatted" : "Show Raw"}
                </button>
              )}

              {onFormatAnswer && question.answer && (
                <button
                  type="button"
                  id={`format-answer-btn-${question.id}`}
                  onClick={() => onFormatAnswer(question)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 shadow-xs transition-colors cursor-pointer"
                  title="Format answer structure with headings and lists"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{question.answerMarkdown ? "Re-format" : "Format Answer"}</span>
                </button>
              )}
            </div>
          </div>

          {question.answer ? (
            showRaw ? (
              <div className="p-2 text-xs font-mono whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 bg-white/60 dark:bg-zinc-900/60 rounded-lg border border-zinc-200 dark:border-zinc-800" dir="auto">
                {question.answer}
              </div>
            ) : (
              <FormattedAnswerView
                content={question.answerMarkdown || question.answer}
                placeholder="No answer content provided."
              />
            )
          ) : (
            <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
              No answer was provided in the source material.
            </p>
          )}

          {question.explanation && (
            <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Explanation:
              </span>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans" dir="auto">
                {question.explanation}
              </p>
            </div>
          )}

          {question.source && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <BookOpen className="h-3 w-3 text-zinc-400" />
              <span>Source: {question.source}</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
