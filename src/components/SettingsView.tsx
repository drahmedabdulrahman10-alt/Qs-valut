/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Key,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Save,
  Trash2,
  ExternalLink,
  Shield,
  Database,
  User as UserIcon,
  Check,
  RefreshCw,
  FolderOpen,
  Plus,
  Edit2,
  X,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { useQuestions } from "../context/QuestionsContext.tsx";
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  clearStoredGeminiApiKey,
  getStoredOpenRouterApiKey,
  setStoredOpenRouterApiKey,
  clearStoredOpenRouterApiKey,
  getStoredAiProvider,
  setStoredAiProvider,
  getStoredOpenRouterModel,
  setStoredOpenRouterModel,
  AiProvider,
} from "../lib/apiKeyStorage.ts";

export function SettingsView() {
  const { user } = useAuth();
  const {
    questions,
    subjects,
    userSubjects,
    addUserSubject,
    renameUserSubject,
    deleteUserSubject,
  } = useQuestions();

  const [activeProvider, setActiveProvider] = useState<AiProvider>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  // OpenRouter state
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [openRouterModel, setOpenRouterModel] = useState("google/gemini-2.5-flash");
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [openRouterTesting, setOpenRouterTesting] = useState(false);
  const [openRouterTestResult, setOpenRouterTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [openRouterSavedNotice, setOpenRouterSavedNotice] = useState(false);

  // Subject management state
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [subjectActionLoading, setSubjectActionLoading] = useState(false);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [subjectSuccess, setSubjectSuccess] = useState<string | null>(null);

  // Renaming state
  const [editingSubjectOldName, setEditingSubjectOldName] = useState<string | null>(null);
  const [editingSubjectNewName, setEditingSubjectNewName] = useState("");

  // Deleting confirmation state
  const [deletingSubjectName, setDeletingSubjectName] = useState<string | null>(null);

  useEffect(() => {
    const saved = getStoredGeminiApiKey();
    setApiKey(saved);

    const savedOpenRouter = getStoredOpenRouterApiKey();
    setOpenRouterKey(savedOpenRouter);

    const savedProvider = getStoredAiProvider();
    setActiveProvider(savedProvider);

    const savedModel = getStoredOpenRouterModel();
    setOpenRouterModel(savedModel);
  }, []);

  const handleProviderChange = (newProvider: AiProvider) => {
    setActiveProvider(newProvider);
    setStoredAiProvider(newProvider);
  };

  const handleTestKey = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/test-gemini-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: "✓ Gemini API connection successful.",
        });
      } else {
        setTestResult({
          success: false,
          message: data.message
            ? `✕ ${data.message}`
            : "✕ Gemini API key is invalid or unavailable.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `✕ Network error: ${err.message || "Failed to reach server"}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveKey = () => {
    setStoredGeminiApiKey(apiKey.trim());
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
    // Automatically trigger test if key is not empty
    if (apiKey.trim()) {
      handleTestKey();
    } else {
      setTestResult(null);
    }
  };

  const handleClearKey = () => {
    clearStoredGeminiApiKey();
    setApiKey("");
    setTestResult(null);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleTestOpenRouterKey = async () => {
    setOpenRouterTesting(true);
    setOpenRouterTestResult(null);

    try {
      const res = await fetch("/api/test-openrouter-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: openRouterKey.trim(),
          model: openRouterModel.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOpenRouterTestResult({
          success: true,
          message: `✓ OpenRouter connection successful (${data.model || openRouterModel}).`,
        });
      } else {
        setOpenRouterTestResult({
          success: false,
          message: data.message
            ? `✕ ${data.message}`
            : "✕ OpenRouter API key is invalid or unavailable.",
        });
      }
    } catch (err: any) {
      setOpenRouterTestResult({
        success: false,
        message: `✕ Network error: ${err.message || "Failed to reach server"}`,
      });
    } finally {
      setOpenRouterTesting(false);
    }
  };

  const handleSaveOpenRouterKey = () => {
    setStoredOpenRouterApiKey(openRouterKey.trim());
    setStoredOpenRouterModel(openRouterModel.trim() || "google/gemini-2.5-flash");
    setOpenRouterSavedNotice(true);
    setTimeout(() => setOpenRouterSavedNotice(false), 3000);
    if (openRouterKey.trim()) {
      handleTestOpenRouterKey();
    } else {
      setOpenRouterTestResult(null);
    }
  };

  const handleClearOpenRouterKey = () => {
    clearStoredOpenRouterApiKey();
    setOpenRouterKey("");
    setOpenRouterTestResult(null);
    setOpenRouterSavedNotice(true);
    setTimeout(() => setOpenRouterSavedNotice(false), 3000);
  };

  const isOpenRouterStored = Boolean(getStoredOpenRouterApiKey());
  const isStored = Boolean(getStoredGeminiApiKey());

  const handleAddSubject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSubjectName.trim();
    if (!trimmed) {
      setSubjectError("Please enter a subject name.");
      return;
    }
    setSubjectActionLoading(true);
    setSubjectError(null);
    setSubjectSuccess(null);
    try {
      const added = await addUserSubject(trimmed);
      setNewSubjectName("");
      setIsAddingSubject(false);
      setSubjectSuccess(`Added subject "${added}".`);
      setTimeout(() => setSubjectSuccess(null), 3000);
    } catch (err: any) {
      setSubjectError(err?.message || "Failed to add subject");
    } finally {
      setSubjectActionLoading(false);
    }
  };

  const handleSaveRename = async (oldName: string) => {
    const trimmed = editingSubjectNewName.trim();
    if (!trimmed) {
      setSubjectError("Subject name cannot be empty.");
      return;
    }
    if (trimmed.toLowerCase() === oldName.toLowerCase()) {
      setEditingSubjectOldName(null);
      return;
    }
    setSubjectActionLoading(true);
    setSubjectError(null);
    setSubjectSuccess(null);
    try {
      await renameUserSubject(oldName, trimmed);
      setEditingSubjectOldName(null);
      setEditingSubjectNewName("");
      setSubjectSuccess(`Renamed "${oldName}" to "${trimmed}".`);
      setTimeout(() => setSubjectSuccess(null), 3000);
    } catch (err: any) {
      setSubjectError(err?.message || "Failed to rename subject");
    } finally {
      setSubjectActionLoading(false);
    }
  };

  const handleConfirmDelete = async (name: string) => {
    setSubjectActionLoading(true);
    setSubjectError(null);
    setSubjectSuccess(null);
    try {
      await deleteUserSubject(name);
      setDeletingSubjectName(null);
      setSubjectSuccess(`Removed subject "${name}".`);
      setTimeout(() => setSubjectSuccess(null), 3000);
    } catch (err: any) {
      setSubjectError(err?.message || "Failed to delete subject");
    } finally {
      setSubjectActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your predefined subjects/materials, AI parsing keys, and account preferences.
        </p>
      </div>

      <div className="space-y-8">
        {/* Subjects / Materials Management Section */}
        <section
          id="subjects-management-section"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Subjects / Materials
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Predefine and organize subjects for quick selection across questions, filters, and AI imports
                </p>
              </div>
            </div>

            {!isAddingSubject && (
              <button
                type="button"
                id="add-subject-btn"
                onClick={() => {
                  setIsAddingSubject(true);
                  setNewSubjectName("");
                  setSubjectError(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Add Subject</span>
              </button>
            )}
          </div>

          {/* Feedback messages */}
          {subjectSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {subjectSuccess}
              </span>
              <button onClick={() => setSubjectSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {subjectError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                {subjectError}
              </span>
              <button onClick={() => setSubjectError(null)} className="text-rose-600 hover:text-rose-800">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Add Subject Inline Form */}
          {isAddingSubject && (
            <form
              onSubmit={handleAddSubject}
              className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex-1">
                  <label htmlFor="new-subject-input" className="sr-only">
                    Subject Name
                  </label>
                  <input
                    id="new-subject-input"
                    type="text"
                    autoFocus
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g. Pediatrics, Psychiatry, Cardiology..."
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={subjectActionLoading || !newSubjectName.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <Check className="h-4 w-4" />
                    <span>{subjectActionLoading ? "Adding..." : "Add"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingSubject(false);
                      setNewSubjectName("");
                      setSubjectError(null);
                    }}
                    className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Subjects List Grid / Badges */}
          <div className="space-y-2">
            {subjects.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No subjects configured yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {subjects.map((sub) => {
                  const isRenaming = editingSubjectOldName === sub.name;
                  const isDeleting = deletingSubjectName === sub.name;

                  return (
                    <div
                      key={sub.name}
                      className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-850/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      {isRenaming ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            autoFocus
                            value={editingSubjectNewName}
                            onChange={(e) => setEditingSubjectNewName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveRename(sub.name);
                              } else if (e.key === "Escape") {
                                setEditingSubjectOldName(null);
                              }
                            }}
                            className="w-full rounded-lg border border-indigo-400 bg-white px-2.5 py-1 text-xs text-zinc-900 focus:outline-none dark:bg-zinc-900 dark:text-white"
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveRename(sub.name)}
                              disabled={subjectActionLoading}
                              className="rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500 cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSubjectOldName(null)}
                              className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : isDeleting ? (
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            Delete &ldquo;{sub.name}&rdquo;?
                          </p>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(sub.name)}
                              disabled={subjectActionLoading}
                              className="rounded-md bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-700 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingSubjectName(null)}
                              className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                              {sub.name}
                            </span>
                            <span className="shrink-0 rounded-md bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-750 dark:text-zinc-300">
                              {sub.count} {sub.count === 1 ? "q" : "q's"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubjectOldName(sub.name);
                                setEditingSubjectNewName(sub.name);
                                setDeletingSubjectName(null);
                              }}
                              title="Rename subject"
                              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingSubjectName(sub.name);
                                setEditingSubjectOldName(null);
                              }}
                              title="Delete subject"
                              className="rounded-md p-1 text-zinc-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* AI Configuration Section */}
        <section
          id="ai-configuration-section"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  AI & Formatting Configuration
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Manage AI providers for question importing and document-level answer formatting
                </p>
              </div>
            </div>

            {/* Provider Switcher */}
            <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => handleProviderChange("gemini")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeProvider === "gemini"
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${apiKey ? "bg-emerald-500" : "bg-zinc-400"}`} />
                Google Gemini
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange("openrouter")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeProvider === "openrouter"
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${openRouterKey ? "bg-emerald-500" : "bg-zinc-400"}`} />
                OpenRouter
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 mb-6 dark:border-zinc-800 dark:bg-zinc-950/40">
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Active primary provider:{" "}
              <strong className="text-zinc-900 dark:text-zinc-100 capitalize">
                {activeProvider === "gemini" ? "Google Gemini (Gemini 2.5 Flash)" : "OpenRouter"}
              </strong>
              . Keys are saved securely in your browser and used exclusively for question structuring and answer layout beautification.
            </p>
          </div>

          {/* Gemini Settings Tab */}
          {activeProvider === "gemini" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="gemini-api-key-input"
                  className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  Gemini API Key
                </label>
                <span className="text-xs text-zinc-400 font-mono">Model: gemini-2.5-flash</span>
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  id="gemini-api-key-input"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-9 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? "Hide API key" : "Show API key"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {testResult && (
                <div
                  id="api-key-test-status"
                  className={`mt-2 flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-medium ${
                    testResult.success
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {savedNotice && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  <span>Gemini key saved successfully.</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  id="test-gemini-connection-btn"
                  type="button"
                  onClick={handleTestKey}
                  disabled={testing}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testing ? "animate-spin" : ""}`} />
                  <span>{testing ? "Testing Connection..." : "Test Gemini Connection"}</span>
                </button>

                <button
                  id="save-gemini-key-btn"
                  type="button"
                  onClick={handleSaveKey}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs transition-all cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Key</span>
                </button>

                {isStored && (
                  <button
                    id="clear-gemini-key-btn"
                    type="button"
                    onClick={handleClearKey}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove Key</span>
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Need a Gemini API key?
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <span>Get a key from Google AI Studio</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* OpenRouter Settings Tab */}
          {activeProvider === "openrouter" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="openrouter-api-key-input"
                  className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5"
                >
                  OpenRouter API Key
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    id="openrouter-api-key-input"
                    type={showOpenRouterKey ? "text" : "password"}
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-9 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                    aria-label={showOpenRouterKey ? "Hide API key" : "Show API key"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showOpenRouterKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="openrouter-model-input"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  Model Identifier
                </label>
                <input
                  id="openrouter-model-input"
                  type="text"
                  value={openRouterModel}
                  onChange={(e) => setOpenRouterModel(e.target.value)}
                  placeholder="google/gemini-2.5-flash or meta-llama/llama-3.3-70b-instruct"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 font-mono"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Default: <code className="text-zinc-600 dark:text-zinc-300">google/gemini-2.5-flash</code>. You can also use models like <code className="text-zinc-600 dark:text-zinc-300">anthropic/claude-3.5-haiku</code> or <code className="text-zinc-600 dark:text-zinc-300">openai/gpt-4o-mini</code>.
                </p>
              </div>

              {openRouterTestResult && (
                <div
                  id="openrouter-key-test-status"
                  className={`mt-2 flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-medium ${
                    openRouterTestResult.success
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                  }`}
                >
                  {openRouterTestResult.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <span>{openRouterTestResult.message}</span>
                </div>
              )}

              {openRouterSavedNotice && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  <span>OpenRouter configuration saved successfully.</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  id="test-openrouter-connection-btn"
                  type="button"
                  onClick={handleTestOpenRouterKey}
                  disabled={openRouterTesting}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${openRouterTesting ? "animate-spin" : ""}`} />
                  <span>{openRouterTesting ? "Testing OpenRouter..." : "Test OpenRouter Connection"}</span>
                </button>

                <button
                  id="save-openrouter-key-btn"
                  type="button"
                  onClick={handleSaveOpenRouterKey}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs transition-all cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save OpenRouter Config</span>
                </button>

                {isOpenRouterStored && (
                  <button
                    id="clear-openrouter-key-btn"
                    type="button"
                    onClick={handleClearOpenRouterKey}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove Key</span>
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Need an OpenRouter key?
                </span>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <span>Get a key from OpenRouter.ai</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Database & Cloud Firestore Status */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                Cloud Firestore Storage
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Persistent database isolated to your authenticated account
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
              <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Total Vault Questions</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">
                {questions.length} questions
              </span>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
              <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Data Isolation</span>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Shield className="h-4 w-4" />
                <span>Protected by Firebase Auth Rules</span>
              </div>
            </div>
          </div>
        </section>

        {/* Account Details */}
        {user && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                  User Account
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Google Account connected to Question Vault
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 space-y-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Display Name:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {user.displayName || "Not set"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Email:</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">
                  {user.email || "No email"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">User ID (UID):</span>
                <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                  {user.uid}
                </span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
