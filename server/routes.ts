/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import type { Request, Response } from "express";
import {
  parseQuestionsWithGemini,
  testGeminiApiKey,
  cleanErrorMessage,
} from "./gemini.js";
import { formatAnswer } from "./answerFormatter.js";

export const apiRouter = express.Router();

apiRouter.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Question Vault API",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
  });
});

/**
 * Endpoint to test OpenRouter API key connection
 */
apiRouter.post("/test-openrouter-key", async (req: Request, res: Response) => {
  try {
    const apiKeyFromBody = req.body?.apiKey;
    const apiKeyFromHeader = req.headers["x-openrouter-api-key"] as string | undefined;
    const apiKey = (apiKeyFromBody || apiKeyFromHeader || "").trim();

    if (!apiKey) {
      return res.status(200).json({
        success: false,
        message: "Please provide an OpenRouter API key to test.",
      });
    }

    const checkRes = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (checkRes.ok) {
      const data = await checkRes.json().catch(() => ({}));
      const label = data?.data?.label ? ` (${data.data.label})` : "";
      return res.json({
        success: true,
        message: `OpenRouter API key is valid${label}.`,
      });
    }

    const errorBody = await checkRes.json().catch(() => ({}));
    return res.status(200).json({
      success: false,
      message: errorBody?.error?.message || `OpenRouter responded with status ${checkRes.status}`,
    });
  } catch (error: any) {
    console.error("Error in /api/test-openrouter-key:", error);
    return res.status(200).json({
      success: false,
      message: cleanErrorMessage(error) || "Failed to reach OpenRouter API.",
    });
  }
});

/**
 * Dedicated answer formatting endpoint.
 * Restructures medical and study answers into visually readable Markdown.
 * STRICT DIRECTIVE: Content, wording, and meaning are NEVER altered.
 */
apiRouter.post("/format-answer", async (req: Request, res: Response) => {
  try {
    const {
      answer,
      apiKey,
      provider,
      openRouterApiKey,
      openRouterModel,
    } = req.body || {};

    if (!answer || typeof answer !== "string" || !answer.trim()) {
      return res.status(400).json({
        error: "No answer content provided to format.",
      });
    }

    const result = await formatAnswer(answer, {
      apiKey: apiKey || (req.headers["x-gemini-api-key"] as string | undefined),
      provider: provider === "openrouter" ? "openrouter" : "gemini",
      openRouterApiKey:
        openRouterApiKey || (req.headers["x-openrouter-api-key"] as string | undefined),
      openRouterModel,
    });

    return res.json({
      success: true,
      formattedAnswer: result.formattedAnswer,
      providerUsed: result.providerUsed,
      usedFallback: result.usedFallback,
    });
  } catch (error: any) {
    console.error("Error in /api/format-answer:", error);
    return res.status(500).json({
      error: cleanErrorMessage(error) || "Failed to format answer.",
    });
  }
});

/**
 * Endpoint to test Gemini API key connection
 */
apiRouter.post("/test-gemini-key", async (req: Request, res: Response) => {
  try {
    const apiKeyFromBody = req.body?.apiKey;
    const apiKeyFromHeader = req.headers["x-gemini-api-key"] as string | undefined;
    const apiKey = (apiKeyFromBody || apiKeyFromHeader || "").trim();

    const result = await testGeminiApiKey(apiKey);
    return res.json(result);
  } catch (error: any) {
    console.error("Error in /api/test-gemini-key:", error);
    return res.status(200).json({
      success: false,
      message: cleanErrorMessage(error) || "Gemini API key is invalid or unavailable.",
    });
  }
});

/**
 * Intelligent question parser endpoint
 */
apiRouter.post("/parse-questions", async (req: Request, res: Response) => {
  try {
    const { text, defaultSubject, defaultSource, apiKey: apiKeyFromBody } = req.body || {};
    const apiKeyFromHeader = req.headers["x-gemini-api-key"] as string | undefined;
    const customApiKey = (apiKeyFromBody || apiKeyFromHeader || "").trim() || undefined;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        error: "Please paste or enter study material to extract questions from.",
      });
    }

    if (text.length > 200000) {
      return res.status(400).json({
        error: "Input text is too large. Please paste questions in batches under 200,000 characters.",
      });
    }

    const result = await parseQuestionsWithGemini(
      text,
      typeof defaultSubject === "string" ? defaultSubject : undefined,
      typeof defaultSource === "string" ? defaultSource : undefined,
      customApiKey
    );

    return res.json({
      success: true,
      count: result.questions.length,
      questions: result.questions,
      modelUsed: result.modelUsed,
      usedFallback: result.usedFallback,
      usingPersonalKey: result.usingPersonalKey,
    });
  } catch (error: any) {
    console.error("Error in /api/parse-questions:", error);
    const errorMessage = cleanErrorMessage(error);
    return res.status(500).json({
      error: errorMessage,
    });
  }
});
