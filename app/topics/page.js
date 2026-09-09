"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import ProgressBar from "@/components/ProgressBar";
import CheckCircle from "@/components/CheckCircle";
import {
  listenTopics,
  addTopic,
  listenQuestions,
  addQuestion,
  listenGlobalTopics,
  listenGlobalQuestions,
  listenGlobalProgressAll,
  setQuestionComplete,
} from "@/lib/firestore";

const DIFF_COLOR = { green: "#5FBF77", yellow: "#E8A33D", red: "#E1636B" };

export default function TopicsPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [topics, setTopics] = useState([]);
  const [globalTopics, setGlobalTopics] = useState([]);
  const [globalProgress, setGlobalProgress] = useState({}); // { questionId: { completed, topicId, ... } }
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!uid) return;
    const un1 = listenTopics(uid, setTopics);
    const un2 = listenGlobalTopics(setGlobalTopics);
    const un3 = listenGlobalProgressAll(uid, setGlobalProgress);
    return () => {
      un1 && un1();
      un2 && un2();
      un3 && un3();
    };
  }, [uid]);

  async function createTopic() {
    if (!topicName.trim()) return;
    await addTopic(uid, topicName.trim());
    setTopicName("");
    setShowAddTopic(false);
  }

  // completed-count per global topic, derived from the single global_progress listener —
  // no need to fetch every topic's full question list just to show a progress bar.
  const globalCompletedByTopic = useMemo(() => {
    const out = {};
    Object.values(globalProgress).forEach((p) => {
      if (p.completed && p.topicId) out[p.topicId] = (out[p.topicId] || 0) + 1;
    });
    return out;
  }, [globalProgress]);

  const overallGlobalTotal = globalTopics.reduce((s, t) => s + (t.questionCount || 0), 0);
  const overallGlobalCompleted = Object.values(globalCompletedByTopic).reduce((s, n) => s + n, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-10">
      {/* ---------------- shared sheet ---------------- */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="display text-xl font-semibold">Shared Sheet</h1>
            <p className="text-xs text-muted">
              Same topics &amp; questions for every signed-in user — your progress and notes are private to you.
            </p>
          </div>
        </div>
        {overallGlobalTotal > 0 && (
          <div className="mb-4">
            <ProgressBar completed={overallGlobalCompleted} total={overallGlobalTotal} accent="#4FD1C5" />
          </div>
        )}

        <div className="space-y-2">
          {globalTopics.length === 0 && (
            <p className="text-muted text-sm">
              No shared topics yet — ask the site owner to run the seed script.
            </p>
          )}
          {globalTopics.map((t) => (
            <GlobalTopicRow
              key={t.id}
              uid={uid}
              topic={t}
              completed={globalCompletedByTopic[t.id] || 0}
              globalProgress={globalProgress}
              expanded={!!expanded[`g:${t.id}`]}
              onToggle={() => setExpanded((e) => ({ ...e, [`g:${t.id}`]: !e[`g:${t.id}`] }))}
            />
          ))}
        </div>
      </section>

      {/* ---------------- user's own topics ---------------- */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h1 className="display text-xl font-semibold">My Topics</h1>
          <button
            onClick={() => setShowAddTopic((v) => !v)}
            className="w-8 h-8 rounded bg-panel2 border border-line hover:border-amber"
          >
            +
          </button>
        </div>

        {showAddTopic && (
          <div className="flex gap-2 mb-4">
            <input
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="New topic (e.g. Arrays, Graphs)"
              className="flex-1 px-3 py-2 rounded bg-panel border border-line text-sm outline-none focus:border-amber"
            />
            <button onClick={createTopic} className="px-4 py-2 rounded bg-amber text-ink text-sm font-medium">
              Add
            </button>
          </div>
        )}

        <div className="space-y-2">
          {topics.length === 0 && <p className="text-muted text-sm">No topics yet — add your first one.</p>}
          {topics.map((t) => (
            <TopicRow
              key={t.id}
              uid={uid}
              topic={t}
              expanded={!!expanded[`u:${t.id}`]}
              onToggle={() => setExpanded((e) => ({ ...e, [`u:${t.id}`]: !e[`u:${t.id}`] }))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ================= user's own topics (manual) =================
function TopicRow({ uid, topic, expanded, onToggle }) {
  const [questions, setQuestions] = useState([]);
  const [showAddQ, setShowAddQ] = useState(false);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("yellow");

  useEffect(() => {
    if (!uid) return;
    return listenQuestions(uid, topic.id, setQuestions);
  }, [uid, topic.id]);

  const completedCount = questions.filter((q) => q.completed).length;

  async function createQuestion() {
    if (!title.trim()) return;
    await addQuestion(uid, topic.id, { title: title.trim(), difficulty });
    setTitle("");
    setShowAddQ(false);
  }

  return (
    <div className="bg-panel border border-line rounded-card">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <span className={`text-muted transition-transform ${expanded ? "rotate-90" : ""}`}>▸</span>
          <span className="text-text truncate">{topic.name}</span>
        </button>
        {questions.length > 0 && (
          <ProgressBar completed={completedCount} total={questions.length} compact accent="#4FD1C5" />
        )}
        <button
          onClick={() => setShowAddQ((v) => !v)}
          className="w-6 h-6 rounded bg-panel2 border border-line hover:border-amber text-xs flex-shrink-0"
        >
          +
        </button>
      </div>

      {expanded && (
        <div className="border-t border-line px-3 py-2 space-y-1">
          {showAddQ && (
            <div className="flex gap-2 mb-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Question title"
                className="flex-1 px-2 py-1.5 rounded bg-ink border border-line text-sm outline-none focus:border-amber"
              />
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="px-2 py-1.5 rounded bg-ink border border-line text-xs outline-none"
              >
                <option value="green">Easy</option>
                <option value="yellow">Medium</option>
                <option value="red">Hard</option>
              </select>
              <button onClick={createQuestion} className="px-3 py-1.5 rounded bg-amber text-ink text-xs font-medium">
                Add
              </button>
            </div>
          )}
          {questions.length === 0 && <p className="text-xs text-muted py-1">No questions yet.</p>}
          {questions.map((q) => (
            <div key={q.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-panel2 text-sm">
              <CheckCircle
                checked={!!q.completed}
                onToggle={(next) =>
                  setQuestionComplete(uid, { isGlobal: false, topicId: topic.id, questionId: q.id }, next)
                }
                size={18}
              />
              <span className="diff-dot" style={{ background: DIFF_COLOR[q.difficulty] || DIFF_COLOR.yellow }} />
              <Link href={`/topics/${topic.id}/${q.id}`} className="text-text flex-1 truncate">
                {q.title}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================= shared/global sheet topics =================
function GlobalTopicRow({ uid, topic, completed, globalProgress, expanded, onToggle }) {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (!expanded) return;
    return listenGlobalQuestions(topic.id, setQuestions);
  }, [topic.id, expanded]);

  // group contiguous questions by subTopic, preserving sheet order
  const groups = useMemo(() => {
    const out = [];
    let current = null;
    for (const q of questions) {
      const label = q.subTopic || "";
      if (!current || current.label !== label) {
        current = { label, items: [] };
        out.push(current);
      }
      current.items.push(q);
    }
    return out;
  }, [questions]);

  return (
    <div className="bg-panel border border-line rounded-card">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <span className={`text-muted transition-transform ${expanded ? "rotate-90" : ""}`}>▸</span>
          <span className="text-text truncate">{topic.name}</span>
        </button>
        {topic.questionCount > 0 && (
          <ProgressBar completed={completed} total={topic.questionCount} compact accent="#4FD1C5" />
        )}
      </div>

      {expanded && (
        <div className="border-t border-line px-3 py-2 space-y-1">
          {questions.length === 0 && <p className="text-xs text-muted py-1">Loading…</p>}
          {groups.map((g, gi) => (
            <div key={gi} className="pt-2 first:pt-0">
              {g.label && (
                <p className="text-[11px] uppercase tracking-wide text-muted px-2 pb-1">{g.label}</p>
              )}
              {g.items.map((q) => (
                <GlobalQuestionRow
                  key={q.id}
                  uid={uid}
                  topic={topic}
                  question={q}
                  completed={!!globalProgress[q.id]?.completed}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GlobalQuestionRow({ uid, topic, question, completed }) {
  // `completed` comes straight from the page-level global_progress listener,
  // so toggling it just writes to Firestore — the listener echoes the new
  // state back down automatically, no local state needed.
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-panel2 text-sm">
      <CheckCircle
        checked={completed}
        onToggle={(next) =>
          setQuestionComplete(
            uid,
            { isGlobal: true, topicId: topic.id, questionId: question.id },
            next
          )
        }
        size={18}
      />
      <span
        className="diff-dot"
        style={{ background: DIFF_COLOR[question.difficulty] || DIFF_COLOR.yellow }}
      />
      <Link href={`/topics/g/${topic.id}/${question.id}`} className="text-text flex-1 truncate">
        {question.title}
      </Link>
      {question.problemUrl && (
        <a
          href={question.problemUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={`Open on ${question.platform || "original site"}`}
          className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded text-muted hover:text-amber hover:bg-panel"
        >
          ↗
        </a>
      )}
    </div>
  );
}
