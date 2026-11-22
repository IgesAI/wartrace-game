import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { playRound, startDaily } from "./helpers";

async function axe(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${label}: ${v.id} — ${v.help} (${v.nodes.length})`)).toEqual([]);
}

test.describe("accessibility (axe, WCAG 2.2 AA serious/critical)", () => {
  test("landing, content and policy pages", async ({ page }) => {
    for (const path of ["/", "/about", "/privacy", "/accessibility", "/credits", "/archive", "/appeal", "/admin/login"]) {
      await page.goto(path);
      await axe(page, path);
    }
  });

  test("game intro, active round, reveal and results", async ({ page }) => {
    await startDaily(page);
    await axe(page, "intro");
    await page.getByRole("button", { name: "Begin round 1" }).click();
    await expect(page.getByRole("timer")).toBeVisible();
    await axe(page, "active round");
    await playRound(page);
    // Let the reveal card's fade-in finish so contrast is measured on the settled frame.
    await page.waitForTimeout(500);
    await axe(page, "reveal");
  });
});
