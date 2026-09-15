import React, { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { useQuestions } from "../context/QuestionsContext.tsx";

interface SubjectSelectProps {
  id?: string;
  value: string;
  onChange: (subject: string) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export function SubjectSelect({
  id = "subject-select",
  value,
  onChange,
  required = false,
  className = "",
  disabled = false,
  label,
}: SubjectSelectProps) {
  const { subjectNames, addUserSubject } = useQuestions();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [addingError, setAddingError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Ensure current value is in the list even if it was custom
  const allDisplaySubjects = React.useMemo(() => {
    const list = [...subjectNames];
    if (value && value.trim() && !list.some((s) => s.toLowerCase() === value.trim().toLowerCase())) {
      list.unshift(value.trim());
    }
    return list;
  }, [subjectNames, value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "__ADD_NEW__") {
      setIsAddingNew(true);
      setNewSubjectInput("");
      setAddingError(null);
    } else {
      onChange(selected);
    }
  };

  const handleAddNewSubject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSubjectInput.trim();
    if (!trimmed) {
      setAddingError("Please enter a subject name.");
      return;
    }

    setIsSaving(true);
    setAddingError(null);
    try {
      const created = await addUserSubject(trimmed);
      onChange(created);
      setIsAddingNew(false);
      setNewSubjectInput("");
    } catch (err: any) {
      setAddingError(err?.message || "Failed to add subject");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
          {!isAddingNew && !disabled && (
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(true);
                setNewSubjectInput("");
                setAddingError(null);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>New Subject</span>
            </button>
          )}
        </div>
      )}

      {isAddingNew ? (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-2.5 dark:border-indigo-900/60 dark:bg-indigo-950/20 space-y-2">
          <div className="flex items-center gap-2">
            <input
              id={`${id}-new-input`}
              type="text"
              autoFocus
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddNewSubject();
                } else if (e.key === "Escape") {
                  setIsAddingNew(false);
                }
              }}
              placeholder="e.g. Pharmacology, Genetics..."
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={() => handleAddNewSubject()}
              disabled={isSaving || !newSubjectInput.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 cursor-pointer transition-colors shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSaving ? "Adding..." : "Add"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setAddingError(null);
              }}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {addingError && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400">{addingError}</p>
          )}
        </div>
      ) : (
        <div className="relative">
          <select
            id={id}
            value={value}
            onChange={handleSelectChange}
            required={required}
            disabled={disabled}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs sm:text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400 shadow-xs cursor-pointer disabled:opacity-60"
          >
            <option value="" disabled>
              -- Select Subject --
            </option>
            {allDisplaySubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
            <option disabled>──────────</option>
            <option value="__ADD_NEW__">+ Add New Subject...</option>
          </select>
        </div>
      )}
    </div>
  );
}
