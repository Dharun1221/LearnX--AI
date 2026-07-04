/**
 * LearnX AI - Backend Server
 * Pure Node.js (no external dependencies). Uses the built-in node:sqlite
 * module (requires Node.js v22.5+) for persistence, and the built-in
 * http module to serve the frontend + a small JSON API.
 *
 * Run with:  node server.js
 * Then open: http://localhost:3000
 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "learnx.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Database setup
// ---------------------------------------------------------------------------
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    category_scores TEXT NOT NULL,
    level TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ---------------------------------------------------------------------------
// Quiz question bank (correct answers live ONLY on the server - the old
// version leaked the correct answer in the HTML's radio `value` attribute,
// which meant anyone could "view source" and cheat. Fixed here.)
// ---------------------------------------------------------------------------
const QUESTIONS = [
  // HTML & CSS
  { id: "q1", category: "HTML & CSS", text: "What does HTML stand for?",
    options: [
      { id: "a", text: "Hyper Text Markup Language" },
      { id: "b", text: "High Text Machine Language" },
      { id: "c", text: "Hyperlink Text Manager" },
    ], correct: "a" },
  { id: "q2", category: "HTML & CSS", text: "Which tag is used to link a CSS file?",
    options: [
      { id: "a", text: "<script>" },
      { id: "b", text: "<link>" },
      { id: "c", text: "<css>" },
    ], correct: "b" },
  { id: "q3", category: "HTML & CSS", text: "Which CSS property controls text size?",
    options: [
      { id: "a", text: "font-size" },
      { id: "b", text: "text-style" },
      { id: "c", text: "size" },
    ], correct: "a" },
  { id: "q4", category: "HTML & CSS", text: "Flexbox is primarily used for?",
    options: [
      { id: "a", text: "Database queries" },
      { id: "b", text: "Layout & alignment" },
      { id: "c", text: "Server routing" },
    ], correct: "b" },

  // JavaScript
  { id: "q5", category: "JavaScript", text: "Which keyword declares a block-scoped variable?",
    options: [
      { id: "a", text: "var" },
      { id: "b", text: "let" },
      { id: "c", text: "global" },
    ], correct: "b" },
  { id: "q6", category: "JavaScript", text: "What does DOM stand for?",
    options: [
      { id: "a", text: "Document Object Model" },
      { id: "b", text: "Data Output Method" },
      { id: "c", text: "Direct Object Memory" },
    ], correct: "a" },
  { id: "q7", category: "JavaScript", text: "Which method converts JSON text into a JS object?",
    options: [
      { id: "a", text: "JSON.stringify()" },
      { id: "b", text: "JSON.parse()" },
      { id: "c", text: "JSON.object()" },
    ], correct: "b" },
  { id: "q8", category: "JavaScript", text: "An arrow function is written as?",
    options: [
      { id: "a", text: "function => ()" },
      { id: "b", text: "() => {}" },
      { id: "c", text: "=> function()" },
    ], correct: "b" },

  // Backend
  { id: "q9", category: "Backend", text: "What is the main job of a backend server?",
    options: [
      { id: "a", text: "Rendering colors" },
      { id: "b", text: "Handling logic, requests & data" },
      { id: "c", text: "Styling pages" },
    ], correct: "b" },
  { id: "q10", category: "Backend", text: "Which HTTP method is typically used to create a new resource?",
    options: [
      { id: "a", text: "GET" },
      { id: "b", text: "POST" },
      { id: "c", text: "STYLE" },
    ], correct: "b" },
  { id: "q11", category: "Backend", text: "An API is best described as?",
    options: [
      { id: "a", text: "A way for programs to communicate" },
      { id: "b", text: "A CSS framework" },
      { id: "c", text: "A type of database" },
    ], correct: "a" },
  { id: "q12", category: "Backend", text: "What is a REST API status code 404 mean?",
    options: [
      { id: "a", text: "Success" },
      { id: "b", text: "Not Found" },
      { id: "c", text: "Server Crashed" },
    ], correct: "b" },

  // Database
  { id: "q13", category: "Database", text: "What does SQL stand for?",
    options: [
      { id: "a", text: "Structured Query Language" },
      { id: "b", text: "Simple Question Logic" },
      { id: "c", text: "Server Query Link" },
    ], correct: "a" },
  { id: "q14", category: "Database", text: "Which SQL keyword retrieves data?",
    options: [
      { id: "a", text: "SELECT" },
      { id: "b", text: "FETCH" },
      { id: "c", text: "PULL" },
    ], correct: "a" },
  { id: "q15", category: "Database", text: "A primary key must be?",
    options: [
      { id: "a", text: "Unique for each row" },
      { id: "b", text: "The same for every row" },
      { id: "c", text: "Optional" },
    ], correct: "a" },
  { id: "q16", category: "Database", text: "NoSQL databases like MongoDB store data as?",
    options: [
      { id: "a", text: "Documents (JSON-like)" },
      { id: "b", text: "Only spreadsheets" },
      { id: "c", text: "Images" },
    ], correct: "a" },
];

// Learning resources used by the recommendation engine, per category+level.
const LEARNING_PATHS = {
  "HTML & CSS": {
    weak: ["HTML & CSS crash course (structure, tags, semantic HTML)", "CSS box model & Flexbox/Grid basics", "Build 2-3 static pages for practice"],
    strong: ["Advanced CSS animations & transitions", "Responsive design with media queries", "CSS architecture (BEM, utility-first)"],
  },
  "JavaScript": {
    weak: ["JavaScript fundamentals: variables, loops, functions", "DOM manipulation basics", "Practice: build a to-do list app"],
    strong: ["Async JS: promises & async/await", "ES6+ features & modules", "Build a small SPA without a framework"],
  },
  "Backend": {
    weak: ["What is a server & how HTTP works", "Intro to REST APIs", "Build a simple CRUD API"],
    strong: ["Authentication & authorization (JWT/sessions)", "API design best practices", "Scaling & middleware patterns"],
  },
  "Database": {
    weak: ["SQL basics: SELECT, INSERT, UPDATE, DELETE", "Understanding tables, keys & relationships", "Practice queries on a sample database"],
    strong: ["Database indexing & query optimization", "NoSQL vs SQL trade-offs", "Designing normalized schemas"],
  },
};

// ---------------------------------------------------------------------------
// Recommendation engine (rule-based, not ML)
// Analyzes per-category performance to build a personalized, ordered
// learning path - weakest areas first - plus an overall level.
// ---------------------------------------------------------------------------
function buildRecommendation(categoryScores) {
  const categories = Object.entries(categoryScores).map(([name, s]) => ({
    name,
    percent: Math.round((s.correct / s.total) * 100),
  }));

  // Weakest first -> that's the personalization: focus order adapts to
  // this specific student's results instead of a fixed curriculum.
  categories.sort((a, b) => a.percent - b.percent);

  const path = categories.map((c) => {
    const bucket = c.percent < 60 ? "weak" : "strong";
    return {
      category: c.name,
      percent: c.percent,
      focus: bucket === "weak" ? "Needs focus" : "Solid - keep sharp",
      resources: LEARNING_PATHS[c.name][bucket],
    };
  });

  return path;
}

function overallLevel(score, total) {
  const pct = (score / total) * 100;
  if (pct < 40) return "Beginner";
  if (pct < 75) return "Intermediate";
  return "Advanced";
}

// ---------------------------------------------------------------------------
// Tiny static file server helper
// ---------------------------------------------------------------------------
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
};

function serveStatic(req, res, pathname) {
  let filePath = pathname === "/" ? "/index.html" : pathname;
  const fullPath = path.join(PUBLIC_DIR, filePath);

  // Prevent path traversal outside the public directory
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(fullPath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, obj) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

// ---------------------------------------------------------------------------
// API handlers
// ---------------------------------------------------------------------------
async function handleRegister(req, res) {
  const body = await readJsonBody(req);
  const name = (body.name || "").trim();
  const email = (body.email || "").trim();

  if (!name || !email) {
    return sendJson(res, 400, { error: "Name and email are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendJson(res, 400, { error: "Please enter a valid email address." });
  }

  const stmt = db.prepare(
    "INSERT INTO users (name, email, created_at) VALUES (?, ?, ?)"
  );
  const info = stmt.run(name, email, new Date().toISOString());

  sendJson(res, 200, { userId: Number(info.lastInsertRowid), name });
}

function handleGetQuestions(req, res) {
  // Strip out the `correct` field before sending to the client.
  const publicQuestions = QUESTIONS.map(({ id, category, text, options }) => ({
    id,
    category,
    text,
    options,
  }));
  sendJson(res, 200, { questions: publicQuestions });
}

async function handleSubmit(req, res) {
  const body = await readJsonBody(req);
  const { userId, answers } = body;

  if (!userId || typeof answers !== "object") {
    return sendJson(res, 400, { error: "userId and answers are required." });
  }

  const userRow = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!userRow) {
    return sendJson(res, 404, { error: "User not found." });
  }

  let score = 0;
  const categoryScores = {};

  for (const q of QUESTIONS) {
    if (!categoryScores[q.category]) {
      categoryScores[q.category] = { correct: 0, total: 0 };
    }
    categoryScores[q.category].total += 1;

    const given = answers[q.id];
    if (given && given === q.correct) {
      score += 1;
      categoryScores[q.category].correct += 1;
    }
  }

  const total = QUESTIONS.length;
  const level = overallLevel(score, total);

  const stmt = db.prepare(
    `INSERT INTO results (user_id, score, total, category_scores, level, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(
    userId,
    score,
    total,
    JSON.stringify(categoryScores),
    level,
    new Date().toISOString()
  );

  sendJson(res, 200, { resultId: Number(info.lastInsertRowid) });
}

function handleGetAllRecords(req, res) {
  const rows = db
    .prepare(
      `SELECT
         users.id AS user_id,
         users.name,
         users.email,
         users.created_at AS registered_at,
         results.id AS result_id,
         results.score,
         results.total,
         results.level,
         results.category_scores,
         results.created_at AS submitted_at
       FROM users
       LEFT JOIN results ON results.user_id = users.id
       ORDER BY users.id DESC, results.id DESC`
    )
    .all();

  // Group multiple attempts under each student.
  const byUser = new Map();
  for (const row of rows) {
    if (!byUser.has(row.user_id)) {
      byUser.set(row.user_id, {
        userId: row.user_id,
        name: row.name,
        email: row.email,
        registeredAt: row.registered_at,
        attempts: [],
      });
    }
    if (row.result_id) {
      byUser.get(row.user_id).attempts.push({
        resultId: row.result_id,
        score: row.score,
        total: row.total,
        level: row.level,
        categoryScores: JSON.parse(row.category_scores),
        submittedAt: row.submitted_at,
      });
    }
  }

  sendJson(res, 200, { students: Array.from(byUser.values()) });
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function handleExportCsv(req, res) {
  const rows = db
    .prepare(
      `SELECT
         users.name,
         users.email,
         results.id AS result_id,
         results.score,
         results.total,
         results.level,
         results.category_scores,
         results.created_at AS submitted_at
       FROM results
       JOIN users ON users.id = results.user_id
       ORDER BY results.id ASC`
    )
    .all();

  // Collect the full set of category names so every row has consistent columns,
  // even if future quiz versions add/remove categories.
  const categorySet = new Set();
  const parsed = rows.map((r) => {
    const cat = JSON.parse(r.category_scores);
    Object.keys(cat).forEach((c) => categorySet.add(c));
    return { ...r, cat };
  });
  const categories = Array.from(categorySet);

  const header = [
    "Result ID",
    "Name",
    "Email",
    "Score",
    "Total",
    "Percentage",
    "Level",
    "Submitted At",
    ...categories.map((c) => `${c} (correct/total)`),
  ];

  const lines = [header.map(csvEscape).join(",")];

  for (const r of parsed) {
    const percentage = Math.round((r.score / r.total) * 100);
    const row = [
      r.result_id,
      r.name,
      r.email,
      r.score,
      r.total,
      `${percentage}%`,
      r.level,
      r.submitted_at,
      ...categories.map((c) =>
        r.cat[c] ? `${r.cat[c].correct}/${r.cat[c].total}` : ""
      ),
    ];
    lines.push(row.map(csvEscape).join(","));
  }

  const csv = lines.join("\r\n");

  res.writeHead(200, {
    "Content-Type": "text/csv",
    "Content-Disposition": `attachment; filename="learnx-results-${Date.now()}.csv"`,
  });
  res.end(csv);
}

function handleGetResult(req, res, resultId) {
  const row = db
    .prepare(
      `SELECT results.*, users.name, users.email
       FROM results JOIN users ON users.id = results.user_id
       WHERE results.id = ?`
    )
    .get(resultId);

  if (!row) {
    return sendJson(res, 404, { error: "Result not found." });
  }

  const categoryScores = JSON.parse(row.category_scores);
  const recommendation = buildRecommendation(categoryScores);

  sendJson(res, 200, {
    name: row.name,
    score: row.score,
    total: row.total,
    level: row.level,
    categoryScores,
    recommendation,
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  try {
    if (pathname === "/api/register" && req.method === "POST") {
      return await handleRegister(req, res);
    }
    if (pathname === "/api/questions" && req.method === "GET") {
      return handleGetQuestions(req, res);
    }
    if (pathname === "/api/submit" && req.method === "POST") {
      return await handleSubmit(req, res);
    }
    if (pathname.startsWith("/api/result/") && req.method === "GET") {
      const resultId = pathname.split("/").pop();
      return handleGetResult(req, res, resultId);
    }
    if (pathname === "/api/admin/records" && req.method === "GET") {
      return handleGetAllRecords(req, res);
    }
    if (pathname === "/api/admin/export" && req.method === "GET") {
      return handleExportCsv(req, res);
    }
    if (pathname.startsWith("/api/")) {
      return sendJson(res, 404, { error: "Unknown API route." });
    }

    // Everything else -> static files (html/css/js)
    return serveStatic(req, res, pathname);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: "Internal server error." });
  }
});

server.listen(PORT, () => {
  console.log(`LearnX AI running at http://localhost:${PORT}`);
});
