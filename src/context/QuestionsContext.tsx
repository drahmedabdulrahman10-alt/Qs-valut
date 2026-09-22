import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { Question, ParsedDraftQuestion } from "../types/question.ts";
import {
  saveQuestion,
  batchSaveQuestions,
  updateExistingQuestion,
  removeQuestion,
  batchDeleteQuestions,
  subscribeToUserQuestions,
  saveUserSubjects,
  saveUserStudyCheckpoint,
  subscribeToUserProfile,
} from "../lib/firebase.ts";
import { useAuth } from "./AuthContext.tsx";

export const DEFAULT_PREDEFINED_SUBJECTS = [
  "Surgery",
  "Internal Medicine",
  "Nutrition",
  "Endocrinology",
  "Pediatrics",
  "Pharmacology",
  "Pathology",
  "Cardiology",
];

interface QuestionsContextType {
  questions: Question[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  subjects: { name: string; count: number }[];
  subjectNames: string[];
  userSubjects: string[];
  addQuestion: (q: Omit<Question, "id" | "userId" | "createdAt" | "updatedAt" | "reviewCount">) => Promise<Question>;
  saveDrafts: (drafts: ParsedDraftQuestion[]) => Promise<number>;
  updateQuestion: (id: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  bulkDeleteQuestions: (ids: string[]) => Promise<number>;
  toggleImportant: (id: string) => Promise<void>;
  recordReview: (id: string, difficulty?: "easy" | "medium" | "hard") => Promise<void>;
  checkDuplicate: (questionText: string) => { isDuplicate: boolean; existingQuestion?: Question };
  recentSubjects: string[];
  addUserSubject: (name: string) => Promise<string>;
  renameUserSubject: (oldName: string, newName: string) => Promise<void>;
  deleteUserSubject: (name: string) => Promise<void>;
  studyCheckpointQuestionId: string | null;
  studyCheckpointQuestion: Question | null;
  setStudyCheckpoint: (questionId: string | null) => Promise<void>;
  toggleStudyCheckpoint: (questionId: string) => Promise<void>;
}

const QuestionsContext = createContext<QuestionsContextType | undefined>(undefined);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function QuestionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userSubjects, setUserSubjects] = useState<string[]>(DEFAULT_PREDEFINED_SUBJECTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [studyCheckpointQuestionId, setStudyCheckpointQuestionId] = useState<string | null>(null);

  // Subscribe to Questions
  useEffect(() => {
    if (!user) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribeQuestions = subscribeToUserQuestions(
      user.uid,
      (data) => {
        setQuestions(data);
        setLoading(false);
      },
      (err) => {
        console.error("Questions subscription error:", err);
        setError("Failed to load questions from Cloud Firestore.");
        setLoading(false);
      }
    );

    return () => unsubscribeQuestions();
  }, [user]);

  // Subscribe to User's Profile (Subjects + Study Checkpoint)
  useEffect(() => {
    if (!user) {
      setUserSubjects(DEFAULT_PREDEFINED_SUBJECTS);
      setStudyCheckpointQuestionId(null);
      return;
    }

    // Hydrate cached checkpoint for this user immediately if present
    try {
      const cached = localStorage.getItem(`study_checkpoint_${user.uid}`);
      if (cached) {
        setStudyCheckpointQuestionId(cached);
      }
    } catch {}

    const unsubscribeProfile = subscribeToUserProfile(
      user.uid,
      (profile) => {
        if (profile.subjects && profile.subjects.length > 0) {
          setUserSubjects(profile.subjects);
        } else {
          // If the user has no saved subjects yet, seed with defaults
          setUserSubjects(DEFAULT_PREDEFINED_SUBJECTS);
          saveUserSubjects(user.uid, DEFAULT_PREDEFINED_SUBJECTS).catch((err) =>
            console.warn("Failed to seed initial subjects in Firestore:", err)
          );
        }

        // Sync study checkpoint from cloud Firestore
        setStudyCheckpointQuestionId(profile.studyCheckpointQuestionId);
        try {
          if (profile.studyCheckpointQuestionId) {
            localStorage.setItem(`study_checkpoint_${user.uid}`, profile.studyCheckpointQuestionId);
          } else {
            localStorage.removeItem(`study_checkpoint_${user.uid}`);
          }
        } catch {}
      },
      (err) => {
        console.error("Profile subscription error:", err);
      }
    );

    return () => unsubscribeProfile();
  }, [user]);

  // Calculate subjects with dynamic counts from user's actual Firestore questions
  const subjects = useMemo(() => {
    const questionCounts = new Map<string, number>();
    for (const q of questions) {
      const sub = (q.subject || "General").trim();
      if (sub) {
        // Track case-insensitive lookup, preserve proper case
        const existingKey = Array.from(questionCounts.keys()).find(
          (k) => k.toLowerCase() === sub.toLowerCase()
        );
        const key = existingKey || sub;
        questionCounts.set(key, (questionCounts.get(key) || 0) + 1);
      }
    }

    // Merge predefined userSubjects with any existing question subjects
    const mergedMap = new Map<string, number>();

    // First add all userSubjects with their counts (or 0)
    for (const sub of userSubjects) {
      const trimmed = sub.trim();
      if (!trimmed) continue;
      // Check if there are counts under any case match
      const matchingKey = Array.from(questionCounts.keys()).find(
        (k) => k.toLowerCase() === trimmed.toLowerCase()
      );
      const count = matchingKey ? questionCounts.get(matchingKey) || 0 : 0;
      mergedMap.set(trimmed, count);
    }

    // Next add any question subjects not in userSubjects
    for (const [sub, count] of questionCounts.entries()) {
      const exists = Array.from(mergedMap.keys()).some(
        (k) => k.toLowerCase() === sub.toLowerCase()
      );
      if (!exists) {
        mergedMap.set(sub, count);
      }
    }

    return Array.from(mergedMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        // Sort by count descending, then alphabetically
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.name.localeCompare(b.name);
      });
  }, [questions, userSubjects]);

