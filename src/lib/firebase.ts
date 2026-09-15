import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Question } from "../types/question.ts";

const app = initializeApp(firebaseConfig);

// Configure Firestore settings to handle sandboxed iframes & proxies gracefully
if (typeof window !== "undefined") {
  try {
    initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    // If already initialized, getFirestore will return the existing configured instance
  }
}

// Initialize Firestore with the specific database ID as required
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initial connection test
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    const code = error?.code || "";
    if (
      msg.includes("the client is offline") ||
      code === "unavailable" ||
      msg.includes("unavailable") ||
      msg.includes("The operation could not be completed")
    ) {
      console.warn("Firestore connection notice: Backend connection pending or operating offline. Offline cache will be used.");
    } else {
      console.error("Please check your Firebase configuration:", error);
    }
  }
}

// Google Sign-In helper
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

// Sign-Out helper
export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Helper to strip any undefined values and safely prepare objects for Firestore
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) {
      continue;
    }
    if (val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      cleaned[key] = sanitizeForFirestore(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

// Firestore operations for Questions
export async function saveQuestion(question: Question): Promise<void> {
  const path = `questions/${question.id}`;
  try {
    const rawData = {
      ...question,
      options:
        question.options && Array.isArray(question.options) && question.options.length > 0
          ? question.options
          : null,
      answer: question.answer ?? null,
      answerMarkdown: question.answerMarkdown ?? null,
      explanation: question.explanation ?? null,
      source: question.source ?? null,
      tags: Array.isArray(question.tags) ? question.tags : [],
      lastReviewedAt: question.lastReviewedAt ?? null,
      updatedAt: new Date().toISOString(),
    };
    const cleaned = sanitizeForFirestore(rawData);
    await setDoc(doc(db, "questions", question.id), cleaned);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function batchSaveQuestions(questions: Question[]): Promise<void> {
  for (const q of questions) {
    await saveQuestion(q);
  }
}

export async function updateExistingQuestion(
  id: string,
  updates: Partial<Question>
): Promise<void> {
  const path = `questions/${id}`;
  try {
    const rawUpdates = {
      ...updates,
      ...(updates.options !== undefined
        ? {
            options:
              updates.options && Array.isArray(updates.options) && updates.options.length > 0
                ? updates.options
                : null,
          }
        : {}),
      updatedAt: new Date().toISOString(),
    };
    const cleaned = sanitizeForFirestore(rawUpdates);
    await updateDoc(doc(db, "questions", id), cleaned);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function removeQuestion(id: string): Promise<void> {
  const path = `questions/${id}`;
  try {
    await deleteDoc(doc(db, "questions", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function batchDeleteQuestions(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const CHUNK_SIZE = 400; // Keep safely below Firestore 500 limit
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, "questions", id));
    }
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `questions/[batch:${chunk.length}]`);
    }
  }
}

// User Profile & Subjects Firestore Operations
export async function saveUserSubjects(userId: string, subjects: string[]): Promise<void> {
  const path = `users/${userId}`;
  try {
    const uniqueSubjects = Array.from(new Set(subjects.map((s) => s.trim()).filter(Boolean)));
    const payload = {
      userId,
      subjects: uniqueSubjects,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", userId), payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeToUserSubjects(
  userId: string,
  onData: (subjects: string[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, "users", userId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const subs: string[] = Array.isArray(data.subjects) ? data.subjects : [];
        onData(subs);
      } else {
        onData([]);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToUserQuestions(
  userId: string,
  onData: (questions: Question[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = "questions";
  const q = query(collection(db, path), where("userId", "==", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const questions: Question[] = [];
      snapshot.forEach((doc) => {
        questions.push(doc.data() as Question);
      });
      // Sort newest first by createdAt
      questions.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      onData(questions);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
