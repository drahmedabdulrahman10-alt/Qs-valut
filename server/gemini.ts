/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { formatAnswerLocally } from "./answerFormatter.ts";

let defaultAiClient: GoogleGenAI | null = null;

export function getGenAI(customApiKey?: string): GoogleGenAI {
  const apiKey = (customApiKey || "").trim() || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("No Gemini API key configured. Please enter your Gemini API key in Settings.");
  }

  // If using custom key or default not yet cached
  if (customApiKey && customApiKey.trim()) {
    return new GoogleGenAI({
      apiKey: customApiKey.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-question-vault",
        },
      },
    });
  }

  if (!defaultAiClient) {
    defaultAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-question-vault",
        },
      },
    });
  }
  return defaultAiClient;
}

export interface ParsedQuestionResult {
  type: "mcq" | "short_answer" | "enumerate";
  question: string;
  options?: string[];
  answer: string | null;
  answerMarkdown?: string | null;
  explanation: string | null;
  suggestedSubject?: string;
  source?: string | null;
  confidence?: number;
}

export interface ParseResultResponse {
  questions: ParsedQuestionResult[];
  modelUsed?: string;
  usedFallback?: boolean;
  usingPersonalKey?: boolean;
}

/**
 * Extracts a human-friendly error message from GenAI or API errors
 */
export function cleanErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred.";
  const raw = typeof err === "string" ? err : err.message || String(err);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        if (parsed.error.code === 503 || parsed.error.status === "UNAVAILABLE") {
          return "The Gemini service is experiencing temporary high demand. Engaging intelligent local organizer.";
        }
        if (parsed.error.code === 400 && parsed.error.message.includes("API_KEY_INVALID")) {
          return "The provided Gemini API key is invalid. Please check your key in Settings.";
        }
        return parsed.error.message;
      }
    }
  } catch {
    // ignore JSON parse error
  }
  return raw;
}

function isTransientError(err: any): boolean {
  const str = String(err?.message || err || "").toLowerCase();
  return (
    str.includes("503") ||
    str.includes("unavailable") ||
    str.includes("high demand") ||
    str.includes("429") ||
    str.includes("resource_exhausted") ||
    str.includes("overloaded") ||
    str.includes("try again later") ||
    str.includes("econnreset") ||
    str.includes("fetch failed")
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Test a Gemini API key with a lightweight ping
 */
export async function testGeminiApiKey(
  apiKey?: string
): Promise<{ success: boolean; message: string; model?: string }> {
  const keyToTest = (apiKey || "").trim() || process.env.GEMINI_API_KEY || "";
  if (!keyToTest) {
    return {
      success: false,
      message: "No API key provided. Please enter your Gemini API key.",
    };
  }

  const ai = new GoogleGenAI({ apiKey: keyToTest });
  const testModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];

  let lastErr: any = null;
  for (const model of testModels) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: "Respond with the single word: OK",
      });
      if (res && res.text) {
        return {
          success: true,
          message: "Gemini API connection successful.",
          model,
        };
      }
    } catch (err: any) {
      lastErr = err;
      if (isTransientError(err)) {
        continue;
      }
      // If error is 400 or invalid key, return immediately
      const errMsg = cleanErrorMessage(err);
      return {
        success: false,
        message: errMsg || "Gemini API key is invalid or unavailable.",
      };
    }
  }

  return {
    success: false,
    message: cleanErrorMessage(lastErr) || "Gemini API key is invalid or unavailable.",
  };
}

const ANSWER_HEADER_REGEX =
  /^(?:short\s+answer|model\s+answer|suggested\s+answer|answer|ans|إجابة|الإجابة\s+المختصرة\s*(?:للامتحان)?|الإجابة\s+النموذجية|الجواب)\s*[:\-]?\s*(.*)$/i;
const EXPLANATION_REGEX =
  /^(?:explanation|rationale|note|توضيح|شرح|تعليل)\s*[:\-]?\s*(.*)$/i;
const MCQ_OPTION_REGEX = /^[A-Fa-f][\.\)]\s+(.*)$/;

function isActualMcqOption(line: string): boolean {
  const match = line.match(MCQ_OPTION_REGEX);
  if (!match) return false;
  const content = match[1].trim();
  // If it ends with ? or starts with question command verbs, it is a sub-question prompt, NOT an MCQ choice
  if (
    content.endsWith("?") ||
    /^(?:Enumerate|List|What|Why|How|Discuss|Explain|Mention|Define|Name)\b/i.test(content)
  ) {
    return false;
  }
  return true;
}

