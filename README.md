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

- **Topic → question hierarchy** — organize problems into topics, each
  tagged with a difficulty level (easy / medium / hard).
- **Per-question workspace** — record the pattern, personal notes, approach,
  companies known to ask it, your initial solution, and an optimized
  solution, each independently editable.
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
- **Authentication** — email/password and Google sign-in, with all data
  scoped to the authenticated user.

## Tech stack

| Layer          | Technology                          |
|----------------|--------------------------------------|
| Framework      | Next.js 14 (App Router), React 18    |
| Styling        | Tailwind CSS                         |
| Auth           | Firebase Authentication              |
| Database       | Cloud Firestore                      |
| Hosting        | Vercel (or any Next.js-compatible host) |

All services used have a free tier sufficient for individual use.

## Getting started

### Prerequisites

- Node.js 18+
- A Firebase project (see [Firebase setup](#firebase-setup))

### Installation

```bash
git clone https://github.com/itsabhinavdevs/dsa-tracker
cd dsa-tracker
npm install
cp .env.local.example .env.local
```

Populate `.env.local` with your Firebase project credentials,
then start the development server:

```bash
npm run dev
```

The app is served at `http://localhost:3000`. Unauthenticated visitors are
redirected to `/login`.

## Firebase setup

1. Create a project at the [Firebase console](https://console.firebase.google.com).
2. Under **Build → Authentication → Sign-in method**, enable **Email/Password**
   and **Google**.
3. Under **Build → Firestore Database**, create a database in production
   mode.
4. Under **Project settings → General → Your apps**, register a Web app and
   copy the resulting config values into `.env.local`:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   ```

5. Deploy the security rules included in `firestore.rules`, either via the
   Firebase console (**Firestore → Rules → paste and publish**) or the CLI:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore
   firebase deploy --only firestore:rules
   ```

## Deployment

The app deploys cleanly to [Vercel](https://vercel.com):

1. Import the repository into a new Vercel project.
2. Add the six `NEXT_PUBLIC_FIREBASE_*` variables under **Environment
   Variables**.
3. Deploy. Subsequent pushes to the default branch redeploy automatically.
4. Add the deployed domain to **Authentication → Settings → Authorized
   domains** in the Firebase console so Google sign-in works in production.

Any other Next.js-compatible host (Netlify, Cloudflare Pages, self-managed
Node server) works the same way, provided the same environment variables
are set.

## Data model

```
users/{uid}/
  topics/{topicId}
    { name, createdAt }
    questions/{questionId}
      { title, difficulty, description, pattern, note, approach,
        companies, mySolution, optimizedSolution, ownerId, createdAt }
  daily_goals/{YYYY-MM-DD}
    { topic, question, difficulty, completed, reason }
  goals/{goalId}
    { text, dueDate, completed, createdAt }
  concepts/{conceptId}
    { text, status: "learned" | "todo", createdAt }
  heatmap_questions/{YYYY-MM-DD}   { count }
  heatmap_pattern/{YYYY-MM-DD}     { count }
  heatmap_note/{YYYY-MM-DD}        { count }
  meta/streak                      { current, lastActiveDate }
```

Access is restricted per-user via `firestore.rules`: a document under
`users/{uid}` is only readable and writable by that user.

### Notable behavior

- The questions heatmap increments on every new question added.
- The pattern and note heatmaps increment once per question, on the
  transition from an empty field to a non-empty one — subsequent edits do
  not increment further.
- Daily goal records older than 49 days are deleted automatically on
  dashboard load; long-term goals are never deleted automatically.
- Streaks increment once per calendar day of activity and reset after a
  skipped day.

## Project structure

```
app/
  layout.js                    Root layout — auth provider, app chrome
  page.js                      Dashboard: goals + heatmaps
  login/page.js                Sign-in / sign-up
  topics/page.js                Topic tree and question lists
  topics/[topicId]/[questionId]/page.js   Question detail and tabs
  concepts/page.js             Learned / yet-to-learn concepts
components/
  AppChrome.js                 Top bar and slide-in navigation, all pages
  Heatmap.js                   Reusable calendar heatmap
lib/
  firebase.js                  Firebase app initialization
  useAuth.js                   Auth context and hook
  firestore.js                 Firestore read/write helpers
firestore.rules                Security rules
```

## Known limitations

- No reordering or deletion UI for topics and questions (the data model
  supports both; UI can be added as needed).
- No cross-topic search.
- Heatmap windows are fixed at build time (20 weeks for questions, 16 for
  patterns/notes) via the `weeks` prop on `Heatmap`.


## License

MIT
