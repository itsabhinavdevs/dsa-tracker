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

// ---------- pattern count across all questions (for topbar badge) ----------
export function listenAllPatterns(uid, cb) {
  // collectionGroup query on "questions", scoped by ownerId via security rules;
  // filtered client-side to only those with a non-empty pattern.
  const q = collectionGroup(db, "questions");
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
