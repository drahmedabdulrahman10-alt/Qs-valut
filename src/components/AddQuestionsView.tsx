/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  FileText,
  Save,
  CheckCircle2,
  X,
  Key,
  ExternalLink,
  Edit3,
  Check,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ParsedDraftQuestion, QuestionType } from "../types/question.ts";
import { useQuestions } from "../context/QuestionsContext.tsx";
import { getStoredGeminiApiKey } from "../lib/apiKeyStorage.ts";
import { SubjectSelect } from "./SubjectSelect.tsx";
import { FormattedAnswerView } from "./FormattedAnswerView.tsx";

interface AddQuestionsViewProps {
  onSuccessNavigateToList: () => void;
  onSuccessNavigateToReview: () => void;
  onNavigateToSettings?: () => void;
}

const SAMPLE_NUTRITIONAL_SUPPORT = `Discuss nutritional support in surgical patients.

الإجابة المختصرة للامتحان:

1. Routes of nutritional support:
   - Enteral nutrition.
   - Parenteral nutrition.

2. Enteral nutrition:
   - Indicated when oral intake is impossible but the GIT can be used.
   - Access: NG tube, feeding gastrostomy, feeding jejunostomy, PEG.
   - Advantages: more physiological, safer, better tolerated, economical, and avoids IV-line complications.

3. Parenteral nutrition (TPN):
   - Provides nutritional requirements through IV route without using the GIT.
   - Indicated mainly in prolonged intestinal failure and hypercatabolic states.
   - Access: central or peripheral route.`;

const SAMPLE_HYPERPARATHYROIDISM = `A patient with chronic renal failure on dialysis is diagnosed with hyperparathyroidism. His serum calcium level is 16 mg/dL.

A) Enumerate types of hyperparathyroidism

B) What type of hyperparathyroidism is present in this case?

Answer:
A)
1. Primary
2. Secondary
3. Tertiary

B)
Tertiary hyperparathyroidism.`;

const SAMPLE_MCQ_BATCH = `What is the classic triad of normal pressure hydrocephalus (NPH)?
A. Fever, nuchal rigidity, altered mental status
B. Gait disturbance, dementia, urinary incontinence
C. Tremor, rigidity, bradykinesia
D. Headache, vomiting, papilledema
Answer: B
Explanation: NPH triad is popularly remembered as "wet, wobbly, and wacky".

Enumerate causes of acute pancreatitis.
Answer:
1. Gallstones (most common)
2. Alcohol abuse
3. Hypertriglyceridemia
4. Trauma or post-ERCP
5. Drugs (e.g. thiazides, azathioprine)`;

