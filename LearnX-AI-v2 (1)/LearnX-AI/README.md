# LearnX AI
### KJU Hackathon Project

## Problem Statement
Traditional classroom and online learning methods rely heavily on
one-size-fits-all content delivery, resulting in low student engagement,
poor knowledge retention, and limited personalization to individual
learning needs and pace.

## Proposed Solution
An AI-powered platform that analyzes student performance and provides
personalized learning paths — giving every category of student a clearer,
more effective path through their learning journey.

## Product Description
LearnX AI gives students a short diagnostic assessment across four core
topics, identifies their strengths and weaknesses **per topic**, and
generates a personalized, priority-ordered learning path — weakest topics
first.

> **Note on "AI":** the recommendation engine is a rule-based adaptive
> system (it analyzes per-category performance to personalize the path),
> not a trained machine-learning model. That's a completely legitimate and
> common approach for a project at this stage — see "Future Improvements"
> below for how to evolve it into real ML.

---

## What's New in v2

- **Real backend** — Node.js server with a SQLite database (users +
  results are actually persisted, not just held in `localStorage`).
- **Server-side scoring** — correct answers now live only on the server.
  (The old version put the correct answer directly in the HTML's radio
  `value` attribute — anyone could "view source" and see the answers. Fixed.)
- **Expanded, categorized quiz** — 16 questions across 4 categories:
  HTML & CSS, JavaScript, Backend, and Database.
- **Category breakdown + smarter recommendations** — results show a
  per-category score bar and an ordered "focus on this first" learning path.
- **Bug fixes** — removed a stray duplicate `</body>` tag, added form
  validation and error messaging, registration data is now actually saved.

---

## Project Structure

```
LearnX-AI/
├── server.js              # Node.js backend (static files + JSON API)
├── package.json
├── data/                  # SQLite database file created here at runtime
└── public/
    ├── index.html
    ├── register.html
    ├── assessment.html
    ├── result.html
    ├── css/style.css
    └── js/
        ├── register.js
        ├── assessment.js
        └── result.js
```

## Running It

**Requirement:** Node.js **v22.5 or newer** (uses the built-in `node:sqlite`
module, so there's nothing to `npm install`).

```bash
node server.js
```

Then open **http://localhost:3000** in your browser.

If you're on an older Node version, check with `node -v` and upgrade —
no other dependencies are needed.

## API Reference

| Method | Route              | Body / Params                  | Description                          |
|--------|--------------------|---------------------------------|---------------------------------------|
| POST   | `/api/register`    | `{ name, email }`               | Creates a student, returns `userId`   |
| GET    | `/api/questions`   | –                                | Returns quiz questions (no answers)   |
| POST   | `/api/submit`      | `{ userId, answers }`           | Scores the quiz, returns `resultId`   |
| GET    | `/api/result/:id`  | –                                | Returns score, breakdown & path       |

## Future Improvements

- **Real ML-based recommendations**: once you have enough student
  attempts logged in the `results` table, you could train a simple
  classifier/clustering model (e.g. k-means on category scores) to group
  students into learning profiles automatically.
- **Auth**: add password/OTP login so students can return to see progress
  over time.
- **More questions & difficulty levels**: adaptive question difficulty
  based on live performance (true CAT-style testing).
- **Progress tracking dashboard** for repeat assessments over time.
