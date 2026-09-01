"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleGoogle() {
    setError("");
    try {
      await loginWithGoogle();
      router.replace("/");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") await loginWithEmail(email, password);
      else await signupWithEmail(email, password);
      router.replace("/");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm bg-panel border border-line rounded-card p-6">
        <h1 className="display text-xl font-semibold mb-1">DSA Tracker</h1>
        <p className="text-muted text-sm mb-6">Track topics, patterns, notes and streaks.</p>

        <button
          onClick={handleGoogle}
          className="w-full py-2 rounded bg-panel2 border border-line hover:border-amber text-sm mb-4"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-2 text-muted text-xs mb-4">
          <div className="flex-1 h-px bg-line" /> or <div className="flex-1 h-px bg-line" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-ink border border-line text-sm outline-none focus:border-amber"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-ink border border-line text-sm outline-none focus:border-amber"
          />
          {error && <p className="text-rose text-xs">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 rounded bg-amber text-ink font-medium text-sm"
          >
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full text-center text-xs text-muted hover:text-text mt-4"
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