export function AddQuestionsView({
  onSuccessNavigateToList,
  onSuccessNavigateToReview,
  onNavigateToSettings,
}: AddQuestionsViewProps) {
  const { saveDrafts, checkDuplicate, recentSubjects } = useQuestions();

  const [rawText, setRawText] = useState("");
  const [defaultSubject, setDefaultSubject] = useState("");
  const [defaultSource, setDefaultSource] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedFallbackMode, setUsedFallbackMode] = useState(false);
  const [hasPersonalKey, setHasPersonalKey] = useState(false);

  // State for parsed questions in preview mode
  const [drafts, setDrafts] = useState<ParsedDraftQuestion[] | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccessCount, setSaveSuccessCount] = useState<number | null>(null);

  useEffect(() => {
    setHasPersonalKey(Boolean(getStoredGeminiApiKey()));
  }, []);

  const formatClientErrorMessage = (err: any): string => {
    if (!err) return "Failed to analyze questions. Please try again.";
    const raw = typeof err === "string" ? err : err.message || String(err);
    const jsonMatch = raw.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed?.error?.message) {
          if (parsed.error.code === 503 || parsed.error.status === "UNAVAILABLE") {
            return "The Gemini service is experiencing temporary high demand. Try again in a moment or verify your personal key in Settings.";
          }
          return parsed.error.message;
        }
      } catch {
        // ignore
      }
    }
    return raw;
  };

  // Handle Organize with AI
  const handleOrganizeWithAI = async () => {
    if (!rawText.trim()) {
      setError("Please paste question text or lecture notes first.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setUsedFallbackMode(false);

    const personalKey = getStoredGeminiApiKey();

    try {
      const res = await fetch("/api/parse-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(personalKey ? { "x-gemini-api-key": personalKey } : {}),
        },
        body: JSON.stringify({
          text: rawText.trim(),
          defaultSubject: defaultSubject.trim() || undefined,
          defaultSource: defaultSource.trim() || undefined,
          apiKey: personalKey || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with error status ${res.status}`);
      }

      const data = await res.json();
      const rawParsed = data.questions || [];

      if (rawParsed.length === 0) {
        setError("Could not detect distinct questions in the provided text. Please check the text format.");
        setAnalyzing(false);
        return;
      }

      setUsedFallbackMode(Boolean(data.usedFallback));

      // Process drafts and run duplicate detection against user's vault
      const processedDrafts: ParsedDraftQuestion[] = rawParsed.map(
        (item: any, idx: number) => {
          const dupCheck = checkDuplicate(item.question);
          return {
            id: `draft_${Date.now()}_${idx}`,
            type: item.type as QuestionType,
            question: item.question,
            options: item.options || [],
            answer: item.answer || null,
            answerMarkdown: item.answerMarkdown || null,
            explanation: item.explanation || null,
            subject: defaultSubject.trim() || item.suggestedSubject || "General",
            source: defaultSource.trim() || item.source || null,
            tags: [],
            isDuplicate: dupCheck.isDuplicate,
            existingId: dupCheck.existingQuestion?.id,
            skip: false,
          };
        }
      );

      setDrafts(processedDrafts);
    } catch (err: any) {
      console.error("AI parsing failed:", err);
      setError(formatClientErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  // Draft edits
  const handleUpdateDraft = (index: number, updates: Partial<ParsedDraftQuestion>) => {
    if (!drafts) return;
    const updated = [...drafts];
    updated[index] = { ...updated[index], ...updates };
    setDrafts(updated);
  };

  const handleDeleteDraft = (index: number) => {
    if (!drafts) return;
    const updated = drafts.filter((_, i) => i !== index);
    setDrafts(updated.length > 0 ? updated : null);
  };

  const handleToggleSkip = (index: number) => {
    if (!drafts) return;
    const updated = [...drafts];
    updated[index].skip = !updated[index].skip;
    setDrafts(updated);
  };

  // Options edit helpers for draft MCQs
  const handleAddDraftOption = (draftIndex: number) => {
    if (!drafts) return;
    const draft = drafts[draftIndex];
    const currentOptions = draft.options || [];
    const nextLetter = String.fromCharCode(65 + currentOptions.length);
    handleUpdateDraft(draftIndex, {
      options: [...currentOptions, `${nextLetter}. `],
    });
  };

  const handleUpdateDraftOption = (draftIndex: number, optIndex: number, val: string) => {
    if (!drafts) return;
    const currentOptions = [...(drafts[draftIndex].options || [])];
    currentOptions[optIndex] = val;
    handleUpdateDraft(draftIndex, { options: currentOptions });
  };

  const handleDeleteDraftOption = (draftIndex: number, optIndex: number) => {
    if (!drafts) return;
    const currentOptions = (drafts[draftIndex].options || []).filter((_, i) => i !== optIndex);
    handleUpdateDraft(draftIndex, { options: currentOptions });
  };

  // Batch save to Firestore
  const handleSaveAll = async () => {
    if (!drafts || drafts.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const count = await saveDrafts(drafts);
      setSaveSuccessCount(count);
      setDrafts(null);
      setRawText("");
    } catch (err: any) {
      console.error("Batch save error:", err);
      setError(err?.message || "Failed to save questions to Cloud Firestore.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Formats answer preserving lists and paragraphs
   */
  const renderPreviewAnswer = (answerText: string | null) => {
    if (!answerText || !answerText.trim()) {
      return (
        <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
          No answer was provided in the source material.
        </p>
      );
    }

    const paragraphs = answerText.split(/\r?\n\s*\r?\n/);
    return (
      <div className="space-y-2 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans" dir="auto">
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

  // Success screen
  if (saveSuccessCount !== null) {
    return (
      <div className="mx-auto max-w-2xl py-12 px-4 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Successfully Saved {saveSuccessCount} {saveSuccessCount === 1 ? "Question" : "Questions"}!
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Your questions have been structured, indexed, and synchronized to your private Cloud Firestore vault.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setSaveSuccessCount(null);
              setRawText("");
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add More Questions</span>
          </button>

          <button
            onClick={onSuccessNavigateToList}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <FileText className="h-4 w-4" />
            <span>View in Question Bank</span>
          </button>

          <button
            onClick={onSuccessNavigateToReview}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs"
          >
            <ArrowRight className="h-4 w-4" />
            <span>Start Flashcard Review</span>
          </button>
        </div>
      </div>
    );
  }

  // Preview Mode: Shows Reconstructed Question & Answer Pairs
  if (drafts) {
    const activeCount = drafts.filter((d) => !d.skip).length;

    return (
      <div className="mx-auto max-w-4xl py-6 px-4 sm:px-6">
        {/* Top summary bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {usedFallbackMode ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Organized via Smart Semantic Matcher</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Gemini AI Extraction Complete</span>
                </span>
              )}

              {hasPersonalKey && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Key className="h-3 w-3 text-emerald-600" />
                  <span>Personal Key</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              Gemini organized {drafts.length} {drafts.length === 1 ? "question" : "questions"}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Review each reconstructed question and its attached answer before saving to your vault.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="reorganize-with-gemini-btn"
              onClick={handleOrganizeWithAI}
              disabled={analyzing}
              title="Re-run Gemini semantic parser on the original pasted text"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-xl border border-zinc-300 dark:border-zinc-700 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${analyzing ? "animate-spin" : ""}`} />
              <span>{analyzing ? "Reprocessing..." : "Re-organize with Gemini"}</span>
            </button>

            <button
              onClick={() => setDrafts(null)}
              className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Discard & Re-paste
            </button>

            <button
              id="save-all-drafts-btn"
              onClick={handleSaveAll}
              disabled={saving || activeCount === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving to Vault..." : `Save All (${activeCount})`}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* List of Reconstructed Question / Answer Pairs */}
        <div className="space-y-6">
          {drafts.map((draft, idx) => {
            const isEditing = editingCardId === draft.id;
            const typeLabel =
              draft.type === "mcq"
                ? "MCQ"
                : draft.type === "enumerate"
                ? "Enumerate"
                : "Short Answer";

            const typeBadgeStyle =
              draft.type === "mcq"
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                : draft.type === "enumerate"
                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";

            return (
              <div
                key={draft.id}
                id={`draft-card-${idx}`}
                className={`rounded-2xl border transition-all ${
                  draft.skip
                    ? "border-zinc-200 bg-zinc-100/50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/25"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs"
                } p-5 sm:p-6`}
              >
                {/* Draft Top Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Question {idx + 1}
                    </span>

                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-md border ${typeBadgeStyle}`}
                    >
                      {typeLabel}
                    </span>

                    {draft.subject && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {draft.subject}
                      </span>
                    )}

                    {draft.source && (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        ({draft.source})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {draft.isDuplicate && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Possible duplicate</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleSkip(idx)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                        draft.skip
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      }`}
                    >
                      {draft.skip ? "Include" : "Skip"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingCardId(isEditing ? null : draft.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750 transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>{isEditing ? "Done" : "Edit"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(idx)}
                      title="Delete question from import"
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Edit Form Mode */}
                {isEditing ? (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                          Question Type
                        </label>
                        <select
                          value={draft.type}
                          onChange={(e) =>
                            handleUpdateDraft(idx, { type: e.target.value as QuestionType })
                          }
                          className="w-full rounded-lg border border-zinc-300 bg-white py-1.5 px-2.5 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          <option value="mcq">MCQ (Multiple Choice)</option>
                          <option value="short_answer">Short Answer</option>
                          <option value="enumerate">Enumerate / List</option>
                        </select>
                      </div>

                      <div>
                        <SubjectSelect
                          id={`draft-subject-${idx}`}
                          label="Subject"
                          value={draft.subject}
                          onChange={(val) => handleUpdateDraft(idx, { subject: val })}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                          Source
                        </label>
                        <input
                          type="text"
                          value={draft.source || ""}
                          onChange={(e) =>
                            handleUpdateDraft(idx, {
                              source: e.target.value.trim() ? e.target.value : null,
                            })
                          }
                          placeholder="e.g. Surgery Lecture 3"
                          className="w-full rounded-lg border border-zinc-300 bg-white py-1.5 px-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                        Question Prompt
                      </label>
                      <textarea
                        rows={2}
                        value={draft.question}
                        onChange={(e) => handleUpdateDraft(idx, { question: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>

                    {/* Options for MCQ */}
                    {draft.type === "mcq" && (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Multiple Choice Options
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddDraftOption(idx)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                          >
                            + Add Option
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {(draft.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) =>
                                  handleUpdateDraftOption(idx, optIdx, e.target.value)
                                }
                                className="flex-1 rounded-lg border border-zinc-300 bg-white py-1.5 px-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteDraftOption(idx, optIdx)}
                                className="p-1 text-zinc-400 hover:text-red-500"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-1">
                        Answer Content
                      </label>
                      <textarea
                        rows={draft.type === "enumerate" ? 4 : 3}
                        value={draft.answer || ""}
                        onChange={(e) =>
                          handleUpdateDraft(idx, {
                            answer: e.target.value.trim() ? e.target.value : null,
                          })
                        }
                        placeholder="Answer content from notes (supports lists, bullets, and paragraphs)..."
                        className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-xs sm:text-sm font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                        Explanation (Optional)
                      </label>
                      <input
                        type="text"
                        value={draft.explanation || ""}
                        onChange={(e) =>
                          handleUpdateDraft(idx, {
                            explanation: e.target.value.trim() ? e.target.value : null,
                          })
                        }
                        placeholder="Explanation from source notes..."
                        className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingCardId(null)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Done Editing</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Reconstructed Pair View */
                  <div>
                    {/* Prominent Question */}
                    <div className="mb-4">
                      <p
                        className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed font-sans"
                        dir="auto"
                      >
                        {draft.question}
                      </p>
                    </div>

                    {/* MCQ Options Display */}
                    {draft.type === "mcq" && draft.options && draft.options.length > 0 && (
                      <div className="mb-4 space-y-1.5 pl-1">
                        {draft.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2 text-xs sm:text-sm text-zinc-800 dark:border-zinc-800/80 dark:bg-zinc-950/40 dark:text-zinc-300"
                            dir="auto"
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Distinct Reconstructed Answer Section */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-emerald-200/60 dark:border-emerald-900/40">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950">
                          Answer
                        </span>
                        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                          Extracted from notes
                        </span>
                      </div>

                      {draft.answerMarkdown ? (
                        <FormattedAnswerView content={draft.answerMarkdown} />
                      ) : (
                        renderPreviewAnswer(draft.answer)
                      )}

                      {draft.explanation && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40">
                          <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-0.5">
                            Explanation:
                          </span>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed" dir="auto">
                            {draft.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Save Bar */}
        <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <button
            onClick={() => setDrafts(null)}
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Cancel & Back to Input
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving || activeCount === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs transition-all"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving to Vault..." : `Save All (${activeCount})`}</span>
          </button>
        </div>
      </div>
    );
  }

  // Input Mode
  return (
    <div className="mx-auto max-w-4xl py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Add Questions
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Paste study material, medical case discussions, or exam questions. Gemini will analyze the semantic relationship and pair questions with their answers.
        </p>
      </div>

      {/* Gemini API Status Pill */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                Gemini Intelligence Layer
              </span>
              {hasPersonalKey ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <Check className="h-3 w-3" />
                  <span>Personal API Key Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <span>Workspace Key</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {hasPersonalKey
                ? "Your personal Gemini API key is configured for dedicated quota."
                : "Using workspace inference key. Add your personal key in Settings for dedicated personal quota."}
            </p>
          </div>
        </div>

        {onNavigateToSettings ? (
          <button
            type="button"
            onClick={onNavigateToSettings}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <Key className="h-3.5 w-3.5 text-zinc-500" />
            <span>{hasPersonalKey ? "Manage Key" : "Configure Personal Key"}</span>
          </button>
        ) : (
          <a
            href="#settings"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("navigate-tab", { detail: "settings" }));
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <Key className="h-3.5 w-3.5 text-zinc-500" />
            <span>{hasPersonalKey ? "Manage Key" : "Configure Key in Settings"}</span>
          </a>
        )}
      </div>

      {/* Main Input Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        {/* Subject & Source Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <SubjectSelect
              id="default-subject-input"
              label="Default Subject (Applied to all questions in batch)"
              value={defaultSubject}
              onChange={(val) => setDefaultSubject(val)}
            />
          </div>

          <div>
            <label
              htmlFor="default-source-input"
              className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1"
            >
              Default Source / Reference (Optional)
            </label>
            <input
              id="default-source-input"
              type="text"
              value={defaultSource}
              onChange={(e) => setDefaultSource(e.target.value)}
              placeholder="e.g. Final Exam 2024, Bailey & Love, Robbins"
              className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Textarea for pasted study material */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="raw-question-text"
              className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200"
            >
              Paste Questions & Study Material
            </label>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {rawText.length.toLocaleString()} characters
            </span>
          </div>

          <textarea
            id="raw-question-text"
            rows={10}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Paste messy study material here...\n\nExample:\nDiscuss nutritional support in surgical patients.\nShort answer:\n1. Routes of nutritional support: Enteral and Parenteral...\n\nOr MCQs:\nWhat is the classic diagnostic pentad of TTP?\nA. ...\nB. ...\nAnswer: B`}
            className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-100 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:border-zinc-400 font-sans"
            dir="auto"
          />
        </div>

        {/* Quick Sample Prompts */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Load sample:</span>
          <button
            type="button"
            onClick={() => {
              setRawText(SAMPLE_NUTRITIONAL_SUPPORT);
              setDefaultSubject("Surgery");
              setDefaultSource("Surgical Notes");
            }}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Surgical Nutrition (Test 1)
          </button>
          <button
            type="button"
            onClick={() => {
              setRawText(SAMPLE_HYPERPARATHYROIDISM);
              setDefaultSubject("Nephrology");
              setDefaultSource("Case Study");
            }}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-300"
          >
            CRF Hyperparathyroidism (Test 2)
          </button>
          <button
            type="button"
            onClick={() => {
              setRawText(SAMPLE_MCQ_BATCH);
              setDefaultSubject("Medicine");
              setDefaultSource("Board Review");
            }}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Mixed MCQs & Enumerate
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => {
              setRawText("");
              setError(null);
            }}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Clear Input
          </button>

          <button
            id="organize-with-ai-btn"
            type="button"
            onClick={handleOrganizeWithAI}
            disabled={analyzing || !rawText.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs transition-all"
          >
            <Sparkles className={`h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
            <span>{analyzing ? "Organizing with Gemini..." : "Organize with Gemini"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
