"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";
import CheckCircle from "@/components/CheckCircle";
import {
  getQuestion,
  updateQuestionField,
  getGlobalQuestion,
  getGlobalProgress,
  updateGlobalProgressField,
  setQuestionComplete,
} from "@/lib/firestore";

const TABS = [
  { key: "approach", label: "Approach" },
  { key: "pattern", label: "Pattern" },
  { key: "note", label: "Note" },
  { key: "companies", label: "Companies" },
  { key: "mySolution", label: "My solution" },
  { key: "optimizedSolution", label: "Optimized solution" },
];

const DIFF_COLOR = { green: "#5FBF77", yellow: "#E8A33D", red: "#E1636B" };

// isGlobal: true for questions that came from the shared/imported sheet
// (base fields are read-only, shared by everyone; editable fields —
// pattern/note/approach/solutions/completed — live in the user's own
// global_progress doc so nobody overwrites anyone else's notes).
export default function QuestionDetail({ isGlobal, topicId, questionId }) {
  const { user } = useAuth();
  const uid = user?.uid;

  const [base, setBase] = useState(null); // read-only fields (title, difficulty, problemUrl, ...)
  const [progress, setProgress] = useState(null); // editable fields (pattern, note, ..., completed)
  const [activeTab, setActiveTab] = useState("approach");
  const [showTabPicker, setShowTabPicker] = useState(false);
  const [draft, setDraft] = useState({});
  const [descDraft, setDescDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);

  const containerRef = useRef(null);
  const [leftPct, setLeftPct] = useState(50);
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
    pct = Math.min(75, Math.max(25, pct));
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
    let cancelled = false;

    async function load() {
      if (isGlobal) {
        const [q, prog] = await Promise.all([
          getGlobalQuestion(topicId, questionId),
          getGlobalProgress(uid, questionId),
        ]);
        if (cancelled) return;
        const mergedProgress = {
          pattern: "",
          note: "",
          approach: "",
          companies: q?.companies || "",
          mySolution: "",
          optimizedSolution: "",
          completed: false,
          ...(prog || {}),
        };
        setBase(q);
        setProgress(mergedProgress);
        setDraft(mergedProgress);
        setDescDraft(mergedProgress.description || "");
      } else {
        const q = await getQuestion(uid, topicId, questionId);
        if (cancelled) return;
        setBase(q);
        setProgress(q);
        setDraft(q || {});
        setDescDraft(q?.description || "");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [uid, isGlobal, topicId, questionId]);

  async function saveField(field) {
    if (!progress) return;
    const wasEmpty = !(progress[field] || "").trim();
    const value = draft[field] || "";
    if (value === progress[field]) return;
    if (isGlobal) {
      await updateGlobalProgressField(uid, questionId, field, value, wasEmpty, topicId);
    } else {
      await updateQuestionField(uid, topicId, questionId, field, value, wasEmpty);
    }
    setProgress((p) => ({ ...p, [field]: value }));
  }

  async function saveDescription() {
    if (!progress || descDraft === (progress.description || "")) return;
    if (isGlobal) {
      await updateGlobalProgressField(uid, questionId, "description", descDraft, false, topicId);
    } else {
      await updateQuestionField(uid, topicId, questionId, "description", descDraft, false);
    }
    setProgress((p) => ({ ...p, description: descDraft }));
  }

  async function toggleComplete() {
    const next = !progress.completed;
    setProgress((p) => ({ ...p, completed: next }));
    await setQuestionComplete(uid, { isGlobal, topicId, questionId }, next);
  }

  if (!base || !progress) {
    return <div className="px-4 py-6 text-muted">Loading question…</div>;
  }

  const title = base.title;
  const difficulty = base.difficulty;

  return (
    <div ref={containerRef} className="flex w-full h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* left: heading + description/problem link */}
      <section
        style={{ width: `${leftPct}%` }}
        className="h-full overflow-y-auto border-r border-line p-6 flex-shrink-0"
      >
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle checked={!!progress.completed} onToggle={toggleComplete} size={24} />
          <span className="diff-dot" style={{ background: DIFF_COLOR[difficulty] || DIFF_COLOR.yellow }} />
          <h1 className="display text-xl font-semibold">{title}</h1>
        </div>

        {isGlobal && (
          <div className="flex flex-wrap items-center gap-2 mb-4 mt-2">
            {base.problemUrl && (
              <a
                href={base.problemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber text-ink text-xs font-medium hover:opacity-90"
              >
                Solve on {base.platform || "original site"} ↗
              </a>
            )}
            {base.resource && (
              <a
                href={base.resource}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-panel2 border border-line text-xs hover:border-amber"
              >
                Watch video ↗
              </a>
            )}
            {base.subTopic && (
              <span className="px-2 py-1 rounded bg-panel2 border border-line text-[11px] text-muted">
                {base.subTopic}
              </span>
            )}
          </div>
        )}

        {progress.description || editingDesc ? (
          <textarea
            autoFocus={editingDesc && !progress.description}
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            onBlur={() => {
              saveDescription();
              setEditingDesc(false);
            }}
            placeholder="Problem description / your own notes…"
            className="w-full min-h-[60vh] mt-3 bg-ink border border-line rounded p-3 text-sm outline-none focus:border-amber resize-y"
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

        {activeTab === "companies" && isGlobal && base.companies && !progress.companiesTouched && (
          <p className="text-[11px] text-muted mb-2">
            Pre-filled from the sheet — edit freely, it's saved just for you.
          </p>
        )}

        <textarea
          key={activeTab}
          value={draft[activeTab] || ""}
          onChange={(e) =>
            setDraft((d) => ({ ...d, [activeTab]: e.target.value, companiesTouched: true }))
          }
          onBlur={() => saveField(activeTab)}
          placeholder={`Write your ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}…`}
          className="w-full min-h-[60vh] bg-ink border border-line rounded p-3 text-sm font-mono outline-none focus:border-amber resize-y"
        />
      </section>
    </div>
  );
}