  const subjectNames = useMemo(() => {
    return subjects.map((s) => s.name);
  }, [subjects]);

  const recentSubjects = useMemo(() => {
    return subjectNames;
  }, [subjectNames]);

  const clearError = () => setError(null);

  // Add a new user subject
  const addUserSubject = useCallback(
    async (name: string): Promise<string> => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Subject name cannot be empty.");

      // Check if already exists (case-insensitive)
      const existing = userSubjects.find(
        (s) => s.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) {
        return existing;
      }

      const updated = [...userSubjects, trimmed];
      setUserSubjects(updated);
      if (user) {
        await saveUserSubjects(user.uid, updated);
      }
      return trimmed;
    },
    [userSubjects, user]
  );

  // Rename a user subject
  const renameUserSubject = useCallback(
    async (oldName: string, newName: string): Promise<void> => {
      const trimmedNew = newName.trim();
      if (!trimmedNew) throw new Error("New subject name cannot be empty.");
      if (oldName.toLowerCase() === trimmedNew.toLowerCase()) return;

      const updatedSubjects = userSubjects.map((s) =>
        s.toLowerCase() === oldName.toLowerCase() ? trimmedNew : s
      );
      setUserSubjects(updatedSubjects);

      if (user) {
        await saveUserSubjects(user.uid, updatedSubjects);

        // Update all questions that had the old subject
        const questionsToUpdate = questions.filter(
          (q) => q.subject.toLowerCase() === oldName.toLowerCase()
        );
        for (const q of questionsToUpdate) {
          await updateExistingQuestion(q.id, { subject: trimmedNew });
        }
      }
    },
    [userSubjects, questions, user]
  );

  // Delete a user subject
  const deleteUserSubject = useCallback(
    async (name: string): Promise<void> => {
      const updated = userSubjects.filter(
        (s) => s.toLowerCase() !== name.toLowerCase()
      );
      setUserSubjects(updated);
      if (user) {
        await saveUserSubjects(user.uid, updated);
      }
    },
    [userSubjects, user]
  );

  // Check duplicate against existing questions
  const checkDuplicate = (questionText: string): { isDuplicate: boolean; existingQuestion?: Question } => {
    const normalizedInput = normalizeText(questionText);
    if (!normalizedInput || normalizedInput.length < 10) {
      return { isDuplicate: false };
    }

    const match = questions.find((q) => {
      const normSaved = normalizeText(q.question);
      return (
        normSaved === normalizedInput ||
        (normSaved.length > 20 && normalizedInput.length > 20 &&
          (normSaved.includes(normalizedInput) || normalizedInput.includes(normSaved)))
      );
    });

    return {
      isDuplicate: !!match,
      existingQuestion: match,
    };
  };

  const addQuestion = async (
    q: Omit<Question, "id" | "userId" | "createdAt" | "updatedAt" | "reviewCount">
  ): Promise<Question> => {
    if (!user) throw new Error("Must be signed in to add questions.");
    const now = new Date().toISOString();
    const id = `q_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const newQuestion: Question = {
      ...q,
      id,
      userId: user.uid,
      options: q.options && q.options.length > 0 ? q.options : null,
      createdAt: now,
      updatedAt: now,
      reviewCount: 0,
    };

    await saveQuestion(newQuestion);
    return newQuestion;
  };

  const saveDrafts = async (drafts: ParsedDraftQuestion[]): Promise<number> => {
    if (!user) throw new Error("Must be signed in to save questions.");
    const validDrafts = drafts.filter((d) => !d.skip);
    if (validDrafts.length === 0) return 0;

    const now = new Date().toISOString();
    const questionsToSave: Question[] = validDrafts.map((d, index) => ({
      id: `q_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.uid,
      type: d.type,
      question: d.question.trim(),
      options: d.type === "mcq" && d.options && d.options.length > 0 ? d.options : null,
      answer: d.answer ? d.answer.trim() : null,
      answerMarkdown: d.answerMarkdown ? d.answerMarkdown.trim() : null,
      explanation: d.explanation ? d.explanation.trim() : null,
      subject: d.subject.trim() || "General",
      source: d.source ? d.source.trim() : null,
      tags: d.tags || [],
      difficulty: "medium",
      important: false,
      createdAt: now,
      updatedAt: now,
      reviewCount: 0,
      lastReviewedAt: null,
    }));

    await batchSaveQuestions(questionsToSave);
    return questionsToSave.length;
  };

  const setStudyCheckpoint = useCallback(
    async (questionId: string | null) => {
      const cleanId = questionId && questionId.trim() ? questionId.trim() : null;
      setStudyCheckpointQuestionId(cleanId);
      if (user) {
        try {
          if (cleanId) {
            localStorage.setItem(`study_checkpoint_${user.uid}`, cleanId);
          } else {
            localStorage.removeItem(`study_checkpoint_${user.uid}`);
          }
        } catch {}
        await saveUserStudyCheckpoint(user.uid, cleanId);
      }
    },
    [user]
  );

  const toggleStudyCheckpoint = useCallback(
    async (questionId: string) => {
      if (studyCheckpointQuestionId === questionId) {
        await setStudyCheckpoint(null);
      } else {
        await setStudyCheckpoint(questionId);
      }
    },
    [studyCheckpointQuestionId, setStudyCheckpoint]
  );

  // Automatically clear stale checkpoint if the saved question no longer exists in questions list
  useEffect(() => {
    if (!loading && questions.length > 0 && studyCheckpointQuestionId) {
      const exists = questions.some((q) => q.id === studyCheckpointQuestionId);
      if (!exists) {
        setStudyCheckpoint(null).catch((e) => console.warn("Failed to clear stale checkpoint:", e));
      }
    }
  }, [loading, questions, studyCheckpointQuestionId, setStudyCheckpoint]);

  const studyCheckpointQuestion = useMemo(() => {
    if (!studyCheckpointQuestionId) return null;
    return questions.find((q) => q.id === studyCheckpointQuestionId) || null;
  }, [questions, studyCheckpointQuestionId]);

  const updateQuestion = async (id: string, updates: Partial<Question>) => {
    await updateExistingQuestion(id, updates);
  };

  const deleteQuestion = async (id: string) => {
    if (studyCheckpointQuestionId === id) {
      await setStudyCheckpoint(null);
    }
    await removeQuestion(id);
  };

  const bulkDeleteQuestions = async (ids: string[]): Promise<number> => {
    if (!ids || ids.length === 0) return 0;
    if (studyCheckpointQuestionId && ids.includes(studyCheckpointQuestionId)) {
      await setStudyCheckpoint(null);
    }
    await batchDeleteQuestions(ids);
    return ids.length;
  };

  const toggleImportant = async (id: string) => {
    const q = questions.find((item) => item.id === id);
    if (!q) return;
    await updateExistingQuestion(id, { important: !q.important });
  };

  const recordReview = async (id: string, difficulty?: "easy" | "medium" | "hard") => {
    const q = questions.find((item) => item.id === id);
    if (!q) return;
    const updates: Partial<Question> = {
      reviewCount: (q.reviewCount || 0) + 1,
      lastReviewedAt: new Date().toISOString(),
    };
    if (difficulty) {
      updates.difficulty = difficulty;
    }
    await updateExistingQuestion(id, updates);
  };

  return (
    <QuestionsContext.Provider
      value={{
        questions,
        loading,
        error,
        clearError,
        subjects,
        subjectNames,
        userSubjects,
        addQuestion,
        saveDrafts,
        updateQuestion,
        deleteQuestion,
        bulkDeleteQuestions,
        toggleImportant,
        recordReview,
        checkDuplicate,
        recentSubjects,
        addUserSubject,
        renameUserSubject,
        deleteUserSubject,
        studyCheckpointQuestionId,
        studyCheckpointQuestion,
        setStudyCheckpoint,
        toggleStudyCheckpoint,
      }}
    >
      {children}
    </QuestionsContext.Provider>
  );
}

export function useQuestions() {
  const context = useContext(QuestionsContext);
  if (!context) {
    throw new Error("useQuestions must be used within a QuestionsProvider");
  }
  return context;
}