/**
 * Strips leading question numbers and labels like "Q1: ", "1. ", "Question: "
 */
export function cleanQuestionPrompt(text: string): string {
  return text
    .replace(/^(?:Question\s*\d*[\.:\-]|Q\d*[\.:\-]|سؤال\s*\d*[\.:\-]|\d+[\.\)]\s+)\s*/i, "")
    .trim();
}

/**
 * Strips leading answer labels like "Answer: ", "Short answer: ", "الإجابة المختصرة للامتحان: "
 */
export function cleanAnswerText(text: string): string {
  return text
    .replace(
      /^(?:short\s+answer|model\s+answer|suggested\s+answer|answer|ans|إجابة|الإجابة\s+المختصرة\s*(?:للامتحان)?|الإجابة\s+النموذجية|الجواب)\s*[:\-]?\s*/i,
      ""
    )
    .trim();
}

/**
 * Checks if a string is purely an answer label or structural heading rather than a question
 */
export function isStructuralAnswerLabel(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t.includes("?") || t.length > 80) return false;
  return /^(?:short\s+answer|model\s+answer|suggested\s+answer|answer|ans|إجابة|الإجابة\s+المختصرة\s*(?:للامتحان)?|الإجابة\s+النموذجية|الجواب|حل)\s*[:\-]?$/i.test(
    t
  );
}

/**
 * Sanitizes and validates extracted questions from Gemini or local fallback.
 * Strictly guarantees:
 * 1. An answer or answer label NEVER becomes a question.
 * 2. Multi-part lists or continuation items under an answer merge into the previous answer.
 * 3. Question and answer texts are cleanly formatted without redundant prefixes.
 */
export function sanitizeExtractedQuestions(
  rawList: any[],
  defaultSubject?: string,
  defaultSource?: string
): ParsedQuestionResult[] {
  const sanitized: ParsedQuestionResult[] = [];

  for (const item of rawList) {
    if (!item) continue;
    let questionText = cleanQuestionPrompt(item.question || "");
    let answerContent = item.answer;

    // Normalize answer format if array (e.g. for enumerate)
    let answerStr: string | null = null;
    if (Array.isArray(answerContent)) {
      answerStr = answerContent
        .map((x, i) => (typeof x === "string" ? x.trim() : String(x)))
        .filter(Boolean)
        .map((x, i) => (/^\d+[\.\)]/.test(x) ? x : `${i + 1}. ${x}`))
        .join("\n");
    } else if (typeof answerContent === "string" && answerContent.trim().length > 0) {
      answerStr = cleanAnswerText(answerContent.trim());
    }

    // Clean explanation
    let explanationStr: string | null = null;
    if (typeof item.explanation === "string" && item.explanation.trim().length > 0) {
      explanationStr = item.explanation.trim();
    }

    // If this item is merely an answer label or empty question, attach it to previous question
    if (isStructuralAnswerLabel(questionText) || !questionText) {
      if (sanitized.length > 0) {
        const prev = sanitized[sanitized.length - 1];
        if (answerStr) {
          prev.answer = prev.answer ? `${prev.answer}\n\n${answerStr}` : answerStr;
        }
        if (explanationStr && !prev.explanation) {
          prev.explanation = explanationStr;
        }
      }
      continue;
    }

    // Check if question text is accidentally a continuation of an answer list (e.g. "2. Enteral nutrition:" or "3. Parenteral nutrition")
    const isAnswerContinuation =
      /^\d+[\.\)]\s+(?:Enteral|Parenteral|Routes|Indications|Contraindications|Advantages|Disadvantages|Causes|Types|Features|Complications|Management|Treatment)\b/i.test(
        questionText
      ) ||
      /^[-•]\s+/.test(questionText);

    if (isAnswerContinuation && sanitized.length > 0) {
      const prev = sanitized[sanitized.length - 1];
      const mergedPart = `${questionText}${answerStr ? `:\n${answerStr}` : ""}`;
      prev.answer = prev.answer ? `${prev.answer}\n\n${mergedPart}` : mergedPart;
      continue;
    }

    // Determine type
    let validCategory: "mcq" | "short_answer" | "enumerate" = "short_answer";
    const typeLower = (item.type || "").toLowerCase().replace(/[\s_-]+/g, "");
    if (typeLower.includes("mcq") || typeLower.includes("multiplechoice")) {
      validCategory = "mcq";
    } else if (typeLower.includes("enum") || typeLower.includes("list")) {
      validCategory = "enumerate";
    } else {
      const promptLower = questionText.toLowerCase();
      if (
        promptLower.includes("enumerate") ||
        promptLower.includes("list ") ||
        promptLower.startsWith("list ") ||
        promptLower.includes("types of") ||
        promptLower.includes("causes of") ||
        promptLower.includes("features of") ||
        promptLower.includes("indications of") ||
        promptLower.includes("complications of") ||
        questionText.includes("عدد") ||
        questionText.includes("اذكر")
      ) {
        validCategory = "enumerate";
      } else {
        validCategory = "short_answer";
      }
    }

    // MCQ options
    const options =
      validCategory === "mcq" && Array.isArray(item.options) && item.options.length > 0
        ? item.options.filter((opt: any) => typeof opt === "string" && opt.trim().length > 0)
        : undefined;

    sanitized.push({
      type: validCategory,
      question: questionText,
      options,
      answer: answerStr && answerStr.length > 0 ? answerStr : null,
      answerMarkdown:
        item.answerMarkdown?.trim() ||
        (answerStr && answerStr.length > 0 ? formatAnswerLocally(answerStr) : null),
      explanation: explanationStr && explanationStr.length > 0 ? explanationStr : null,
      suggestedSubject: item.suggestedSubject?.trim() || defaultSubject || undefined,
      source: item.source || defaultSource || undefined,
      confidence: typeof item.confidence === "number" ? item.confidence : 0.95,
    });
  }

  return sanitized;
}

