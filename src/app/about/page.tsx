import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = { title: "About & sources" };

export default function AboutPage() {
  return (
    <ContentPage title="About WARTRACE">
      <p>
        WARTRACE is a daily history knowledge game. Each operation has seven prompts with finite, sourced answer lists. Type one real answer per round — rarer
        valid answers carry your courier farther across an original, fictionalised landscape.
      </p>
      <h2>How scoring works</h2>
      <ul>
        <li>Every valid answer has a rarity value fixed when the operation is published. It never changes for that day.</li>
        <li>
          Points = 100 + round(900 × rarity<sup>1.3</sup>); distance = round(points × 0.8) metres. Wrong, blank or late answers score zero.
        </li>
        <li>Tiers — Common, Curious, Uncommon, Obscure — are labels for editorial rarity estimates, not scientific measurements.</li>
        <li>No AI judges your answers. Matching uses reviewed names and aliases only.</li>
      </ul>
      <h2>Sources and corrections</h2>
      <p>
        Every published answer carries sources reviewed by a human editor. Sources appear after you lock an answer. If we missed a valid answer, appeal from
        the round — corrections apply to future versions without silently changing past scores.
      </p>
      <h2>Historical dignity</h2>
      <p>
        The scene is a fictionalised expedition, not a reconstruction of any battle. Distance is game progress, not troop movement. We do not reward or depict
        casualties, atrocities or extremist iconography.
      </p>
    </ContentPage>
  );
}
