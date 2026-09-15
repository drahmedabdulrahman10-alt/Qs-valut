import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FormattedAnswerViewProps {
  content?: string | null;
  className?: string;
  placeholder?: string;
}

export function FormattedAnswerView({
  content,
  className = "",
  placeholder = "No answer provided.",
}: FormattedAnswerViewProps) {
  if (!content || !content.trim()) {
    return (
      <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
        {placeholder}
      </p>
    );
  }

  return (
    <div
      className={`formatted-answer-container leading-relaxed font-sans text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 ${className}`}
      dir="auto"
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-4 mb-2 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mt-3.5 mb-2 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mt-3 mb-1.5 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-zinc-900 dark:text-white">
              {children}
            </strong>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 marker:text-emerald-600 dark:marker:text-emerald-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 marker:font-semibold marker:text-emerald-700 dark:marker:text-emerald-400">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">
              {children}
            </li>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
