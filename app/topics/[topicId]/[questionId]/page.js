"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const [editingDesc, setEditingDesc] = useState(false);

  // --- resizable split state ---
  const containerRef = useRef(null);
  const [leftPct, setLeftPct] = useState(50); // % width of the left (description) pane
  const draggingRef = useRef(false);

  const onDragStart = useCallback(() => {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const onDragMove = useCallback((e) => {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.min(75, Math.max(25, pct)); // clamp between 25% and 75%
    setLeftPct(pct);
  }, []);

  const onDragEnd = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchmove", onDragMove);
    window.addEventListener("touchend", onDragEnd);
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragEnd);
      window.removeEventListener("touchmove", onDragMove);
      window.removeEventListener("touchend", onDragEnd);
    };
  }, [onDragMove, onDragEnd]);

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
    <div
      ref={containerRef}
      className="flex w-full h-[calc(100vh-3.5rem)] overflow-hidden"
    >
      {/* left: heading + description */}
      <section
        style={{ width: `${leftPct}%` }}
        className="h-full overflow-y-auto border-r border-line p-6 flex-shrink-0"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="diff-dot" style={{ background: DIFF_COLOR[question.difficulty] || DIFF_COLOR.yellow }} />
          <h1 className="display text-xl font-semibold">{question.title}</h1>
        </div>

        {question.description || editingDesc ? (
          <textarea
            autoFocus={editingDesc && !question.description}
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            onBlur={() => {
              saveDescription();
              setEditingDesc(false);
            }}
            placeholder="Problem description…"
            className="w-full min-h-[70vh] mt-3 bg-ink border border-line rounded p-3 text-sm outline-none focus:border-amber resize-y"
          />
        ) : (
          <button
            onClick={() => setEditingDesc(true)}
            className="mt-3 w-8 h-8 rounded bg-panel2 border border-line hover:border-amber text-sm"
          >
            +
          </button>
        )}
      </section>

      {/* draggable divider */}
      <div
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        className="w-1.5 h-full cursor-col-resize bg-line hover:bg-amber transition-colors flex-shrink-0"
      />

      {/* right: tabbed panel */}
      <section
        style={{ width: `${100 - leftPct}%` }}
        className="h-full overflow-y-auto p-6 relative flex-shrink-0"
      >
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
          <div className="absolute top-14 right-6 bg-panel2 border border-line rounded-card p-1 z-20 w-48">
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
          className="w-full min-h-[70vh] bg-ink border border-line rounded p-3 text-sm font-mono outline-none focus:border-amber resize-y"
        />
      </section>
    </div>
  );
}
