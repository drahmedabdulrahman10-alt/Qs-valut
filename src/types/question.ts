export type QuestionType = "mcq" | "short_answer" | "enumerate";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  userId: string;
  type: QuestionType;
  question: string;
  options?: string[] | null;
  answer: string | null;
  answerMarkdown?: string | null; // AI-structured, readable Markdown representation of answer
  formattedAnswer?: string | null; // Alias for formatted answer
  explanation: string | null;
  subject: string;
  source: string | null;
  tags?: string[] | null;
  difficulty?: QuestionDifficulty;
  important: boolean;
  createdAt: string;
  updatedAt: string;
  lastReviewedAt?: string | null;
  reviewCount: number;
}

export interface ParsedDraftQuestion {
  id: string; // client temporary ID
  type: QuestionType;
  question: string;
  options?: string[];
  answer: string | null;
  answerMarkdown?: string | null; // AI-structured, readable Markdown representation of answer
  formattedAnswer?: string | null;
  explanation: string | null;
  subject: string;
  source: string | null;
  tags?: string[];
  isDuplicate?: boolean;
  existingId?: string;
  skip?: boolean;
}

export interface UserPreferences {
  userId: string;
  recentSubjects: string[];
  updatedAt: string;
}
