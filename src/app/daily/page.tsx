import type { Metadata } from "next";
import { StartRun } from "./StartRun";

export const metadata: Metadata = { title: "Today’s operation" };

export default async function DailyPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return <StartRun referred={typeof from === "string" && /^[A-Za-z0-9_-]{20,100}$/.test(from)} />;
}
