"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import {
  listenTopics,
  addTopic,
  listenQuestions,
  addQuestion,
} from "@/lib/firestore";

const DIFF_COLOR = { green: "#5FBF77", yellow: "#E8A33D", red: "#E1636B" };

export default function TopicsPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [topics, setTopics] = useState([]);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!uid) return;
    return listenTopics(uid, setTopics);
  }, [uid]);

  async function createTopic() {
    if (!topicName.trim()) return;
    await addTopic(uid, topicName.trim());
    setTopicName("");
    setShowAddTopic(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="display text-xl font-semibold">Topics</h1>
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
            expanded={!!expanded[t.id]}
            onToggle={() => setExpanded((e) => ({ ...e, [t.id]: !e[t.id] }))}
          />
        ))}
      </div>
    </div>
  );
}

function TopicRow({ uid, topic, expanded, onToggle }) {
  const [questions, setQuestions] = useState([]);
  const [showAddQ, setShowAddQ] = useState(false);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("yellow");

  useEffect(() => {
    if (!expanded) return;
    return listenQuestions(uid, topic.id, setQuestions);
  }, [uid, topic.id, expanded]);

  async function createQuestion() {
    if (!title.trim()) return;
    await addQuestion(uid, topic.id, { title: title.trim(), difficulty });
    setTitle("");
    setShowAddQ(false);
  }

  return (
    <div className="bg-panel border border-line rounded-card">
      <div className="flex items-center px-3 py-2.5">
        <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left">
          <span className={`text-muted transition-transform ${expanded ? "rotate-90" : ""}`}>▸</span>
          <span className="text-text">{topic.name}</span>
        </button>
        <button
          onClick={() => setShowAddQ((v) => !v)}
          className="w-6 h-6 rounded bg-panel2 border border-line hover:border-amber text-xs"
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
            <Link
              key={q.id}
              href={`/topics/${topic.id}/${q.id}`}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-panel2 text-sm"
            >
              <span className="diff-dot" style={{ background: DIFF_COLOR[q.difficulty] || DIFF_COLOR.yellow }} />
              <span className="text-text">{q.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
