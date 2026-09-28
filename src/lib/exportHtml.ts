/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question } from "../types/question.ts";

/**
 * Strips any sensitive or extraneous internal data and creates a self-contained
 * offline study HTML document with zero external dependencies.
 */
export function generateOfflineHtml(questions: Question[]): string {
  // Clean and prepare the questions array
  const sanitized = questions.map((q, idx) => ({
    id: q.id || `q_${idx}`,
    type: q.type || "short_answer",
    question: q.question || "",
    options: Array.isArray(q.options) ? q.options : [],
    answer: q.answerMarkdown || q.formattedAnswer || q.answer || "",
    explanation: q.explanation || "",
    subject: q.subject || "General",
    difficulty: q.difficulty || null,
    important: Boolean(q.important),
    createdAt: q.createdAt || "",
  }));

  const exportDate = new Date();
  const dateStr = exportDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const isoDate = exportDate.toISOString().split("T")[0];

  // Safely serialize JSON to avoid breaking out of script tag
  const serializedQuestions = JSON.stringify(sanitized)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Question Vault - Offline Study Guide (${isoDate})</title>
  <style>
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --surface-subtle: #f1f5f9;
      --border: #e2e8f0;
      --border-subtle: #cbd5e1;
      --text: #0f172a;
      --text-muted: #64748b;
      --text-subtle: #94a3b8;
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --primary-light: #eef2ff;
      --primary-text: #3730a3;
      --accent-green: #059669;
      --accent-green-bg: #ecfdf5;
      --accent-amber: #d97706;
      --accent-amber-bg: #fffbeb;
      --card-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
      --card-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --radius: 12px;
      --radius-sm: 8px;
    }

    [data-theme="dark"] {
      --bg: #090d16;
      --surface: #111827;
      --surface-subtle: #1f2937;
      --border: #2d3748;
      --border-subtle: #4a5568;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --text-subtle: #64748b;
      --primary: #6366f1;
      --primary-hover: #818cf8;
      --primary-light: rgba(99, 102, 241, 0.15);
      --primary-text: #c7d2fe;
      --accent-green: #10b981;
      --accent-green-bg: rgba(16, 185, 129, 0.15);
      --accent-amber: #f59e0b;
      --accent-amber-bg: rgba(245, 158, 11, 0.15);
      --card-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.4);
      --card-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 80px;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    /* Container */
    .container {
      max-width: 860px;
      margin: 0 auto;
      padding: 16px;
    }

    @media (min-width: 640px) {
      .container {
        padding: 24px 20px;
      }
    }

    /* Header */
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }

    .header-inner {
      max-width: 860px;
      margin: 0 auto;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-badge {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--primary), #818cf8);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
    }

    .title-group h1 {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.01em;
      line-height: 1.2;
    }

    .title-group p {
      font-size: 12px;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Buttons & Controls */
    button, select, input {
      font-family: inherit;
      font-size: 13px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .btn:hover {
      background: var(--surface-subtle);
      border-color: var(--border-subtle);
    }

    .btn-primary {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }

    .btn-primary:hover {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
      color: #ffffff;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 11px;
    }

    .btn-icon {
      padding: 7px;
      border-radius: var(--radius-sm);
    }

    /* Mode Switcher Tabs */
    .mode-switcher {
      display: inline-flex;
      background: var(--surface-subtle);
      padding: 3px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      gap: 2px;
    }

    .mode-tab {
      padding: 5px 12px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .mode-tab.active {
      background: var(--surface);
      color: var(--text);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    /* Filters Bar */
    .filters-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px;
      margin-bottom: 18px;
      box-shadow: var(--card-shadow);
    }

    .search-box {
      position: relative;
      margin-bottom: 12px;
    }

    .search-input {
      width: 100%;
      padding: 9px 36px 9px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text);
      outline: none;
      transition: border-color 0.15s ease;
    }

    .search-input:focus {
      border-color: var(--primary);
    }

    .search-clear-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      font-size: 14px;
      line-height: 1;
      display: none;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    @media (min-width: 640px) {
      .filter-grid {
        grid-template-columns: 1.5fr 1fr 1fr auto;
      }
    }

    .filter-select {
      padding: 7px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      outline: none;
      cursor: pointer;
      width: 100%;
    }

    .important-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      user-select: none;
      font-weight: 600;
      font-size: 12px;
      padding: 7px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      justify-content: center;
    }

    .important-toggle.active {
      background: var(--accent-amber-bg);
      border-color: var(--accent-amber);
      color: var(--accent-amber);
    }

    .status-bar {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Study Card */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--card-shadow);
      padding: 20px;
      margin-bottom: 16px;
      position: relative;
    }

    .card-badges {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      background: var(--surface-subtle);
      color: var(--text-muted);
      border: 1px solid var(--border);
      text-transform: capitalize;
    }

    .badge-subject {
      background: var(--primary-light);
      color: var(--primary-text);
      border-color: transparent;
    }

    .badge-important {
      background: var(--accent-amber-bg);
      color: var(--accent-amber);
      border-color: transparent;
    }

    .badge-easy {
      background: var(--accent-green-bg);
      color: var(--accent-green);
      border-color: transparent;
    }

    .badge-hard {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border-color: transparent;
    }

    .badge-medium {
      background: var(--accent-amber-bg);
      color: var(--accent-amber);
      border-color: transparent;
    }

    /* Question text */
    .question-prompt {
      font-size: 17px;
      font-weight: 600;
      color: var(--text);
      line-height: 1.5;
      margin-bottom: 16px;
      word-break: break-word;
    }

    /* MCQ options */
    .options-list {
      margin: 14px 0 18px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .option-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface-subtle);
      font-size: 14px;
      color: var(--text);
    }

    .option-marker {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* Answer section */
    .answer-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .answer-box {
      margin-top: 12px;
      padding: 14px 16px;
      border-radius: var(--radius-sm);
      background: var(--accent-green-bg);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--text);
    }

    .answer-box-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent-green);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .answer-content {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text);
    }

    .answer-content p {
      margin-bottom: 8px;
    }

    .answer-content p:last-child {
      margin-bottom: 0;
    }

    .answer-content ul, .answer-content ol {
      margin: 8px 0 8px 22px;
    }

    .answer-content li {
      margin-bottom: 4px;
    }

    .answer-content code {
      font-family: monospace;
      font-size: 12px;
      padding: 2px 5px;
      border-radius: 4px;
      background: var(--surface);
      border: 1px solid var(--border);
    }

    .answer-content pre {
      margin: 10px 0;
      padding: 10px;
      border-radius: var(--radius-sm);
      background: var(--surface);
      border: 1px solid var(--border);
      overflow-x: auto;
      font-family: monospace;
      font-size: 12px;
    }

    .answer-content h1, .answer-content h2, .answer-content h3 {
      margin: 12px 0 6px 0;
      font-weight: 700;
      line-height: 1.3;
    }

    .answer-content h1 { font-size: 16px; }
    .answer-content h2 { font-size: 15px; }
    .answer-content h3 { font-size: 14px; }

    .no-answer {
      font-style: italic;
      color: var(--text-muted);
      font-size: 13px;
    }

    /* Explanation box */
    .explanation-box {
      margin-top: 10px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      background: var(--accent-amber-bg);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: var(--text);
      font-size: 13px;
    }

    .explanation-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent-amber);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Single-card navigation */
    .card-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 10px 14px;
      box-shadow: var(--card-shadow);
    }

    .card-counter {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
    }

    .jump-select {
      max-width: 130px;
      padding: 4px 8px;
      font-size: 12px;
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 48px 20px;
      background: var(--surface);
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius);
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 32px;
      margin-bottom: 12px;
      display: block;
    }

    .empty-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 6px;
    }

    /* Keyboard hints */
    .shortcuts-bar {
      margin-top: 24px;
      text-align: center;
      font-size: 11px;
      color: var(--text-subtle);
      display: none;
    }

    @media (min-width: 768px) {
      .shortcuts-bar {
        display: block;
      }
    }

    .kbd {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border-subtle);
      background: var(--surface);
      box-shadow: 0 1px 1px rgba(0,0,0,0.1);
      font-family: monospace;
      font-size: 10px;
      color: var(--text-muted);
      margin: 0 2px;
    }

    /* Print styles */
    @media print {
      header, .filters-panel, .card-nav, .shortcuts-bar, .show-answer-btn, .mode-switcher {
        display: none !important;
      }
      body {
        background: #ffffff !important;
        color: #000000 !important;
      }
      .card {
        box-shadow: none !important;
        border: 1px solid #ccc !important;
        page-break-inside: avoid;
        margin-bottom: 20px;
      }
      .answer-box {
        display: block !important;
        background: #f9f9f9 !important;
        border: 1px solid #ddd !important;
      }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header>
    <div class="header-inner">
      <div class="logo-area">
        <div class="logo-badge" title="Question Vault">QV</div>
        <div class="title-group">
          <h1>Question Vault</h1>
          <p>Offline Study Guide &bull; ${sanitized.length} questions</p>
        </div>
      </div>

      <div class="header-actions">
        <!-- View mode switcher -->
        <div class="mode-switcher" id="mode-switcher" role="tablist">
          <button class="mode-tab active" id="mode-flashcard-btn" onclick="setMode('flashcard')">Flashcard</button>
          <button class="mode-tab" id="mode-list-btn" onclick="setMode('list')">Browse All</button>
        </div>

        <!-- Dark / Light theme toggle -->
        <button class="btn btn-icon" id="theme-toggle-btn" onclick="toggleTheme()" title="Toggle Dark/Light Mode" aria-label="Toggle Theme">
          <span id="theme-icon">&#9790;</span>
        </button>
      </div>
    </div>
  </header>

  <main class="container">
    <!-- Filter and Search Controls -->
    <div class="filters-panel">
      <!-- Search Input -->
      <div class="search-box">
        <input
          type="text"
          id="search-input"
          class="search-input"
          placeholder="Search questions, options, answers, explanations..."
          oninput="handleSearchChange()"
          autocomplete="off"
        >
        <button id="search-clear-btn" class="search-clear-btn" onclick="clearSearch()" title="Clear search">&times;</button>
      </div>

      <!-- Filters Row -->
      <div class="filter-grid">
        <select id="subject-filter" class="filter-select" onchange="handleFilterChange()">
          <option value="all">All Subjects</option>
        </select>

        <select id="type-filter" class="filter-select" onchange="handleFilterChange()">
          <option value="all">All Types</option>
          <option value="mcq">Multiple Choice (MCQ)</option>
          <option value="short_answer">Short Answer</option>
          <option value="enumerate">Enumerate</option>
        </select>

        <select id="difficulty-filter" class="filter-select" onchange="handleFilterChange()">
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <button id="important-filter-btn" class="important-toggle" onclick="toggleImportantFilter()">
          <span>&#9733;</span>
          <span>Important</span>
        </button>
      </div>

      <!-- Status Bar -->
      <div class="status-bar">
        <span id="result-count">Loading questions...</span>
        <button class="btn btn-sm" id="reset-filters-btn" onclick="resetFilters()">Reset Filters</button>
      </div>
    </div>

    <!-- Flashcard Mode Container -->
    <div id="flashcard-container" style="display: block;">
      <div class="card-nav">
        <button class="btn" id="prev-btn" onclick="prevCard()">
          <span>&larr;</span>
          <span>Previous</span>
        </button>

        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="card-counter" id="card-counter">Question 1 of 1</span>
          <select id="jump-select" class="filter-select jump-select" onchange="jumpToCard(this.value)" title="Jump to question"></select>
        </div>

        <button class="btn" id="next-btn" onclick="nextCard()">
          <span>Next</span>
          <span>&rarr;</span>
        </button>
      </div>

      <div id="single-card-view"></div>
    </div>

    <!-- Browse All Mode Container -->
    <div id="list-container" style="display: none;">
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 14px;">
        <button class="btn btn-sm" onclick="expandAllAnswers(true)">Show All Answers</button>
        <button class="btn btn-sm" onclick="expandAllAnswers(false)">Hide All Answers</button>
      </div>
      <div id="list-view-cards"></div>
    </div>

    <!-- Keyboard Shortcuts Hint -->
    <div class="shortcuts-bar">
      Shortcuts:
      <span class="kbd">&larr;</span> Previous
      <span class="kbd">&rarr;</span> Next
      <span class="kbd">Space</span> Show/Hide Answer
    </div>
  </main>

  <!-- Embed Raw Questions JSON safely -->
  <script>
    const RAW_QUESTIONS = ${serializedQuestions};

    // State
    let currentMode = 'flashcard'; // 'flashcard' | 'list'
    let filteredQuestions = [...RAW_QUESTIONS];
    let currentIndex = 0;
    let singleCardAnswerRevealed = false;
    let listRevealedIds = new Set();
    let importantOnly = false;

    // Lightweight built-in Markdown Parser with safe HTML escaping
    function escapeHtml(text) {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function renderMarkdown(raw) {
      if (!raw) return '';
      let str = escapeHtml(raw);

      // Multi-line code blocks
      str = str.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, function(match, code) {
        return '<pre><code>' + code.trim() + '</code></pre>';
      });

      // Inline code
      str = str.replace(/\`([^\`]+)\`/g, '<code>$1</code>');

      // Headings
      str = str.replace(/^### (.*$)/gim, '<h3>$1</h3>');
      str = str.replace(/^## (.*$)/gim, '<h2>$1</h2>');
      str = str.replace(/^# (.*$)/gim, '<h1>$1</h1>');

      // Bold & Italic
      str = str.replace(/\\*\\*\\*(.*?)\\*\\*\\*/g, '<strong><em>$1</em></strong>');
      str = str.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
      str = str.replace(/\\*(.*?)\\*/g, '<em>$1</em>');

      // Line by line parsing for lists & paragraphs
      const lines = str.split('\\n');
      let inUl = false;
      let inOl = false;
      let result = [];

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const ulMatch = line.match(/^[\\*\\-]\\s+(.*)$/);
        const olMatch = line.match(/^(\\d+)\\.\\s+(.*)$/);

        if (ulMatch) {
          if (inOl) { result.push('</ol>'); inOl = false; }
          if (!inUl) { result.push('<ul>'); inUl = true; }
          result.push('<li>' + ulMatch[1] + '</li>');
        } else if (olMatch) {
          if (inUl) { result.push('</ul>'); inUl = false; }
          if (!inOl) { result.push('<ol>'); inOl = true; }
          result.push('<li>' + olMatch[2] + '</li>');
        } else {
          if (inUl) { result.push('</ul>'); inUl = false; }
          if (inOl) { result.push('</ol>'); inOl = false; }
          if (line.trim().length > 0) {
            if (/^<(h[1-3]|pre)/i.test(line.trim())) {
              result.push(line);
            } else {
              result.push('<p>' + line + '</p>');
            }
          }
        }
      }
      if (inUl) result.push('</ul>');
      if (inOl) result.push('</ol>');

      return result.join('\\n');
    }

    // Populate Subjects Filter
    function populateSubjects() {
      const subjectSelect = document.getElementById('subject-filter');
      const subjects = new Set();
      RAW_QUESTIONS.forEach(q => {
        if (q.subject && q.subject.trim()) {
          subjects.add(q.subject.trim());
        }
      });
      const sorted = Array.from(subjects).sort((a, b) => a.localeCompare(b));
      sorted.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        subjectSelect.appendChild(opt);
      });
    }

    // Filter and Search Engine
    function applyFilters() {
      const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
      const subject = document.getElementById('subject-filter').value;
      const type = document.getElementById('type-filter').value;
      const difficulty = document.getElementById('difficulty-filter').value;

      filteredQuestions = RAW_QUESTIONS.filter(q => {
        // Search term matches question, options, answer, explanation, subject
        if (searchTerm) {
          const matchQ = q.question && q.question.toLowerCase().includes(searchTerm);
          const matchA = q.answer && q.answer.toLowerCase().includes(searchTerm);
          const matchE = q.explanation && q.explanation.toLowerCase().includes(searchTerm);
          const matchS = q.subject && q.subject.toLowerCase().includes(searchTerm);
          const matchO = q.options && q.options.some(opt => opt && opt.toLowerCase().includes(searchTerm));
          if (!matchQ && !matchA && !matchE && !matchS && !matchO) return false;
        }

        // Subject
        if (subject !== 'all' && q.subject !== subject) return false;

        // Type
        if (type !== 'all' && q.type !== type) return false;

        // Difficulty
        if (difficulty !== 'all' && q.difficulty !== difficulty) return false;

        // Important
        if (importantOnly && !q.important) return false;

        return true;
      });

      // Clamp index
      if (currentIndex >= filteredQuestions.length) {
        currentIndex = Math.max(0, filteredQuestions.length - 1);
      }
      singleCardAnswerRevealed = false;

      updateStatusCount();
      updateJumpDropdown();
      renderCurrentView();
    }

    function updateStatusCount() {
      const total = RAW_QUESTIONS.length;
      const count = filteredQuestions.length;
      const resultSpan = document.getElementById('result-count');
      resultSpan.textContent = 'Showing ' + count + ' of ' + total + ' questions';
    }

    function updateJumpDropdown() {
      const jump = document.getElementById('jump-select');
      jump.innerHTML = '';
      if (filteredQuestions.length === 0) {
        jump.style.display = 'none';
        return;
      }
      jump.style.display = 'inline-block';
      filteredQuestions.forEach((_, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = 'Card ' + (idx + 1);
        if (idx === currentIndex) opt.selected = true;
        jump.appendChild(opt);
      });
    }

    // Render Question Card
    function renderCardHtml(q, isRevealed, toggleFnName, cardIndex) {
      const typeLabels = {
        mcq: 'Multiple Choice',
        short_answer: 'Short Answer',
        enumerate: 'Enumerate'
      };

      let optionsHtml = '';
      if (q.type === 'mcq' && Array.isArray(q.options) && q.options.length > 0) {
        optionsHtml = '<div class="options-list">';
        q.options.forEach((opt, idx) => {
          const marker = String.fromCharCode(65 + idx); // A, B, C...
          optionsHtml += '<div class="option-item">' +
            '<span class="option-marker">' + marker + '</span>' +
            '<span dir="auto">' + escapeHtml(opt) + '</span>' +
            '</div>';
        });
        optionsHtml += '</div>';
      }

      let answerHtml = '';
      if (isRevealed) {
        const hasAnswer = q.answer && q.answer.trim().length > 0;
        const hasExplanation = q.explanation && q.explanation.trim().length > 0;

        answerHtml = '<div class="answer-section">' +
          '<div class="answer-box">' +
            '<div class="answer-box-title">&#10003; Model Answer</div>' +
            '<div class="answer-content" dir="auto">' +
              (hasAnswer ? renderMarkdown(q.answer) : '<p class="no-answer">No answer available.</p>') +
            '</div>' +
          '</div>';

        if (hasExplanation) {
          answerHtml += '<div class="explanation-box">' +
            '<div class="explanation-title">&#9888; Explanation / Notes</div>' +
            '<div class="answer-content" dir="auto">' + renderMarkdown(q.explanation) + '</div>' +
          '</div>';
        }

        answerHtml += '</div>';
      }

      const diffBadge = q.difficulty ? '<span class="badge badge-' + q.difficulty + '">' + q.difficulty + '</span>' : '';
      const impBadge = q.important ? '<span class="badge badge-important">&#9733; Important</span>' : '';
      const typeBadge = '<span class="badge">' + (typeLabels[q.type] || q.type) + '</span>';
      const subBadge = '<span class="badge badge-subject">' + escapeHtml(q.subject || 'General') + '</span>';

      return '<div class="card" id="question-card-' + (cardIndex !== undefined ? cardIndex : '') + '">' +
        '<div class="card-badges">' +
          subBadge +
          typeBadge +
          diffBadge +
          impBadge +
        '</div>' +
        '<div class="question-prompt" dir="auto">' + escapeHtml(q.question) + '</div>' +
        optionsHtml +
        '<div style="display: flex; justify-content: flex-start;">' +
          '<button class="btn show-answer-btn ' + (isRevealed ? '' : 'btn-primary') + '" onclick="' + toggleFnName + '">' +
            (isRevealed ? 'Hide Answer' : 'Show Answer') +
          '</button>' +
        '</div>' +
        answerHtml +
      '</div>';
    }

    // Render Current View
    function renderCurrentView() {
      if (currentMode === 'flashcard') {
        renderFlashcardView();
      } else {
        renderListView();
      }
    }

    function renderFlashcardView() {
      const container = document.getElementById('single-card-view');
      const counter = document.getElementById('card-counter');
      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');

      if (filteredQuestions.length === 0) {
        counter.textContent = 'Question 0 of 0';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        container.innerHTML = '<div class="empty-state">' +
          '<span class="empty-icon">&#128269;</span>' +
          '<h3 class="empty-title">No matching questions found</h3>' +
          '<p>Try adjusting your search or filters to see questions.</p>' +
          '</div>';
        return;
      }

      counter.textContent = 'Question ' + (currentIndex + 1) + ' of ' + filteredQuestions.length;
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === filteredQuestions.length - 1;

      const card = filteredQuestions[currentIndex];
      container.innerHTML = renderCardHtml(card, singleCardAnswerRevealed, 'toggleSingleAnswer()', currentIndex);
    }

    function renderListView() {
      const container = document.getElementById('list-view-cards');
      if (filteredQuestions.length === 0) {
        container.innerHTML = '<div class="empty-state">' +
          '<span class="empty-icon">&#128269;</span>' +
          '<h3 class="empty-title">No matching questions found</h3>' +
          '<p>Try adjusting your search or filters to see questions.</p>' +
          '</div>';
        return;
      }

      let html = '';
      filteredQuestions.forEach((q, idx) => {
        const isRevealed = listRevealedIds.has(q.id);
        html += renderCardHtml(q, isRevealed, 'toggleListAnswer("' + q.id + '")', idx);
      });
      container.innerHTML = html;
    }

    // Navigation & Interaction
    function toggleSingleAnswer() {
      singleCardAnswerRevealed = !singleCardAnswerRevealed;
      renderFlashcardView();
    }

    function toggleListAnswer(id) {
      if (listRevealedIds.has(id)) {
        listRevealedIds.delete(id);
      } else {
        listRevealedIds.add(id);
      }
      renderListView();
    }

    function expandAllAnswers(show) {
      if (show) {
        filteredQuestions.forEach(q => listRevealedIds.add(q.id));
      } else {
        listRevealedIds.clear();
      }
      renderListView();
    }

    function nextCard() {
      if (currentIndex < filteredQuestions.length - 1) {
        currentIndex++;
        singleCardAnswerRevealed = false;
        updateJumpDropdown();
        renderFlashcardView();
      }
    }

    function prevCard() {
      if (currentIndex > 0) {
        currentIndex--;
        singleCardAnswerRevealed = false;
        updateJumpDropdown();
        renderFlashcardView();
      }
    }

    function jumpToCard(idx) {
      const num = parseInt(idx, 10);
      if (!isNaN(num) && num >= 0 && num < filteredQuestions.length) {
        currentIndex = num;
        singleCardAnswerRevealed = false;
        renderFlashcardView();
      }
    }

    function setMode(mode) {
      currentMode = mode;
      document.getElementById('mode-flashcard-btn').classList.toggle('active', mode === 'flashcard');
      document.getElementById('mode-list-btn').classList.toggle('active', mode === 'list');
      document.getElementById('flashcard-container').style.display = mode === 'flashcard' ? 'block' : 'none';
      document.getElementById('list-container').style.display = mode === 'list' ? 'block' : 'none';
      renderCurrentView();
    }

    // Filter events
    function handleSearchChange() {
      const input = document.getElementById('search-input');
      const clearBtn = document.getElementById('search-clear-btn');
      clearBtn.style.display = input.value ? 'block' : 'none';
      applyFilters();
    }

    function clearSearch() {
      const input = document.getElementById('search-input');
      input.value = '';
      document.getElementById('search-clear-btn').style.display = 'none';
      applyFilters();
      input.focus();
    }

    function handleFilterChange() {
      applyFilters();
    }

    function toggleImportantFilter() {
      importantOnly = !importantOnly;
      const btn = document.getElementById('important-filter-btn');
      btn.classList.toggle('active', importantOnly);
      applyFilters();
    }

    function resetFilters() {
      document.getElementById('search-input').value = '';
      document.getElementById('search-clear-btn').style.display = 'none';
      document.getElementById('subject-filter').value = 'all';
      document.getElementById('type-filter').value = 'all';
      document.getElementById('difficulty-filter').value = 'all';
      importantOnly = false;
      document.getElementById('important-filter-btn').classList.remove('active');
      applyFilters();
    }

    // Theme Toggle
    function initTheme() {
      const savedTheme = localStorage.getItem('qv_theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      updateThemeIcon();
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('qv_theme', next);
      updateThemeIcon();
    }

    function updateThemeIcon() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const icon = document.getElementById('theme-icon');
      if (icon) {
        icon.innerHTML = isDark ? '&#9728;' : '&#9790;';
      }
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }
      if (currentMode === 'flashcard') {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextCard();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prevCard();
        } else if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          toggleSingleAnswer();
        }
      }
    });

    // Bootstrapping
    document.addEventListener('DOMContentLoaded', function() {
      initTheme();
      populateSubjects();
      applyFilters();
    });
  </script>
</body>
</html>`;
}

/**
 * Triggers a browser file download of the offline HTML study guide.
 */
export function downloadOfflineHtml(questions: Question[]): { filename: string; count: number } {
  const htmlContent = generateOfflineHtml(questions);
  const isoDate = new Date().toISOString().split("T")[0];
  const filename = `Question-Vault-Export-${isoDate}.html`;

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { filename, count: questions.length };
}
