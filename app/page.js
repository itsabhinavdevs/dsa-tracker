"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import Heatmap from "@/components/Heatmap";
import {
  todayId,
  listenTodayGoal,
  setTodayGoal,
  completeTodayGoal,
  pruneOldDailyGoals,
  listenGoals,
  addGoal,
  toggleGoal,
  listenHeatmap,
} from "@/lib/firestore";

export default function Dashboard() {
  const { user } = useAuth();
  const uid = user?.uid;
  const today = todayId();

  const [todayGoal, setTodayGoalState] = useState(null);
  const [showAddToday, setShowAddToday] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [difficultyInput, setDifficultyInput] = useState("yellow");
  const [reasonInput, setReasonInput] = useState("");

  const [goals, setGoals] = useState([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [goalDue, setGoalDue] = useState("");

  const [qHeat, setQHeat] = useState({});
  const [pHeat, setPHeat] = useState({});
  const [nHeat, setNHeat] = useState({});

  useEffect(() => {
    if (!uid) return;
    pruneOldDailyGoals(uid);
    const un1 = listenTodayGoal(uid, today, setTodayGoalState);
    const un2 = listenGoals(uid, setGoals);
    const un3 = listenHeatmap(uid, "questions", setQHeat);
    const un4 = listenHeatmap(uid, "pattern", setPHeat);
    const un5 = listenHeatmap(uid, "note", setNHeat);
    return () => {
      un1(); un2(); un3(); un4(); un5();
    };
  }, [uid, today]);

  async function saveTodayGoal() {
    if (!topicInput.trim() || !questionInput.trim()) return;
    await setTodayGoal(uid, today, {
      topic: topicInput,
      question: questionInput,
      difficulty: difficultyInput,
      completed: false,
      reason: "",
    });
    setShowAddToday(false);
    setTopicInput("");
    setQuestionInput("");
  }

  async function markDone(done) {
    if (!todayGoal) return;
    await completeTodayGoal(uid, today, done, done ? "" : reasonInput);
  }

  async function saveGoal() {
    if (!goalText.trim()) return;
    await addGoal(uid, goalText, goalDue);
    setGoalText("");
    setGoalDue("");
    setShowAddGoal(false);
  }

  const diffColor = { green: "#5FBF77", yellow: "#E8A33D", red: "#E1636B" };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* today's goal + long term goal */}
      <div className="grid md:grid-cols-2 gap-4">
        <section id="today-goal" className="bg-panel border border-line rounded-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="display font-semibold">Today's goal</h2>
              <p className="text-xs text-muted mono">{today}</p>
            </div>
            <button
              onClick={() => setShowAddToday((v) => !v)}
              className="w-7 h-7 rounded bg-panel2 border border-line hover:border-amber text-sm"
            >
              +
            </button>
          </div>

          {showAddToday && (
            <div className="space-y-2 mb-3 bg-panel2 border border-line rounded p-3">
              <input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Topic"
                className="w-full px-2 py-1.5 rounded bg-ink border border-line text-sm outline-none focus:border-amber"
              />
              <input
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="Question heading"
                className="w-full px-2 py-1.5 rounded bg-ink border border-line text-sm outline-none focus:border-amber"
              />
              <select
                value={difficultyInput}
                onChange={(e) => setDifficultyInput(e.target.value)}
                className="w-full px-2 py-1.5 rounded bg-ink border border-line text-sm outline-none"
              >
                <option value="green">Easy</option>
                <option value="yellow">Medium</option>
                <option value="red">Hard</option>
              </select>
              <button
                onClick={saveTodayGoal}
                className="w-full py-1.5 rounded bg-amber text-ink text-sm font-medium"
              >
                Set goal
              </button>
            </div>
          )}

          {todayGoal ? (
            <div>
              <p className="text-xs text-muted">{todayGoal.topic}</p>
              <div className="flex items-center gap-2">
                <span
                  className="diff-dot"
                  style={{ background: diffColor[todayGoal.difficulty] }}
                />
                <p className="text-text">{todayGoal.question}</p>
              </div>
              {!todayGoal.completed ? (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => markDone(true)}
                      className="px-3 py-1 rounded bg-leaf/20 text-leaf text-xs border border-leaf/40"
                    >
                      Mark done
                    </button>
                  </div>
                  <input
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    onBlur={() => reasonInput && markDone(false)}
                    placeholder="Not done yet? Add a reason"
                    className="w-full px-2 py-1.5 rounded bg-ink border border-line text-xs outline-none focus:border-rose"
                  />
                </div>
              ) : (
                <p className="text-xs text-leaf mt-2">Completed ✓</p>
              )}
              {todayGoal.reason && !todayGoal.completed && (
                <p className="text-xs text-rose mt-1">Reason: {todayGoal.reason}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">No goal set for today yet.</p>
          )}
        </section>

        <section id="goals" className="bg-panel border border-line rounded-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="display font-semibold">Goals</h2>
            <button
              onClick={() => setShowAddGoal((v) => !v)}
              className="w-7 h-7 rounded bg-panel2 border border-line hover:border-amber text-sm"
            >
              +
            </button>
          </div>

          {showAddGoal && (
            <div className="space-y-2 mb-3 bg-panel2 border border-line rounded p-3">
              <input
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="Goal"
                className="w-full px-2 py-1.5 rounded bg-ink border border-line text-sm outline-none focus:border-amber"
              />
              <input
                type="date"
                value={goalDue}
                onChange={(e) => setGoalDue(e.target.value)}
                className="w-full px-2 py-1.5 rounded bg-ink border border-line text-sm outline-none"
              />
              <button
                onClick={saveGoal}
                className="w-full py-1.5 rounded bg-amber text-ink text-sm font-medium"
              >
                Add goal
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {goals.length === 0 && <p className="text-sm text-muted">No goals yet.</p>}
            {goals.map((g) => (
              <label key={g.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={g.completed}
                  onChange={(e) => toggleGoal(uid, g.id, e.target.checked)}
                />
                <span className={g.completed ? "line-through text-muted" : "text-text"}>
                  {g.text}
                </span>
                {g.dueDate && <span className="text-xs text-muted ml-auto mono">{g.dueDate}</span>}
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* heatmaps */}
      <section id="heatmap" className="space-y-6">
        <div className="bg-panel border border-line rounded-card p-4">
          <h2 className="display font-semibold mb-3">Questions solved</h2>
          <Heatmap data={qHeat} accent="#4FD1C5" label="questions" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-panel border border-line rounded-card p-4">
            <h3 className="display font-semibold mb-3 text-sm">Patterns written</h3>
            <Heatmap data={pHeat} accent="#E8A33D" label="patterns" weeks={16} />
          </div>
          <div className="bg-panel border border-line rounded-card p-4">
            <h3 className="display font-semibold mb-3 text-sm">Notes written</h3>
            <Heatmap data={nHeat} accent="#E1636B" label="notes" weeks={16} />
          </div>
        </div>
      </section>
    </div>
  );
}
