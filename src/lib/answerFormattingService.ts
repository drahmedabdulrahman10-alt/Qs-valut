/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getStoredGeminiApiKey,
  getStoredOpenRouterApiKey,
  getStoredAiProvider,
  getStoredOpenRouterModel,
} from "./apiKeyStorage.ts";

export interface FormatAnswerResponse {
  success: boolean;
  formattedAnswer: string;
  providerUsed: string;
  usedFallback?: boolean;
}

export async function requestAnswerFormatting(
  rawAnswer: string
): Promise<FormatAnswerResponse> {
  const provider = getStoredAiProvider();
  const geminiKey = getStoredGeminiApiKey();
  const openRouterKey = getStoredOpenRouterApiKey();
  const openRouterModel = getStoredOpenRouterModel();

  const response = await fetch("/api/format-answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(geminiKey ? { "x-gemini-api-key": geminiKey } : {}),
      ...(openRouterKey ? { "x-openrouter-api-key": openRouterKey } : {}),
    },
    body: JSON.stringify({
      answer: rawAnswer,
      provider,
      apiKey: geminiKey || undefined,
      openRouterApiKey: openRouterKey || undefined,
      openRouterModel: openRouterModel || undefined,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${response.status}`);
  }

  return await response.json();
}
