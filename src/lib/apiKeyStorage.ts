/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const GEMINI_STORAGE_KEY = "question_vault_gemini_api_key";
const OPENROUTER_STORAGE_KEY = "question_vault_openrouter_api_key";
const PROVIDER_STORAGE_KEY = "question_vault_ai_provider";
const OPENROUTER_MODEL_KEY = "question_vault_openrouter_model";

export function getStoredGeminiApiKey(): string {
  try {
    return localStorage.getItem(GEMINI_STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function setStoredGeminiApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(GEMINI_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function clearStoredGeminiApiKey(): void {
  try {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasStoredGeminiApiKey(): boolean {
  return getStoredGeminiApiKey().length > 0;
}

export function getStoredOpenRouterApiKey(): string {
  try {
    return localStorage.getItem(OPENROUTER_STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function setStoredOpenRouterApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(OPENROUTER_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(OPENROUTER_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function clearStoredOpenRouterApiKey(): void {
  try {
    localStorage.removeItem(OPENROUTER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasStoredOpenRouterApiKey(): boolean {
  return getStoredOpenRouterApiKey().length > 0;
}

export type AiProvider = "gemini" | "openrouter";

export function getStoredAiProvider(): AiProvider {
  try {
    const val = localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (val === "openrouter") return "openrouter";
    return "gemini";
  } catch {
    return "gemini";
  }
}

export function setStoredAiProvider(provider: AiProvider): void {
  try {
    localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  } catch {
    // ignore
  }
}

export function getStoredOpenRouterModel(): string {
  try {
    return localStorage.getItem(OPENROUTER_MODEL_KEY)?.trim() || "google/gemini-2.5-flash";
  } catch {
    return "google/gemini-2.5-flash";
  }
}

export function setStoredOpenRouterModel(model: string): void {
  try {
    localStorage.setItem(OPENROUTER_MODEL_KEY, model.trim());
  } catch {
    // ignore
  }
}

