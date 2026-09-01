"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { listenConcepts, addConcept, deleteConcept } from "@/lib/firestore";

export default function ConceptsPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [concepts, setConcepts] = useState([]);

  useEffect(() => {
    if (!uid) return;
    return listenConcepts(uid, setConcepts);
  }, [uid]);

  const learned = concepts.filter((c) => c.status === "learned");
  const todo = concepts.filter((c) => c.status === "todo");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="display text-xl font-semibold mb-4">Concepts</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <ConceptColumn uid={uid} title="Learned" status="learned" items={learned} accent="#5FBF77" />
        <ConceptColumn uid={uid} title="Yet to learn" status="todo" items={todo} accent="#E8A33D" />
      </div>
    </div>
  );
}

function ConceptColumn({ uid, title, status, items, accent }) {
  const [showAdd, setShowAdd] = useState(false);
  const [text, setText] = useState("");

  async function save() {
    if (!text.trim()) return;
    await addConcept(uid, text.trim(), status);
    setText("");
    setShowAdd(false);
  }

  return (
    <section className="bg-panel border border-line rounded-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="display font-semibold" style={{ color: accent }}>{title}</h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="w-7 h-7 rounded bg-panel2 border border-line hover:border-amber text-sm"
        >
          +
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Dijkstra's algorithm"
            className="flex-1 px-2 py-1.5 rounded bg-ink border border-line text-sm outline-none focus:border-amber"
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <button onClick={save} className="px-3 py-1.5 rounded bg-amber text-ink text-xs font-medium">
            Add
          </button>
        </div>
      )}

      <div className="space-y-1">
        {items.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}
        {items.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-panel2 text-sm group">
            <span className="text-text">{c.text}</span>
            <button
              onClick={() => deleteConcept(uid, c.id)}
              className="text-muted hover:text-rose opacity-0 group-hover:opacity-100 text-xs"
            >
              remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
