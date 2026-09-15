import React, { useState } from "react";
import { X, Plus, Trash2, Save, Star, Sparkles, RefreshCw, Eye, FileText } from "lucide-react";
import { Question, QuestionType, QuestionDifficulty } from "../types/question.ts";
import { SubjectSelect } from "./SubjectSelect.tsx";
import { FormattedAnswerView } from "./FormattedAnswerView.tsx";
import { requestAnswerFormatting } from "../lib/answerFormattingService.ts";

interface EditQuestionModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Question>) => Promise<void>;
  availableSubjects: string[];
}

export function EditQuestionModal({
  question,
  isOpen,
  onClose,
  onSave,
  availableSubjects,
}: EditQuestionModalProps) {
  if (!isOpen) return null;

  const [type, setType] = useState<QuestionType>(question.type);
  const [questionText, setQuestionText] = useState(question.question);
  const [options, setOptions] = useState<string[]>(question.options || []);
  const [answer, setAnswer] = useState(question.answer || "");
  const [answerMarkdown, setAnswerMarkdown] = useState(question.answerMarkdown || "");
  const [answerViewMode, setAnswerViewMode] = useState<"edit_raw" | "edit_markdown" | "preview">(
    question.answerMarkdown ? "preview" : "edit_raw"
  );
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattingError, setFormattingError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState(question.explanation || "");
  const [subject, setSubject] = useState(question.subject || "");
  const [source, setSource] = useState(question.source || "");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(question.difficulty || "medium");
  const [important, setImportant] = useState(question.important);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormatAnswer = async () => {
    const textToFormat = answer.trim() || answerMarkdown.trim();
    if (!textToFormat) return;
    setIsFormatting(true);
    setFormattingError(null);
    try {
      const res = await requestAnswerFormatting(textToFormat);
      setAnswerMarkdown(res.formattedAnswer);
      setAnswerViewMode("preview");
    } catch (err: any) {
      setFormattingError(err.message || "Failed to format answer.");
    } finally {
      setIsFormatting(false);
    }
  };

  const handleAddOption = () => {
    const nextChar = String.fromCharCode(65 + options.length);
    setOptions([...options, `${nextChar}. `]);
  };

  const handleUpdateOption = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setError("Question text cannot be empty.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(question.id, {
        type,
        question: questionText.trim(),
        options: type === "mcq" ? options.filter((o) => o.trim().length > 0) : null,
        answer: answer.trim() ? answer.trim() : null,
        answerMarkdown: answerMarkdown.trim() ? answerMarkdown.trim() : null,
        explanation: explanation.trim() ? explanation.trim() : null,
        subject: subject.trim() || "General",
        source: source.trim() ? source.trim() : null,
        difficulty,
        important,
      });
      onClose();
    } catch (err: any) {
      console.error("Failed to save question edits:", err);
      setError(err?.message || "Failed to update question.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="edit-question-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Edit Question
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Type and Difficulty Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Question Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="mcq">MCQ (Multiple Choice)</option>
                <option value="short_answer">Short Answer</option>
                <option value="enumerate">Enumerate / List</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="flex items-end pb-1">
              <button
                type="button"
                onClick={() => setImportant(!important)}
                className={`flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  important
                    ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <Star className={`h-4 w-4 ${important ? "fill-amber-500 text-amber-500" : ""}`} />
                <span>{important ? "Starred Important" : "Mark Important"}</span>
              </button>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Question Text *
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 font-serif-study"
              placeholder="Enter the question prompt..."
              required
            />
          </div>

          {/* Options for MCQ */}
          {type === "mcq" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Multiple Choice Options
                </span>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Choice</span>
                </button>
              </div>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleUpdateOption(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Provided Answer
              </label>

              <div className="flex items-center gap-1.5">
                {/* Mode switcher */}
                <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-900 text-xs">
                  <button
                    type="button"
                    onClick={() => setAnswerViewMode("edit_raw")}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      answerViewMode === "edit_raw"
                        ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    Raw Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswerViewMode("edit_markdown")}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      answerViewMode === "edit_markdown"
                        ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswerViewMode("preview")}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      answerViewMode === "preview"
                        ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    Preview
                  </button>
                </div>

                <button
                  type="button"
                  id="modal-ai-format-btn"
                  onClick={handleFormatAnswer}
                  disabled={isFormatting || (!answer.trim() && !answerMarkdown.trim())}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:text-zinc-950 shadow-xs transition-colors cursor-pointer"
                  title="Improve formatting into clean headings and lists with AI"
                >
                  <Sparkles className={`h-3 w-3 ${isFormatting ? "animate-spin" : ""}`} />
                  <span>{isFormatting ? "Formatting..." : "AI Format"}</span>
                </button>
              </div>
            </div>

            {formattingError && (
              <p className="text-xs text-red-600 dark:text-red-400">{formattingError}</p>
            )}

            {answerViewMode === "edit_raw" && (
              <textarea
                rows={type === "enumerate" ? 4 : 3}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 font-sans"
                placeholder={
                  type === "enumerate"
                    ? "1. Item one\n2. Item two\n3. Item three"
                    : type === "mcq"
                    ? "e.g. C or C. Secondary Hyperparathyroidism"
                    : "Enter expected answer..."
                }
              />
            )}

            {answerViewMode === "edit_markdown" && (
              <div>
                <textarea
                  rows={6}
                  value={answerMarkdown}
                  onChange={(e) => setAnswerMarkdown(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 p-2.5 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="## Heading\n\n1. Point one\n2. Point two..."
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Structured markdown representation of the answer.
                </p>
              </div>
            )}

            {answerViewMode === "preview" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <FormattedAnswerView
                  content={answerMarkdown || answer}
                  placeholder="No answer content to preview."
                />
              </div>
            )}
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Explanation / Context (Optional)
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Add explanation or lecture notes rationale..."
            />
          </div>

          {/* Subject and Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <SubjectSelect
                id="edit-modal-subject-select"
                label="Subject"
                value={subject}
                onChange={(val) => setSubject(val)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Source Document / Note
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Renal Block Notes, Quiz 3"
                className="w-full rounded-lg border border-zinc-300 py-2 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