/**
 * Smart semantic local question parser used as a safety fallback if AI models
 * are temporarily experiencing high demand.
 * Adheres strictly to the user's semantic principles:
 * - NEVER turns an answer into a question.
 * - Structural answer labels (English and Arabic) attach to the preceding question.
 * - Long multi-numbered answer blocks remain attached to their parent question.
 * - Does NOT invent answers: if no answer is provided, answer is null.
 */
export function parseQuestionsLocally(
  rawText: string,
  defaultSubject?: string,
  defaultSource?: string
): ParsedQuestionResult[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).map((l) => l.trim());
  const questions: ParsedQuestionResult[] = [];

  let currentQuestion: string | null = null;
  let currentOptions: string[] = [];
  let currentAnswerLines: string[] = [];
  let currentExplanationLines: string[] = [];
  let inAnswerBlock = false;
  let inExplanationBlock = false;

  function finalizeCurrent() {
    if (!currentQuestion) return;
    const prompt = cleanQuestionPrompt(currentQuestion.trim());
    if (!prompt) return;

    let ans = currentAnswerLines.join("\n").trim() || null;
    let exp = currentExplanationLines.join("\n").trim() || null;

    let type: "mcq" | "short_answer" | "enumerate" = "short_answer";
    const promptLower = prompt.toLowerCase();
    if (currentOptions.length >= 2) {
      type = "mcq";
    } else if (
      promptLower.includes("enumerate") ||
      promptLower.includes("list ") ||
      promptLower.startsWith("list ") ||
      promptLower.includes("mention ") ||
      promptLower.includes("name the ") ||
      promptLower.includes("types of") ||
      promptLower.includes("causes of") ||
      promptLower.includes("features of") ||
      promptLower.includes("indications of") ||
      promptLower.includes("complications of") ||
      prompt.includes("عدد") ||
      prompt.includes("اذكر")
    ) {
      type = "enumerate";
    }

    const cleanedAns = ans ? cleanAnswerText(ans) : null;
    questions.push({
      type,
      question: prompt,
      options: currentOptions.length > 0 ? currentOptions : undefined,
      answer: cleanedAns,
      answerMarkdown: cleanedAns ? formatAnswerLocally(cleanedAns) : null,
      explanation: exp,
      suggestedSubject: defaultSubject,
      source: defaultSource,
      confidence: 0.92,
    });

    currentQuestion = null;
    currentOptions = [];
    currentAnswerLines = [];
    currentExplanationLines = [];
    inAnswerBlock = false;
    inExplanationBlock = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      if (inAnswerBlock && currentAnswerLines.length > 0) {
        currentAnswerLines.push("");
      }
      continue;
    }

    // Check if line is an answer label
    const ansMatch = line.match(ANSWER_HEADER_REGEX);
    if (ansMatch) {
      inAnswerBlock = true;
      inExplanationBlock = false;
      const immediateContent = ansMatch[1]?.trim();
      if (immediateContent) {
        currentAnswerLines.push(immediateContent);
      }
      continue;
    }

    // Check if line is explanation label
    const expMatch = line.match(EXPLANATION_REGEX);
    if (expMatch) {
      inExplanationBlock = true;
      inAnswerBlock = false;
      const immediateContent = expMatch[1]?.trim();
      if (immediateContent) {
        currentExplanationLines.push(immediateContent);
      }
      continue;
    }

    // Check if line is MCQ option while NOT inside an answer block
    if (isActualMcqOption(line) && !inAnswerBlock && !inExplanationBlock) {
      currentOptions.push(line);
      continue;
    }

    // Explicit new question marker (e.g. Question 2:, Q2:, سؤال 2:)
    const isExplicitNewQuestion =
      /^(?:Question\s*\d+[\.:\-]|Q\d+[\.:\-]|سؤال\s*\d*[\.:\-])/i.test(line) ||
      (!inAnswerBlock && !inExplanationBlock && /^\d+[\.\)]\s+[A-Z\u0600-\u06FF]/.test(line));

    // While in an answer block, a line only starts a new question if it is an explicit question header
    // or a semantic question prompt that is NOT a list item or sub-heading
    const isNewQuestionDuringAnswer =
      /^(?:Question\s*\d+[\.:\-]|Q\d+[\.:\-]|سؤال\s*\d*[\.:\-])/i.test(line) ||
      (/^(?:Another\s+patient|Case\s*\d+|A\s+patient\s+with|What\s+is|Why\s+does|How\s+is|Discuss|Enumerate|Explain|Compare|Define|Describe)\b/i.test(
        line
      ) &&
        !/^(?:\d+[\.\)]|\-|\*|•)/.test(line));

    if ((currentQuestion && isExplicitNewQuestion) || (inAnswerBlock && isNewQuestionDuringAnswer)) {
      finalizeCurrent();
      currentQuestion = line;
      continue;
    }

    if (inExplanationBlock) {
      currentExplanationLines.push(line);
    } else if (inAnswerBlock) {
      currentAnswerLines.push(line);
    } else {
      if (!currentQuestion) {
        currentQuestion = line;
      } else {
        currentQuestion += " " + line;
      }
    }
  }

  finalizeCurrent();
  return sanitizeExtractedQuestions(questions, defaultSubject, defaultSource);
}

