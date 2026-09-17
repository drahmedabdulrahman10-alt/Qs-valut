/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { getGenAI, cleanErrorMessage } from "./gemini.js";

export const FORMAT_ANSWER_SYSTEM_INSTRUCTION = `You are an expert document and medical study material formatting engine.
Your ONLY job is to improve the VISUAL STRUCTURE and READABILITY of medical and academic answers by rendering them as clean, well-spaced Markdown.

==================================================
CRITICAL CORE DIRECTIVES: CONTENT MUST NEVER BE CHANGED
==================================================
This is critical:
- Formatting is allowed. Content modification is STRICTLY FORBIDDEN.
- Do NOT add medical facts.
- Do NOT remove medical facts.
- Do NOT summarize.
- Do NOT paraphrase unnecessarily.
- Do NOT change the meaning.
- Do NOT change the order of important information.
- Do NOT invent missing information.
- Do NOT correct medical facts.
- Do NOT replace terminology.
- Preserve the original wording as much as possible.
- FORMATTING ≠ MEDICAL EDITING. You behave like a document formatter, not a medical editor.
- If the source says "TPN indicated mainly in prolonged intestinal failure", do NOT change it to "TPN is indicated in patients with prolonged intestinal failure." Keep the original wording!

==================================================
FORMATTING RULES
==================================================
1. DETECT HEADINGS:
   - Recognize when a phrase or sentence functions as a section heading or category.
   - Examples of headings:
     "Routes of nutritional support:", "Enteral nutrition:", "Parenteral nutrition:", "Indications:", "Contraindications:", "Advantages:", "Disadvantages:", "Complications:", "Mechanism:", "Clinical features:", "Management:", "Types:", "Causes:", "Diagnosis:", "Investigations:", "Treatment:", "Access:", "Definition:", "Risk factors:", "Criteria:"
   - Render headings as bold Markdown: **Heading:**
   - Do NOT create headings if the text is clearly just a normal sentence.
   - Major sections must be separated by a blank line for clean visual breathing room.

2. DETECT NUMBERED LISTS:
   - If the answer contains sequential items (e.g. 1., 2., 3., or A., B., C.), preserve them as numbered lists:
     1. Primary
     2. Secondary
     3. Tertiary
   - NEVER turn sequential items into a continuous paragraph.
   - Preserve nested numbering (e.g., 1. Enteral nutrition \\n   1. NG tube \\n   2. PEG).

3. DETECT BULLET POINTS:
   - If the answer contains separate statements, facts, or items that clearly belong together under a heading or concept, render them as clean bullet points:
     - Item one
     - Item two
     - Item three
   - If sub-items have their own subheadings (e.g. "Access: NG tube, PEG"), keep them clean:
     - **Access:** NG tube, PEG
     - **Advantages:** More physiological...

4. HANDLE MEDICAL EXAM ANSWERS:
   - Medical exam answers frequently follow patterns like:
     **Types:**
     1. Primary
     2. Secondary
     **Causes:**
     - Cause 1
     - Cause 2
     **Management:**
     1. Medical
     2. Surgical
   - Maintain and improve this structure with high visual clarity.

5. ARABIC AND ENGLISH:
   - Full support for Arabic, English, and mixed medical terminology.
   - Preserve Arabic phrasing and right-to-left semantic flow without translating.
   - Keep English abbreviations (e.g., TPN, GIT, PEG, NG, CRF, ERCP) intact.

6. OUTPUT CONSTRAINTS:
   - Return ONLY the formatted Markdown text.
   - Do NOT include conversational filler, introductory remarks ("Here is your formatted answer:"), or wrap the entire output in triple backtick code fences unless there is actual code.`;

/**
 * Smart rule-based local formatter fallback if API is unavailable.
 * Guarantees zero content change and cleans up blobs into Markdown lists and bold headings.
 */
export function formatAnswerLocally(rawText: string): string {
  if (!rawText || !rawText.trim()) return "";
  const trimmed = rawText.trim();

  // If text already has substantial Markdown formatting with headings or list bullets, clean spacing and return
  if (/(\*\*[^*]+\*\*|^\s*[-*•]\s+|^\s*\d+[\.\)]\s+)/m.test(trimmed)) {
    return trimmed;
  }

  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const formattedSections: string[] = [];

  // Common heading triggers
  const headingKeywords =
    /^(?:routes\s+of|indications|contraindications|advantages|disadvantages|complications|mechanism|clinical\s+features|management|types|causes|diagnosis|investigations|treatment|access|definition|risk\s+factors|criteria|enteral\s+nutrition|parenteral\s+nutrition|tpn|doses|prognosis|أسباب|أنواع|أعراض|مضاعفات|علاج|تشخيص|طرق|مميزات|عيوب)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a numbered item (e.g. "1. Enteral nutrition" or "1) ...")
    if (/^\d+[\.\)]\s+/.test(line)) {
      formattedSections.push(line);
      continue;
    }

    // Check if line is already bulleted
    if (/^[-*•]\s+/.test(line)) {
      formattedSections.push(`- ${line.replace(/^[-*•]\s+/, "")}`);
      continue;
    }

    // Check if line ends with a colon or is a known heading
    if (line.endsWith(":") || (headingKeywords.test(line) && line.length < 60)) {
      const cleanHeader = line.replace(/^\*\*|\*\*$/g, "").replace(/:$/, "");
      formattedSections.push(`\n**${cleanHeader}:**\n`);
      continue;
    }

    // Check if line contains an inline heading like "Access: NG tube, PEG"
    const inlineHeaderMatch = line.match(/^([A-Za-z\u0600-\u06FF\s]{2,30}):\s+(.+)$/);
    if (inlineHeaderMatch && headingKeywords.test(inlineHeaderMatch[1])) {
      formattedSections.push(`- **${inlineHeaderMatch[1]}:** ${inlineHeaderMatch[2]}`);
      continue;
    }

    formattedSections.push(line);
  }

  // Join and normalize consecutive empty lines
  return formattedSections.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Format an answer using Google Gemini
 */
