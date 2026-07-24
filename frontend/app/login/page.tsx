"use client";

import { useState } from "react";
import { track } from "../../components/Analytics";
import { BACKEND, clearSession, saveTokens, verifySession } from "../../lib/auth";

export default function LoginPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ok">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = new FormData(e.currentTarget);
    if (!BACKEND) {
      setStatus("error");
      setMessage("Sign-in is not connected in this preview environment.");
      return;
    }
    try {
      const res = await fetch(`${BACKEND}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      if (!res.ok) {
        setStatus("error");
        setMessage(res.status === 401 ? "Email or password is incorrect." : "Sign-in is unavailable right now. Try again shortly.");
        return;
      }
      const tokens = await res.json();
      saveTokens(tokens);
      const user = await verifySession();
      if (!user) {
        clearSession();
        setStatus("error");
        setMessage("Sign-in could not be verified. Please try again.");
        return;
      }
      track("login");
      setStatus("ok");
      setMessage(user.role === "admin" || user.role === "editor" ? "Signed in. Your account access was verified." : "Signed in. Your account was verified.");
    } catch {
      setStatus("error");
      setMessage("Could not reach the API. Check that the backend is running.");
    }
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-2xl font-bold">Sign in</h1>
      <p className="mt-1 text-[13px] text-ink-dim">Editorial and admin access. Accounts are created by administrators.</p>
      <form onSubmit={onSubmit} className="card mt-5 space-y-4 p-5">
        <label className="block text-[13px]">
          <span className="text-ink-dim">Email</span>
          <input name="email" type="email" required autoComplete="email"
            className="mt-1 w-full rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </label>
        <label className="block text-[13px]">
          <span className="text-ink-dim">Password</span>
          <input name="password" type="password" required autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </label>
        <button disabled={status === "loading"}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-glow disabled:opacity-50">
          {status === "loading" ? "Signing in…" : "Sign in"}
        </button>
        {message && (
          <p className={`text-[13px] ${status === "error" ? "text-accent-red" : "text-accent-green"}`} role="status">{message}</p>
        )}
      </form>
    </div>
  );
}
