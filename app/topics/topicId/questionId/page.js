"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { getQuestion, updateQuestionField } from "@/lib/firestore";

const TABS = [
  { key: "approach", label: "Approach" },
  { key: "pattern", label: "Pattern" },
  { key: "note", label: "Note" },
  { key: "companies", label: "Companies" },
  { key: "mySolution", label: "My solution" },
  { key: "optimizedSolution", label: "Optimized solution" },
];

const DIFF_COLOR = { green: "#5FBF77", yellow: "#E8A33D", red: "#E1636B" };

export default function QuestionPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const { topicId, questionId } = useParams();

  const [question, setQuestion] = useState(null);
  const [activeTab, setActiveTab] = useState("approach");
  const [showTabPicker, setShowTabPicker] = useState(false);
  const [draft, setDraft] = useState({});
  const [descDraft, setDescDraft] = useState("");

  useEffect(() => {
    if (!uid) return;
    getQuestion(uid, topicId, questionId).then((q) => {
      setQuestion(q);
      setDraft(q || {});
      setDescDraft(q?.description || "");
    });
  }, [uid, topicId, questionId]);

  async function saveField(field) {
    if (!question) return;
    const wasEmpty = !(question[field] || "").trim();
    const value = draft[field] || "";
    if (value === question[field]) return;
    await updateQuestionField(uid, topicId, questionId, field, value, wasEmpty);
    setQuestion((q) => ({ ...q, [field]: value }));
  }

  async function saveDescription() {
    if (!question || descDraft === question.description) return;
    await updateQuestionField(uid, topicId, questionId, "description", descDraft, false);
    setQuestion((q) => ({ ...q, description: descDraft }));
  }

  if (!question) {
    return <div className="px-4 py-6 text-muted">Loading question…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-2 gap-6">
      {/* left: heading + description, stays put unless the question itself changes */}
      <section className="bg-panel border border-line rounded-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="diff-dot" style={{ background: DIFF_COLOR[question.difficulty] || DIFF_COLOR.yellow }} />
          <h1 className="display text-xl font-semibold">{question.title}</h1>
        </div>
        <textarea
          value={descDraft}
          onChange={(e) => setDescDraft(e.target.value)}
          onBlur={saveDescription}
          placeholder="Problem description…"
          className="w-full min-h-[280px] mt-3 bg-ink border border-line rounded p-3 text-sm outline-none focus:border-amber resize-y"
        />
      </section>

      {/* right: tabbed panel */}
      <section className="bg-panel border border-line rounded-card p-5 relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="display font-semibold">{TABS.find((t) => t.key === activeTab)?.label}</h2>
          <button
            onClick={() => setShowTabPicker((v) => !v)}
            aria-label="Switch section"
            className="w-8 h-8 flex flex-col items-center justify-center gap-[3px] rounded hover:bg-panel2"
          >
            <span className="w-4 h-[2px] bg-text" />
            <span className="w-4 h-[2px] bg-text" />
            <span className="w-4 h-[2px] bg-text" />
          </button>
        </div>

        {showTabPicker && (
          <div className="absolute top-14 right-5 bg-panel2 border border-line rounded-card p-1 z-20 w-48">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setActiveTab(t.key);
                  setShowTabPicker(false);
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  activeTab === t.key ? "bg-ink text-amber" : "text-text hover:bg-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <textarea
          key={activeTab}
          value={draft[activeTab] || ""}
          onChange={(e) => setDraft((d) => ({ ...d, [activeTab]: e.target.value }))}
          onBlur={() => saveField(activeTab)}
          placeholder={`Write your ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}…`}
          className="w-full min-h-[300px] bg-ink border border-line rounded p-3 text-sm font-mono outline-none focus:border-amber resize-y"
        />
      </section>
    </div>
  );
}
