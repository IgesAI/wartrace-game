import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = { title: "Accessibility" };

export default function AccessibilityPage() {
  return (
    <ContentPage title="Accessibility">
      <p>We aim for WCAG 2.2 AA. The game is fully playable with a keyboard and screen reader, without sound, and without animation.</p>
      <ul>
        <li>All text, prompts, timers and controls are real HTML — the animated scene is decorative.</li>
        <li>
          <strong>Reduced motion</strong> follows your system setting and can be toggled in-game. Camera travel becomes an instant cut.
        </li>
        <li>
          <strong>High contrast</strong> mode strengthens borders and muted text.
        </li>
        <li>Timer warnings are announced at 10 and 5 seconds; results are announced when a round locks.</li>
        <li>Outcomes never rely on colour alone: every tier has a text label.</li>
        <li>If graphics acceleration is unavailable, a static illustrated scene is shown instead.</li>
      </ul>
      <p>Known limitation: the 25-second timer is part of the daily challenge&apos;s fairness. An untimed practice mode is planned. Report barriers via Support.</p>
    </ContentPage>
  );
}
