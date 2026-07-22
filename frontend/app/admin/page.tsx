"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Overview = {
  tasks: Record<string, number>;
  open_incidents: number;
  cost_guard: { band: string; month_spend_usd: number; monthly_limit_usd: number };
  scheduler: { status: string };
  agents: { status: string; registered: string[] };
};

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [state, setState] = useState<"loading" | "signed_out" | "offline" | "forbidden" | "ready">("loading");

  useEffect(() => {
    const token = sessionStorage.getItem("aion-access-token");
    if (!token) {
      setState("signed_out");
      return;
    }
    if (!BACKEND) {
      setState("offline");
      return;
    }
    fetch(`${BACKEND}/api/v1/admin/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "forbidden" : "offline");
        setOverview((await response.json()) as Overview);
        setState("ready");
      })
      .catch((error: Error) => setState(error.message === "forbidden" ? "forbidden" : "offline"));
  }, []);

  return (
    <div className="py-6">
      <h1 className="font-display text-2xl font-bold">Operations dashboard</h1>
      <p className="mt-1 text-[13px] text-ink-dim">Protected production-readiness view for tasks, incidents and Cost Guard.</p>

      {state === "loading" && <p className="mt-5 text-ink-dim" role="status">Loading operations status…</p>}
      {state === "signed_out" && (
        <div className="card mt-5 p-5 text-sm text-ink-dim">Sign in to view operations. <Link href="/login" className="text-primary-glow">Open sign in</Link>.</div>
      )}
      {state === "offline" && <div className="card mt-5 p-5 text-sm text-accent-red">Admin API is not connected in this preview.</div>}
      {state === "forbidden" && <div className="card mt-5 p-5 text-sm text-accent-red">This account does not have admin access.</div>}

      {state === "ready" && overview && (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <section className="card p-4"><h2 className="text-xs uppercase text-ink-dim">Cost Guard</h2><p className="mt-2 text-xl font-bold">{overview.cost_guard.band}</p><p className="text-xs text-ink-dim">${overview.cost_guard.month_spend_usd.toFixed(2)} / ${overview.cost_guard.monthly_limit_usd.toFixed(2)}</p></section>
          <section className="card p-4"><h2 className="text-xs uppercase text-ink-dim">Open incidents</h2><p className="mt-2 text-xl font-bold">{overview.open_incidents}</p></section>
          <section className="card p-4"><h2 className="text-xs uppercase text-ink-dim">Scheduler</h2><p className="mt-2 text-sm font-semibold">{overview.scheduler.status.replaceAll("_", " ")}</p></section>
          <section className="card p-4"><h2 className="text-xs uppercase text-ink-dim">Agents</h2><p className="mt-2 text-sm font-semibold">{overview.agents.status.replaceAll("_", " ")}</p><p className="text-xs text-ink-dim">{overview.agents.registered.length} registered</p></section>
          <section className="card p-4 md:col-span-2 xl:col-span-4">
            <h2 className="text-xs uppercase text-ink-dim">Task queue</h2>
            {Object.keys(overview.tasks).length ? (
              <dl className="mt-3 flex flex-wrap gap-4">{Object.entries(overview.tasks).map(([status, count]) => <div key={status}><dt className="text-xs text-ink-dim">{status}</dt><dd className="text-lg font-bold">{count}</dd></div>)}</dl>
            ) : <p className="mt-2 text-sm text-ink-dim">No tasks queued.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