async function formatWithGemini(
  rawAnswer: string,
  customApiKey?: string
): Promise<string> {
  const ai = getGenAI(customApiKey);
  const models = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];

  const prompt = `Please format the following medical/study answer for maximum visual readability in Markdown.
Remember: DO NOT CHANGE, REWRITE, SUMMARIZE, OR ALTER ANY MEDICAL CONTENT OR WORDING. ONLY IMPROVE FORMATTING (headings, numbered lists, bullets, spacing).

Answer:
"""
${rawAnswer.trim()}
"""`;

  let lastErr: any = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: FORMAT_ANSWER_SYSTEM_INSTRUCTION,
          temperature: 0.1, // very low temperature to ensure strict adherence to original wording
        },
      });

      const text = response?.text?.trim();
      if (text) {
        // Strip accidental outer ```markdown ... ``` wrapper if present
        const cleaned = text
          .replace(/^```(?:markdown)?\s*\n/i, "")
          .replace(/\n```\s*$/i, "")
          .trim();
        return cleaned;
      }
    } catch (err: any) {
      lastErr = err;
      continue;
    }
  }

  throw new Error(cleanErrorMessage(lastErr) || "Gemini formatting failed.");
}

/**
 * Format an answer using OpenRouter API
 */
async function formatWithOpenRouter(
  rawAnswer: string,
  openRouterApiKey: string,
  modelName: string = "google/gemini-2.5-flash"
): Promise<string> {
  const apiKey = openRouterApiKey.trim() || process.env.OPENROUTER_API_KEY || "";
  if (!apiKey) {
    throw new Error("No OpenRouter API key provided. Please configure OpenRouter in Settings.");
  }

  const prompt = `Please format the following medical/study answer for maximum visual readability in Markdown.
Remember: DO NOT CHANGE, REWRITE, SUMMARIZE, OR ALTER ANY MEDICAL CONTENT OR WORDING. ONLY IMPROVE FORMATTING (headings, numbered lists, bullets, spacing).

Answer:
"""
${rawAnswer.trim()}
"""`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://ai.studio/build",
      "X-Title": "Question Vault",
    },
    body: JSON.stringify({
      model: modelName || "google/gemini-2.5-flash",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: FORMAT_ANSWER_SYSTEM_INSTRUCTION,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `OpenRouter responded with status ${res.status}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenRouter returned an empty answer response.");
  }

  return text
    .replace(/^```(?:markdown)?\s*\n/i, "")
    .replace(/\n```\s*$/i, "")
    .trim();
}

export interface FormatAnswerOptions {
  apiKey?: string;
  provider?: "gemini" | "openrouter";
  openRouterApiKey?: string;
  openRouterModel?: string;
}

export interface FormatAnswerResult {
  formattedAnswer: string;
  providerUsed: "gemini" | "openrouter" | "local_fallback";
  usedFallback?: boolean;
}

/**
 * Universal formatAnswer function supporting Gemini, OpenRouter, and reliable local fallback.
 */
export async function formatAnswer(
  rawAnswer: string,
  options?: FormatAnswerOptions
): Promise<FormatAnswerResult> {
  const text = (rawAnswer || "").trim();
  if (!text) {
    return { formattedAnswer: "", providerUsed: "local_fallback" };
  }

  const provider = options?.provider || "gemini";

  if (provider === "openrouter") {
    try {
      const openRouterKey = options?.openRouterApiKey || process.env.OPENROUTER_API_KEY || "";
      const formatted = await formatWithOpenRouter(
        text,
        openRouterKey,
        options?.openRouterModel
      );
      return { formattedAnswer: formatted, providerUsed: "openrouter" };
    } catch (err: any) {
      console.warn("OpenRouter formatting error, falling back to local heuristic:", err?.message);
      return {
        formattedAnswer: formatAnswerLocally(text),
        providerUsed: "local_fallback",
        usedFallback: true,
      };
    }
  }

  // Default: Gemini
  try {
    const formatted = await formatWithGemini(text, options?.apiKey);
    return { formattedAnswer: formatted, providerUsed: "gemini" };
  } catch (err: any) {
    console.warn("Gemini formatting error, falling back to local heuristic:", err?.message);
    return {
      formattedAnswer: formatAnswerLocally(text),
      providerUsed: "local_fallback",
      usedFallback: true,
    };
  }
}
