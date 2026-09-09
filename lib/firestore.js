import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  increment,
  collectionGroup,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

// ---------- helpers ----------
export function todayId(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function userDoc(uid) {
  return doc(db, "users", uid);
}
function col(uid, name) {
  return collection(db, "users", uid, name);
}

// bump a heatmap bucket (questions | pattern | note) for today by +1
export async function bumpHeatmap(uid, kind, dateId = todayId()) {
  const ref = doc(db, "users", uid, `heatmap_${kind}`, dateId);
  await setDoc(ref, { count: increment(1), date: dateId }, { merge: true });
}

export function listenHeatmap(uid, kind, cb) {
  return onSnapshot(col(uid, `heatmap_${kind}`), (snap) => {
    const out = {};
    snap.forEach((d) => (out[d.id] = d.data().count || 0));
    cb(out);
  });
}

// ---------- topics & questions ----------
export function listenTopics(uid, cb) {
  const q = query(col(uid, "topics"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

export async function addTopic(uid, name) {
  return addDoc(col(uid, "topics"), { name, createdAt: serverTimestamp() });
}

export async function deleteTopic(uid, topicId) {
  return deleteDoc(doc(db, "users", uid, "topics", topicId));
}

export function listenQuestions(uid, topicId, cb) {
  const q = query(
    collection(db, "users", uid, "topics", topicId, "questions"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

export async function addQuestion(uid, topicId, data) {
  const ref = await addDoc(
    collection(db, "users", uid, "topics", topicId, "questions"),
    {
      title: data.title || "Untitled question",
      difficulty: data.difficulty || "yellow", // green | yellow | red
      description: data.description || "",
      pattern: "",
      note: "",
      approach: "",
      companies: "",
      mySolution: "",
      optimizedSolution: "",
      completed: false,
      ownerId: uid,
      createdAt: serverTimestamp(),
    }
  );
  await bumpHeatmap(uid, "questions");
  return ref;
}

export async function updateQuestionField(uid, topicId, questionId, field, value, wasEmpty) {
  const ref = doc(db, "users", uid, "topics", topicId, "questions", questionId);
  await updateDoc(ref, { [field]: value });
  // pattern/note heatmaps tick up only the first time text is written (empty -> non-empty)
  if (wasEmpty && value.trim()) {
    if (field === "pattern") await bumpHeatmap(uid, "pattern");
    if (field === "note") await bumpHeatmap(uid, "note");
  }
}

export async function getQuestion(uid, topicId, questionId) {
  const ref = doc(db, "users", uid, "topics", topicId, "questions", questionId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ---------- today's goal (rolling 7-week window) ----------
export function listenTodayGoal(uid, dateId, cb) {
  const ref = doc(db, "users", uid, "daily_goals", dateId);
  return onSnapshot(ref, (snap) => cb(snap.exists() ? snap.data() : null));
}

export async function setTodayGoal(uid, dateId, data) {
  const ref = doc(db, "users", uid, "daily_goals", dateId);
  await setDoc(ref, { ...data, date: dateId }, { merge: true });
}

export async function completeTodayGoal(uid, dateId, completed, reason = "") {
  const ref = doc(db, "users", uid, "daily_goals", dateId);
  await updateDoc(ref, { completed, reason });
}

// delete daily goal docs older than 7 weeks (49 days) — call opportunistically
export async function pruneOldDailyGoals(uid) {
  const snap = await getDocs(col(uid, "daily_goals"));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 49);
  const deletions = [];
  snap.forEach((d) => {
    if (new Date(d.id) < cutoff) {
      deletions.push(deleteDoc(doc(db, "users", uid, "daily_goals", d.id)));
    }
  });
  return Promise.all(deletions);
}

// ---------- long-term goals (never auto-deleted) ----------
export function listenGoals(uid, cb) {
  const q = query(col(uid, "goals"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

export async function addGoal(uid, text, dueDate) {
  return addDoc(col(uid, "goals"), {
    text,
    dueDate,
    completed: false,
    createdAt: serverTimestamp(),
  });
}

export async function toggleGoal(uid, goalId, completed) {
  return updateDoc(doc(db, "users", uid, "goals", goalId), { completed });
}

// ---------- concepts ----------
export function listenConcepts(uid, cb) {
  const q = query(col(uid, "concepts"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

export async function addConcept(uid, text, status) {
  // status: "learned" | "todo"
  return addDoc(col(uid, "concepts"), {
    text,
    status,
    createdAt: serverTimestamp(),
  });
}

export async function deleteConcept(uid, conceptId) {
  return deleteDoc(doc(db, "users", uid, "concepts", conceptId));
}

// ---------- streak ----------
export async function touchStreak(uid) {
  const ref = doc(db, "users", uid, "meta", "streak");
  const snap = await getDoc(ref);
  const today = todayId();
  const yesterday = todayId(new Date(Date.now() - 86400000));

  if (!snap.exists()) {
    await setDoc(ref, { current: 1, lastActiveDate: today });
    return 1;
  }
  const data = snap.data();
  if (data.lastActiveDate === today) return data.current;
  const next = data.lastActiveDate === yesterday ? data.current + 1 : 1;
  await setDoc(ref, { current: next, lastActiveDate: today });
  return next;
}

export function listenStreak(uid, cb) {
  const ref = doc(db, "users", uid, "meta", "streak");
  return onSnapshot(ref, (snap) =>
    cb(snap.exists() ? snap.data() : { current: 0, lastActiveDate: null })
  );
}

// ================= GLOBAL SHEET (shared, read-only, same for every user) =================
// Data lives in global_topics/{topicId} and global_topics/{topicId}/questions/{questionId}.
// It is seeded once via scripts/seed-global-topics.mjs (admin SDK) and is read-only for
// normal users (see firestore.rules). Per-user edits (pattern/note/approach/solutions/
// completed) are stored separately in users/{uid}/global_progress/{questionId} so one
// user's notes never overwrite another user's notes on the same shared question.

export function listenGlobalTopics(cb) {
  const q = query(collection(db, "global_topics"), orderBy("order", "asc"));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

export function listenGlobalQuestions(topicId, cb) {
  const q = query(
    collection(db, "global_topics", topicId, "questions"),
    orderBy("order", "asc")
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

export async function getGlobalQuestion(topicId, questionId) {
  const ref = doc(db, "global_topics", topicId, "questions", questionId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// per-user overlay for a single global question
export async function getGlobalProgress(uid, questionId) {
  const ref = doc(db, "users", uid, "global_progress", questionId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export function listenGlobalProgressAll(uid, cb) {
  // one listener for every global question this user has ever touched
  // (completed a question, or wrote pattern/note/etc on it)
  return onSnapshot(col(uid, "global_progress"), (snap) => {
    const out = {};
    snap.forEach((d) => (out[d.id] = d.data()));
    cb(out);
  });
}

export async function updateGlobalProgressField(uid, questionId, field, value, wasEmpty, topicId) {
  const ref = doc(db, "users", uid, "global_progress", questionId);
  const payload = { [field]: value, updatedAt: serverTimestamp() };
  if (topicId) payload.topicId = topicId;
  await setDoc(ref, payload, { merge: true });
  if (wasEmpty && value.trim()) {
    if (field === "pattern") await bumpHeatmap(uid, "pattern");
    if (field === "note") await bumpHeatmap(uid, "note");
  }
}

// ---------- completion (works for both a user's own questions and global questions) ----------
export async function setQuestionComplete(uid, { isGlobal, topicId, questionId }, completed) {
  if (isGlobal) {
    const ref = doc(db, "users", uid, "global_progress", questionId);
    await setDoc(
      ref,
      { completed, topicId, completedAt: completed ? serverTimestamp() : null },
      { merge: true }
    );
  } else {
    const ref = doc(db, "users", uid, "topics", topicId, "questions", questionId);
    await updateDoc(ref, { completed });
  }
  if (completed) await bumpHeatmap(uid, "questions_solved");
}

// total/completed counts across every question the user has personally
// added (their own manual topics) — one listener, used for the overall
// progress bar on the dashboard.
export function listenMyQuestionsStats(uid, cb) {
  const q = query(collectionGroup(db, "questions"), where("ownerId", "==", uid));
  return onSnapshot(q, (snap) => {
    let total = 0;
    let completed = 0;
    snap.forEach((d) => {
      total++;
      if (d.data().completed) completed++;
    });
    cb({ total, completed });
  });
}

// ================= END GLOBAL SHEET =================

// ---------- pattern count across all questions (for topbar badge) ----------
export function listenAllPatterns(uid, cb) {
  // collectionGroup query on "questions", scoped to this user's own docs via
  // the ownerId field (global_topics/*/questions docs have no ownerId, so
  // this filter also keeps them out of the badge count/list).
  const q = query(collectionGroup(db, "questions"), where("ownerId", "==", uid));
  return onSnapshot(q, (snap) => {
    const patterns = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.pattern && data.pattern.trim()) {
        patterns.push({ id: d.id, title: data.title, pattern: data.pattern });
      }
    });
    cb(patterns);
  });
}
