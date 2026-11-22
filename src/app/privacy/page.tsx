import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <ContentPage title="Privacy" draft>
      <p>WARTRACE works without an account. We collect the minimum needed to run a fair daily game.</p>
      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Guest cookie</strong> (<code>wartrace_guest</code>, HttpOnly, about 13 months): a random identifier so you can resume today&apos;s run and see your
          results. The server stores only a hash of its secret.
        </li>
        <li>
          <strong>Game records</strong>: your submitted answers, scores and timestamps for each run, used for scoring, appeals and abuse prevention.
        </li>
        <li>
          <strong>Appeals</strong>: the text and optional link you send, reviewed by editors.
        </li>
        <li>
          <strong>Preferences</strong> (motion, contrast) live in your browser&apos;s local storage only.
        </li>
      </ul>
      <h2>Analytics</h2>
      <p>
        When enabled, first-party product events record counts and categories only (for example round number, outcome, score). They never contain your typed
        answers, share tokens or identifiers. No third-party trackers, advertising or fingerprinting.
      </p>
      <h2>Shared results</h2>
      <p>Result links show distance, score and rarity tiers only — never your answers or any personal information.</p>
      <h2>Your choices</h2>
      <p>Clear cookies to end your guest session. Deletion requests for stored runs: see Support. Retention periods are to be confirmed before launch.</p>
      <p>WARTRACE is not directed to children under 13.</p>
    </ContentPage>
  );
}
