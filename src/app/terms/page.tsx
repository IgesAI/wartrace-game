import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <ContentPage title="Terms of play" draft>
      <ul>
        <li>WARTRACE is a free game provided as-is during development. Features and content may change.</li>
        <li>Play fairly: no automated play, answer scraping, score manipulation or attempts to access unreleased content.</li>
        <li>Appeals must not include personal data about others, harassment or unlawful content.</li>
        <li>Game art and code are original works of the WARTRACE project; third-party sources are credited on the Credits page under their own licenses.</li>
        <li>&ldquo;WARTRACE&rdquo; is a working title pending clearance and is not presented as a registered trademark.</li>
      </ul>
    </ContentPage>
  );
}
