import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { ARTIFACTS, advance, playRound, startDaily } from "./helpers";

const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

test.describe("responsive layouts", () => {
  test.beforeAll(() => fs.mkdirSync(ARTIFACTS, { recursive: true }));

  for (const vp of VIEWPORTS) {
    test(`${vp.name}: no horizontal scroll, prompt and timer visible, captures screens`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const shot = (name: string) => page.screenshot({ path: path.join(ARTIFACTS, `${vp.name}-${name}.png`) });
      await page.goto("/");
      await page.waitForTimeout(1200);
      await shot("01-landing");
      await startDaily(page);
      await page.getByRole("button", { name: "Begin round 1" }).click();
      await expect(page.getByRole("timer")).toBeInViewport();
      await expect(page.locator("#round-heading")).toBeInViewport();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await page.waitForTimeout(600);
      await shot("02-round");
      await playRound(page);
      await page.waitForTimeout(1300);
      await shot("03-reveal");
      for (let round = 2; round <= 7; round++) {
        await advance(page);
        await playRound(page);
      }
      await advance(page);
      await expect(page).toHaveURL(/\/results\//);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(ARTIFACTS, `${vp.name}-04-results.png`), fullPage: true });
      await ctx.close();
    });
  }
});
