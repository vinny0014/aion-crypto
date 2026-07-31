"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { authenticatedFetch } from "../lib/auth";

const categories = ["Bitcoin", "Ethereum", "XRP", "Altcoins", "ETFs", "DeFi", "Regulation", "Security", "Exchanges", "Institutional", "Market Analysis", "Blockchain Technology"];

export default function AdminEditorial() {
  const [message, setMessage] = useState("");
  const [candidates, setCandidates] = useState<{ article_id: number; title: string; score: number; reason: string; marked_candidate: boolean; ad_package: { headline: string; description: string; url: string; utm: string; suggested_image: string; suggested_audience: string[]; checklist: string[]; activation: string } }[]>([]);
  const [outbox, setOutbox] = useState<{ id: number; channel: string; payload: { text?: string }; utm_url: string; status: string }[]>([]);
  const refresh = useCallback(async () => {
    try {
      const [dashboardResponse, outboxResponse] = await Promise.all([authenticatedFetch("/api/v1/admin/editorial-dashboard"), authenticatedFetch("/api/v1/admin/social-outbox")]);
      if (dashboardResponse.ok) setCandidates(((await dashboardResponse.json()) as { daily_candidates: typeof candidates }).daily_candidates);
      if (outboxResponse.ok) setOutbox(((await outboxResponse.json()) as { data: typeof outbox }).data);
    } catch {
      setMessage("Editorial operations are temporarily unavailable; no queued data was changed.");
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("Queueing sourced story…");
    const payload = {
      provisional_title: form.get("title"), fact_summary: form.get("summary"), notes: form.get("notes"),
      primary_source: form.get("source"), additional_sources: String(form.get("additional") || "").split(/\s+/).filter(Boolean),
      related_asset: form.get("asset"), category: form.get("category"), image_url: "", urgency: form.get("urgency"),
      language: "en", action: form.get("action"),
      prepare_social: form.get("social") === "yes", daily_candidate: form.get("candidate") === "yes",
    };
    let response: Response;
    try {
      response = await authenticatedFetch("/api/v1/admin/breaking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch {
      setMessage("Unable to reach editorial operations; no story was queued.");
      return;
    }
    if (!response.ok) { const error = await response.json().catch(() => ({})) as { detail?: string }; setMessage(error.detail || "Unable to queue story."); return; }
    const result = await response.json() as { article_id: number };
    setMessage(`Article #${result.article_id} queued. Run the pipeline to verify; no ad or paid campaign was created.`);
    await refresh();
  }
  async function runPipeline() {
    setMessage("Running one bounded pipeline cycle…");
    let response: Response;
    try { response = await authenticatedFetch("/api/v1/admin/pipeline/run", { method: "POST" }); }
    catch { setMessage("Pipeline is temporarily unavailable; retry when the backend is healthy."); return; }
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? `Pipeline finished: ${JSON.stringify(result)}` : "Pipeline run failed.");
    if (response.ok) await refresh();
  }
  async function exportAudience() {
    let response: Response;
    try { response = await authenticatedFetch("/api/v1/admin/audience/export.csv"); }
    catch { setMessage("Audience export is temporarily unavailable."); return; }
    if (!response.ok) { setMessage("Audience export failed."); return; }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "aion-crypto-audience.csv"; anchor.click();
    URL.revokeObjectURL(url);
  }
  function copyCandidate(candidate: (typeof candidates)[number]) {
    void navigator.clipboard.writeText(JSON.stringify(candidate.ad_package, null, 2));
    setMessage(`Campaign package for article #${candidate.article_id} copied. Activation remains disabled.`);
  }
  return (
    <section className="card mt-6 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-bold">BREAKING NEWS</h2><p className="text-xs text-ink-dim">Use the existing article workflow for source checks, review, publication and a no-cost social package. Ads stay disabled.</p></div><div className="flex gap-2"><button type="button" onClick={exportAudience} className="rounded-lg border border-line px-3 py-2 text-sm hover:border-primary">Export subscribers</button><button type="button" onClick={runPipeline} className="rounded-lg border border-line px-3 py-2 text-sm hover:border-primary">Run pipeline cycle</button></div></div>
      <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="text-sm md:col-span-2">Provisional title<input name="title" minLength={12} maxLength={300} required className="mt-1 w-full rounded-lg border border-line bg-bg-soft p-2" /></label>
        <label className="text-sm md:col-span-2">Fact summary<textarea name="summary" minLength={20} required rows={3} className="mt-1 w-full rounded-lg border border-line bg-bg-soft p-2" /></label>
        <label className="text-sm md:col-span-2">Original notes / draft<textarea name="notes" rows={7} className="mt-1 w-full rounded-lg border border-line bg-bg-soft p-2" /></label>
        <label className="text-sm">Primary HTTPS source<input name="source" type="url" required className="mt-1 w-full rounded-lg border border-line bg-bg-soft p-2" /></label>
        <label className="text-sm">Additional source URLs<input name="additional" placeholder="Separate with spaces" className="mt-1 w-full rounded-lg border border-line bg-bg-soft p-2" /></label>
        <label className="text-sm">Category<select name="category" className="mt-1 w-full rounded-lg border border-line bg-bg-soft p-2">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm">Urgency<select name="urgency" className="mt-1 w-full rounded-lg border border-line bg-bg-soft p-2"><option>breaking</option><option>high</option><option>normal</option><option>evergreen</option></select></label>
        <label className="text-sm">Related asset<input name="asset" maxLength={30} placeholder="BTC" className="mt-1 w-full rounded-lg border border-line bg-bg-soft p-2" /></label>
        <label className="text-sm">Action<select name="action" className="mt-1 w-full rounded-lg border border-line bg-bg-soft p-2"><option value="review">Review before publication</option><option value="draft">Save draft</option><option value="publish">Publish only if every gate passes</option></select></label>
        <div className="space-y-2 text-sm"><label className="flex gap-2"><input type="checkbox" name="social" value="yes" />Prepare social package</label><label className="flex gap-2"><input type="checkbox" name="candidate" value="yes" />Daily campaign candidate</label></div>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white md:col-span-2">Queue sourced story</button>
      </form>{message && <p className="mt-3 break-words text-xs text-ink-dim" role="status">{message}</p>}
      <div className="mt-6 grid gap-4 lg:grid-cols-2"><section><h3 className="text-sm font-semibold">CANDIDATE FOR TODAY&apos;S CAMPAIGN</h3>{candidates.length ? <ul className="mt-2 space-y-2">{candidates.slice(0, 5).map((item) => <li className="rounded-lg border border-line p-3 text-sm" key={item.article_id}><strong>{item.title}</strong><p className="text-xs text-ink-dim">Score {item.score} — {item.reason}. {item.marked_candidate ? "Explicitly marked. " : "Automatically ranked. "}Activation: {item.ad_package.activation}.</p><p className="mt-2 text-xs text-ink-dim">{item.ad_package.headline} · {item.ad_package.description}</p><button type="button" onClick={() => copyCandidate(item)} className="mt-2 rounded border border-line px-2 py-1 text-xs">Copy complete package</button></li>)}</ul> : <p className="mt-2 text-xs text-ink-dim">No ready article in the last 24 hours.</p>}</section>
      <section><h3 className="text-sm font-semibold">SOCIAL OUTBOX</h3>{outbox.length ? <ul className="mt-2 space-y-2">{outbox.slice(0, 8).map((item) => <li className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 text-sm" key={item.id}><span>{item.channel} · {item.status}</span><button type="button" onClick={() => navigator.clipboard.writeText(`${item.payload.text || ""}\n${item.utm_url}`.trim())} className="rounded border border-line px-2 py-1 text-xs">Copy</button></li>)}</ul> : <p className="mt-2 text-xs text-ink-dim">No prepared social payload.</p>}</section></div></section>
  );
}
