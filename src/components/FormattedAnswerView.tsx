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
          // Headings with clear hierarchy and academic styling
          h1: ({ node, children, className: h1Class, ...props }) => (
            <h1
              className={`text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 mt-4 mb-2 pb-1.5 first:mt-0 tracking-tight border-b border-zinc-200/80 dark:border-zinc-800/80 ${h1Class || ""}`}
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ node, children, className: h2Class, ...props }) => (
            <h2
              className={`text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-2 first:mt-0 tracking-tight flex items-center gap-2 border-l-3 border-emerald-500/80 dark:border-emerald-400/80 pl-2.5 ${h2Class || ""}`}
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ node, children, className: h3Class, ...props }) => (
            <h3
              className={`text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-3 mb-1.5 first:mt-0 tracking-tight ${h3Class || ""}`}
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({ node, children, className: h4Class, ...props }) => (
            <h4
              className={`text-[11px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-2.5 mb-1 first:mt-0 uppercase tracking-wider ${h4Class || ""}`}
              {...props}
            >
              {children}
            </h4>
          ),

          // Body text
          p: ({ node, children, className: pClass, ...props }) => (
            <p className={`mb-2.5 last:mb-0 leading-relaxed text-zinc-800 dark:text-zinc-200 ${pClass || ""}`} {...props}>
              {children}
            </p>
          ),

          // High-contrast emphasis
          strong: ({ node, children, className: strongClass, ...props }) => (
            <strong className={`font-bold text-zinc-950 dark:text-white ${strongClass || ""}`} {...props}>
              {children}
            </strong>
          ),
          em: ({ node, children, className: emClass, ...props }) => (
            <em className={`italic text-zinc-850 dark:text-zinc-150 ${emClass || ""}`} {...props}>
              {children}
            </em>
          ),

          // Structured lists with neat spacing
          ul: ({ node, children, className: ulClass, ...props }) => (
            <ul
              className={`list-disc pl-5 my-2.5 space-y-1.5 marker:text-emerald-600 dark:marker:text-emerald-400 text-zinc-800 dark:text-zinc-200 ${ulClass || ""}`}
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ node, children, className: olClass, ...props }) => (
            <ol
              className={`list-decimal pl-5 my-2.5 space-y-1.5 marker:font-bold marker:text-emerald-700 dark:marker:text-emerald-400 text-zinc-800 dark:text-zinc-200 ${olClass || ""}`}
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ node, children, className: liClass, ...props }) => (
            <li className={`leading-relaxed pl-1 [&>p]:inline [&>p]:mb-0 ${liClass || ""}`} {...props}>
              {children}
            </li>
          ),

          // Callouts & blockquotes
          blockquote: ({ node, children, className: bqClass, ...props }) => (
            <blockquote
              className={`my-3 rounded-r-xl border-l-3 border-emerald-500/70 bg-emerald-50/50 p-3 text-xs sm:text-sm italic text-zinc-700 dark:border-emerald-500/50 dark:bg-emerald-950/25 dark:text-zinc-300 [&>p]:mb-1 [&>p:last-child]:mb-0 ${bqClass || ""}`}
              {...props}
            >
              {children}
            </blockquote>
          ),

          // Monospaced terms & calculations
          code: ({ node, children, className: codeClass, ...props }) => (
            <code
              className={`rounded-md border border-zinc-200/70 bg-zinc-100/90 px-1.5 py-0.5 font-mono text-[11px] sm:text-xs font-medium text-zinc-800 dark:border-zinc-750 dark:bg-zinc-800/90 dark:text-zinc-200 ${codeClass || ""}`}
              {...props}
            >
              {children}
            </code>
          ),
          pre: ({ node, children, className: preClass, ...props }) => (
            <pre
              className={`my-3 overflow-x-auto rounded-xl border border-zinc-200/80 bg-zinc-900 p-3 font-mono text-xs text-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 ${preClass || ""}`}
              {...props}
            >
              {children}
            </pre>
          ),

          // Horizontal divider
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-t border-zinc-200/80 dark:border-zinc-800/80" {...props} />
          ),

          // External reference links
          a: ({ node, children, className: aClass, href, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium text-emerald-600 underline underline-offset-2 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 ${aClass || ""}`}
              {...props}
            >
              {children}
            </a>
          ),

          // High-grade academic tables
          table: ({ node, children, className: tableClass, ...props }) => (
            <div className="my-3.5 w-full overflow-x-auto rounded-xl border border-zinc-200/90 bg-white/95 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90">
              <table
                className={`w-full min-w-full border-collapse text-left text-xs sm:text-sm ${tableClass || ""}`}
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ node, children, className: theadClass, ...props }) => (
            <thead
              className={`border-b border-zinc-200 bg-zinc-100/90 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/90 dark:text-zinc-100 font-bold ${theadClass || ""}`}
              {...props}
            >
              {children}
            </thead>
          ),
          tbody: ({ node, children, className: tbodyClass, ...props }) => (
            <tbody
              className={`divide-y divide-zinc-200/80 text-zinc-800 dark:divide-zinc-800/80 dark:text-zinc-200 ${tbodyClass || ""}`}
              {...props}
            >
              {children}
            </tbody>
          ),
          tr: ({ node, children, className: trClass, ...props }) => (
            <tr
              className={`even:bg-zinc-50/70 hover:bg-emerald-50/35 dark:even:bg-zinc-850/40 dark:hover:bg-emerald-950/20 transition-colors duration-150 ${trClass || ""}`}
              {...props}
            >
              {children}
            </tr>
          ),
          th: ({ node, children, className: thClass, style, ...props }) => (
            <th
              className={`py-2.5 px-3.5 sm:py-3 sm:px-4 font-bold text-xs tracking-tight text-zinc-900 dark:text-white border-r border-zinc-200/70 last:border-r-0 dark:border-zinc-800/70 min-w-[100px] sm:min-w-[120px] ${thClass || ""}`}
              style={style}
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ node, children, className: tdClass, style, ...props }) => (
            <td
              className={`py-2.5 px-3.5 sm:py-3 sm:px-4 text-xs sm:text-[13px] leading-relaxed align-top border-r border-zinc-200/60 last:border-r-0 dark:border-zinc-800/60 ${tdClass || ""}`}
              style={style}
              {...props}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
