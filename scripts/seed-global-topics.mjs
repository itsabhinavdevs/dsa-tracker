/**
 * One-time (or "run again whenever the sheet changes") script that pushes the
 * shared DSA sheet (data/global-sheet.json) into Firestore under:
 *
 *   global_topics/{topicId}                       { name, order, subTopics }
 *   global_topics/{topicId}/questions/{questionId} { title, subTopic, difficulty,
 *                                                     problemUrl, resource, platform,
 *                                                     companies, order }
 *
 * It uses the Firebase Admin SDK, which authenticates with a service account
 * and completely bypasses firestore.rules — this is intentional: normal
 * signed-in users can only READ global_topics (see firestore.rules), so the
 * only way to write/update the shared sheet is by running this script
 * yourself with your own service account key.
 *
 * ---- one-time setup ----
 * 1. Firebase console → Project settings (gear icon) → Service accounts tab
 *    → "Generate new private key" → save the downloaded JSON as
 *    `serviceAccountKey.json` in the project root (it's already git-ignored).
 * 2. npm install firebase-admin --save-dev   (adds it as a dev dependency)
 *
 * ---- run it ----
 *   node scripts/seed-global-topics.mjs
 *
 * Safe to re-run: it upserts (merge: true) every doc, and deletes any
 * question doc that no longer exists in data/global-sheet.json (in case you
 * edit/trim the source data later).
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadCredential() {
  try {
    const keyPath = join(root, "serviceAccountKey.json");
    const key = JSON.parse(readFileSync(keyPath, "utf8"));
    return cert(key);
  } catch {
    console.log(
      "No serviceAccountKey.json found in project root — falling back to " +
        "applicationDefault() (works if you've run `gcloud auth application-default login`)."
    );
    return applicationDefault();
  }
}

initializeApp({ credential: loadCredential() });
const db = getFirestore();

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function main() {
  const sheetPath = join(root, "data", "global-sheet.json");
  const topics = JSON.parse(readFileSync(sheetPath, "utf8"));

  console.log(`Seeding ${topics.length} topics…`);

  for (let tIndex = 0; tIndex < topics.length; tIndex++) {
    const topic = topics[tIndex];
    const topicId = slugify(topic.name) || `topic-${tIndex}`;
    const subTopics = [...new Set(topic.questions.map((q) => q.subTopic).filter(Boolean))];

    await db.doc(`global_topics/${topicId}`).set(
      {
        name: topic.name,
        order: tIndex,
        subTopics,
        questionCount: topic.questions.length,
        source: "asif-dsa-sheet",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const questionsCol = db.collection(`global_topics/${topicId}/questions`);
    const existing = await questionsCol.listDocuments();
    const keepIds = new Set();

    const batchSize = 400; // Firestore batch limit is 500 writes
    for (let i = 0; i < topic.questions.length; i += batchSize) {
      const batch = db.batch();
      const chunk = topic.questions.slice(i, i + batchSize);
      chunk.forEach((q, j) => {
        const order = i + j;
        const questionId = `${slugify(q.title)}-${order}`;
        keepIds.add(questionId);
        batch.set(
          questionsCol.doc(questionId),
          {
            title: q.title,
            subTopic: q.subTopic || "",
            difficulty: q.difficulty || "yellow", // green | yellow | red
            platform: q.platform || "",
            problemUrl: q.problemUrl || "",
            resource: q.resource || "",
            companies: (q.companies || []).join(", "),
            order,
          },
          { merge: true }
        );
      });
      await batch.commit();
    }

    // clean up questions that no longer exist in the source file for this topic
    const toDelete = existing.filter((d) => !keepIds.has(d.id));
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = db.batch();
      toDelete.slice(i, i + batchSize).forEach((d) => batch.delete(d));
      await batch.commit();
    }

    console.log(
      `  ✓ ${topic.name} (${topicId}) — ${topic.questions.length} questions` +
        (toDelete.length ? `, removed ${toDelete.length} stale` : "")
    );
  }

  console.log("Done. Every signed-in user will now see these topics under /topics.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