/**
 * Gemini-powered semantic question and answer parser.
 * Deeply understands the semantic relationship between questions and answers.
 */
export async function parseQuestionsWithGemini(
  rawText: string,
  defaultSubject?: string,
  defaultSource?: string,
  customApiKey?: string
): Promise<ParseResultResponse> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { questions: [] };
  }

  const ai = getGenAI(customApiKey);

  const systemInstruction = `You are a world-class academic and medical question parser and document organizer.
Your sole job is to analyze study material (including messy notes, copied PDFs, lecture slides, WhatsApp messages, past exams) and extract structured question-and-answer pairs.

==================================================
CRITICAL CORE DIRECTIVES
==================================================

1. SEMANTIC RELATIONSHIP UNDERSTANDING:
   - Deeply analyze the semantic structure: identify what is a QUESTION being asked versus what is the ANSWER content responding to it.
   - Do NOT rely on simplistic line-by-line checks or regex.

2. CRITICAL RULE: NEVER TURN AN ANSWER INTO A QUESTION:
   - Structural labels indicating an answer MUST NEVER become questions.
   - Structural labels include:
     "Answer:", "Short answer:", "Model answer:", "Suggested answer:", "Ans:", "Answers:",
     "الإجابة:", "الإجابة المختصرة:", "الإجابة المختصرة للامتحان:", "الإجابة النموذجية:", "الجواب:".
   - Any text following such labels belongs to the answer of the preceding question.
   - Never extract an answer label as a question record.

3. LONG MULTI-SECTION ANSWERS BELONG TO ONE QUESTION:
   - An answer can be extensive, containing multiple paragraphs, numbered lists (e.g. 1., 2., 3.), bullet points (-, •), and subheadings.
   - For example, if a question asks "Discuss nutritional support in surgical patients" and the answer contains:
     "1. Routes of nutritional support:
      - Enteral nutrition.
      - Parenteral nutrition.
      2. Enteral nutrition:
      - Indicated when...
      3. Parenteral nutrition:
      - Provides nutritional..."
     This is ONE question with ONE structured answer.
   - DO NOT split an answer into multiple questions merely because it contains "1.", "2.", "3.", "A.", "B.", "-", or multiple paragraphs. Keep the entire answer attached to its question.

4. DETECT WHERE THE NEXT QUESTION ACTUALLY STARTS:
   - Only create a new question record when the text actually transitions to a new question prompt, scenario, or question number (e.g., "Question 2", "Another patient presents with...").
   - Numbered sub-items of an answer are NOT questions.

5. THREE QUESTION TYPES ONLY:
   - "mcq": A question containing multiple choice options (A, B, C, D).
     * Extract options into the options array (e.g. ["A. ...", "B. ...", "C. ...", "D. ..."]).
     * Extract the provided answer into answer (e.g. "C" or "C. Tertiary").
     * Do NOT include the answer inside the question text.
   - "short_answer": A direct question requiring a textual response (short or long multi-paragraph explanation).
     * Set options to [].
   - "enumerate": A question asking to enumerate, list, mention, name, state types, give causes, features, complications, etc.
     * Set options to [].
     * Preserve the list items in the answer faithfully (as an array of strings or ordered list).

6. DO NOT INVENT OR FABRICATE ANSWERS:
   - You are strictly a PARSER, not a solver.
   - If the source material contains NO answer for a question, set "answer" to null or "".
   - Never replace the provided answer with your own answer.
   - Never silently correct medical facts or add facts not present in the user's source text.
   - The user's notes are the absolute source of truth.

7. PRESERVE ORIGINAL ANSWER ACCURACY:
   - Clean up obvious PDF copy artifacts (broken line wraps, duplicate spaces), but faithfully preserve all terminology, numbered points, and bulleted items.
   - Support mixed Arabic and English text seamlessly.`;

  const prompt = `Please analyze and parse the following study material into structured question-and-answer pairs:

${defaultSubject ? `Default Subject: ${defaultSubject}\n` : ""}
${defaultSource ? `Default Source: ${defaultSource}\n` : ""}

Study Material:
"""
${trimmed}
"""`;

  // Candidate models: start with gemini-3.1-flash-lite, fallback to gemini-3.8-flash and gemini-flash-latest
  const candidateModels = [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: {
                        type: Type.STRING,
                        description: "Question type: mcq, short_answer, or enumerate",
                      },
                      question: {
                        type: Type.STRING,
                        description: "The prompt text of the question, cleaned of leading labels like 'Q1:' or '1.'",
                      },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Choices for MCQ questions. Empty array for short_answer and enumerate.",
                      },
                      answer: {
                        type: Type.STRING,
                        description: "The raw answer explicitly provided in the source text. Empty string or null if not provided in source. Never invent answers.",
                      },
                      answerMarkdown: {
                        type: Type.STRING,
                        description: "Structured Markdown formatted answer with bold headings (**Heading:**), numbered lists, and bullet points. Preserve original content and wording exactly.",
                      },
                      explanation: {
                        type: Type.STRING,
                        description: "Explanation or rationale present in the text, or empty string.",
                      },
                      suggestedSubject: {
                        type: Type.STRING,
                        description: "Inferred academic subject/discipline if apparent.",
                      },
                      confidence: {
                        type: Type.NUMBER,
                        description: "Confidence score between 0.0 and 1.0",
                      },
                    },
                    required: ["type", "question", "options", "answer"],
                  },
                },
              },
              required: ["questions"],
            },
          },
        });

        const responseText = response.text;
        if (!responseText) {
          throw new Error(`Empty response received from model ${model}.`);
        }

        const parsed = JSON.parse(responseText);
        const rawQuestions = parsed.questions || [];

        const sanitized = sanitizeExtractedQuestions(rawQuestions, defaultSubject, defaultSource);

        if (sanitized.length > 0) {
          return {
            questions: sanitized,
            modelUsed: model,
            usedFallback: false,
            usingPersonalKey: Boolean(customApiKey && customApiKey.trim()),
          };
        }
      } catch (err: any) {
        lastError = err;
        const isTransient = isTransientError(err);

        if (isTransient && attempt < 2) {
          await sleep(600);
          continue;
        }

        break;
      }
    }
  }

  // If candidate AI models hit transient demand spikes, engage our smart semantic local organizer
  const fallbackQuestions = parseQuestionsLocally(trimmed, defaultSubject, defaultSource);
  if (fallbackQuestions.length > 0) {
    return {
      questions: fallbackQuestions,
      usedFallback: true,
      usingPersonalKey: Boolean(customApiKey && customApiKey.trim()),
    };
  }

  // If even local parser found nothing and we had an error, throw cleaned error
  throw new Error(cleanErrorMessage(lastError));
}
