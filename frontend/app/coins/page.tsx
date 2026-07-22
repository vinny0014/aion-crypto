import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Coins", alternates: { canonical: "/coins" } };
export default function CoinsPage() {
  redirect("/markets");
}
