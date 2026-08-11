"use client";

import { FormEvent, useState } from "react";
import { BACKEND } from "../lib/auth";

const choices = ["Breaking News", "Daily Summary", "Bitcoin", "Ethereum", "XRP", "Altcoins", "ETFs", "Regulation", "Security"];

export default function NewsletterSignup() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!BACKEND) { setState("error"); setMessage("Subscription service is temporarily unavailable."); return; }
    const data = new FormData(event.currentTarget);
    const preferences = choices.filter((choice) => data.getAll("preferences").includes(choice));
    setState("sending");
    try {
      const response = await fetch(`${BACKEND}/api/v1/audience/subscribe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), consent: data.get("consent") === "yes", preferences, source: "newsletter-page", website: data.get("website") }) });
      if (!response.ok) throw new Error("Please review your email, consent and alert choices.");
      setState("done"); setMessage("Your preferences were saved. Confirmation delivery will begin when the email channel is connected.");
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Unable to subscribe."); }
  }
  return (
    <form onSubmit={submit} className="card mt-6 space-y-4 p-5">
      <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="block text-sm font-medium">Email address<input type="email" name="email" required autoComplete="email" className="mt-1 w-full rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm focus:border-primary focus:outline-none" /></label>
      <fieldset><legend className="text-sm font-medium">Choose alerts</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{choices.map((choice) => <label key={choice} className="flex gap-2 text-sm text-ink-dim"><input type="checkbox" name="preferences" value={choice} />{choice}</label>)}</div></fieldset>
      <label className="flex gap-2 text-xs leading-relaxed text-ink-dim"><input type="checkbox" name="consent" value="yes" required />I explicitly consent to receive the selected AION Crypto alerts. No box is preselected, and I can unsubscribe at any time.</label>
      <button disabled={state === "sending"} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{state === "sending" ? "Saving…" : "Save alert preferences"}</button>
      {message && <p role="status" className={`text-sm ${state === "error" ? "text-accent-red" : "text-ink-dim"}`}>{message}</p>}
    </form>
  );
}
