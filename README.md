# DSA Tracker

A self-hosted tracker for structured Data Structures & Algorithms practice —
organize problems by topic and pattern, log notes and multiple solution
attempts, monitor progress with activity heatmaps, and maintain daily and
long-term goals with streak tracking.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

## Features

- **DSA Sheet** — every signed-in user sees the curated set of DSA
  topics and questions (same as striver a2z dsa sheet), each linking straight
  to the original problem (LeetCode / GeeksforGeeks / CodeStudio / etc.) and
  its reference video where available , problems are sorted by topic and difficulty.
- **My Topics** — alongside the DSA sheet, everyone can still add their
  own topics and questions manually, exactly as before.
- **Per-question workspace** — record the pattern, personal notes, approach,
  companies known to ask it, your initial solution, and an optimized
  solution, each independently editable — including on shared questions,
  where your notes are private to you even though the question itself is
  shared.
- **Progress bars & completion tracking** — a circular checkbox on every
  question marks it done/undone; topic rows and the dashboard show a live
  completed/total progress bar.
- **Activity heatmaps** — GitHub-style calendar heatmaps for questions
  solved, patterns documented, and notes written.
- **Daily goals** — set a target question for the day; mark it complete or
  log a reason it wasn't finished. Entries older than seven weeks are
  pruned automatically.
- **Long-term goals** — track goals with due dates that persist
  indefinitely, independent of daily goals.
- **Concept tracking** — maintain separate lists of concepts learned and
  concepts still to learn.
- **Streaks** — a running count of consecutive active days.
- **Authentication** — email/password and Google sign-in, with all personal
  data scoped to the authenticated user.

## Tech stack

| Layer          | Technology                          |
|----------------|--------------------------------------|
| Framework      | Next.js 14 (App Router), React 18    |
| Styling        | Tailwind CSS                         |
| Auth           | Firebase Authentication              |
| Database       | Cloud Firestore                      |
| Hosting        | Vercel (or any Next.js-compatible host) |


The app is served at `https://trakdsajourney.vercel.app`. Unauthenticated visitors are
redirected to `/login`.

## License

MIT
