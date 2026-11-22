import { expect, test } from "@playwright/test";
import { awardForRarity } from "../../src/modules/domain/scoring";
import { PLAN, advance, playRound, startDaily } from "./helpers";

test.describe("guest daily operation", () => {
  test("plays all seven rounds, lands on results, and shares a spoiler-safe link", async ({ page, browser }) => {
    await startDaily(page);
    await page.getByRole("button", { name: "Begin round 1" }).click();

    for (let i = 1; i <= 7; i++) {
      await expect(page.getByRole("list", { name: new RegExp(`Round ${i} of 7`) })).toBeVisible();
      await playRound(page);
      // Sources are only shown after the lock.
      if (i === 1) await expect(page.getByText(/Why this counts/)).toBeVisible();
      await advance(page);
    }

    await expect(page).toHaveURL(/\/results\//);
    // Expected total from the published rarity values (rarest answer per prompt, one invalid).
    const rarities = [0.8, 0.3, 0.85, 0.55, 0.9, 0.85];
    const expected = rarities.reduce((s, r) => s + awardForRarity(r).distanceM, 0);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(expected.toLocaleString("en-US"));
    await expect(page.getByRole("table")).toContainText("Mausoleum at Halicarnassus");
    await expect(page.getByRole("table")).toContainText("“Atlantis” — not accepted");

    const shareUrl = await page.getByLabel("Challenge link").inputValue();
    expect(shareUrl).toMatch(/\/challenge\/\d{4}-\d{2}-\d{2}\?from=[A-Za-z0-9_-]{32}$/);
    const resultUrl = page.url();

    // Card renders as a PNG.
    const token = resultUrl.split("/results/")[1]!;
    const card = await page.request.get(`/api/v1/results/${token}/card`);
    expect(card.status()).toBe(200);
    expect(card.headers()["content-type"]).toContain("image/png");

    // A different browser (a friend) sees no answers or prompts.
    const friend = await browser.newContext();
    const fp = await friend.newPage();
    await fp.goto(resultUrl);
    await expect(fp.getByRole("heading", { level: 1 })).toContainText(expected.toLocaleString("en-US"));
    const body = (await fp.locator("body").textContent()) ?? "";
    for (const p of PLAN) {
      if (p.name) expect(body).not.toContain(p.name);
    }
    expect(body).not.toMatch(/Seven Wonders|Columbus|Atlantis/);
    await fp.getByRole("link", { name: "Take the same challenge" }).click();
    await expect(fp).toHaveURL(/\/challenge\//);
    await expect(fp.getByRole("heading", { level: 1 })).toContainText(`Beat ${expected.toLocaleString("en-US")}`);
    await fp.getByRole("link", { name: "Play this challenge" }).click();
    await expect(fp).toHaveURL(/\/game\//);
    await friend.close();

    // Returning to the landing page shows the completed result instead of a replay.
    await page.goto("/");
    await expect(page.getByText(/You traversed/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Play today’s operation/ })).toHaveCount(0);
  });

  test("resumes mid-run after a reload without losing the open round's deadline", async ({ page }) => {
    await startDaily(page);
    await page.getByRole("button", { name: "Begin round 1" }).click();
    const timer = page.getByRole("timer");
    await expect(timer).toBeVisible();
    const before = Number(await page.locator(".timer-value").textContent());
    await page.waitForTimeout(2200);
    await page.reload();
    await expect(page.getByRole("textbox", { name: "Your answer" })).toBeVisible();
    const after = Number(await page.locator(".timer-value").textContent());
    expect(after).toBeLessThan(before);
  });

  test("keyboard-only play with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await startDaily(page);
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
    await expect(page.getByRole("button", { name: "Begin round 1" })).toBeFocused();
    await page.keyboard.press("Enter");
    for (let i = 0; i < 3; i++) {
      await playRound(page, { keyboard: true });
      // Reduced motion: no travel animation to wait for.
      await expect(page.getByRole("button", { name: "Skip animation" })).toHaveCount(0);
      await advance(page, { keyboard: true });
    }
    await expect(page.getByRole("list", { name: /Round 4 of 7/ })).toBeVisible();
  });

  test("an unanswered round times out with no distance", async ({ page }) => {
    test.setTimeout(80_000);
    await startDaily(page);
    await page.getByRole("button", { name: "Begin round 1" }).click();
    await page.getByRole("textbox", { name: "Your answer" }).fill("typed but never locked");
    await expect(page.locator("#round-heading")).toHaveText("Time’s up", { timeout: 40_000 });
    await expect(page.getByText("No distance this round", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("0 m", { exact: true })).toBeVisible();
  });

  test("API rejects tampering: unopened rounds, foreign runs and oversized answers", async ({ page, request }) => {
    await startDaily(page);
    const runId = page.url().split("/game/")[1]!;
    const ctx = page.context().request;
    const early = await ctx.post(`/api/v1/runs/${runId}/rounds/3/open`, { headers: { origin: new URL(page.url()).origin } });
    expect(early.status()).toBe(409);
    expect((await early.json()).error.code).toBe("OUT_OF_SEQUENCE");
    const foreign = await request.get(`/api/v1/runs/${runId}`);
    expect([401, 404]).toContain(foreign.status());
    await ctx.post(`/api/v1/runs/${runId}/rounds/1/open`, { headers: { origin: new URL(page.url()).origin } });
    const long = await ctx.post(`/api/v1/runs/${runId}/rounds/1/submit`, {
      headers: { origin: new URL(page.url()).origin },
      data: { answer: "x".repeat(121), idempotencyKey: crypto.randomUUID() },
    });
    expect(long.status()).toBe(400);
    const cross = await ctx.post(`/api/v1/runs/${runId}/rounds/1/submit`, {
      headers: { origin: "https://evil.example" },
      data: { answer: "Pinta", idempotencyKey: crypto.randomUUID() },
    });
    expect(cross.status()).toBe(403);
    const state = await ctx.get(`/api/v1/runs/${runId}`);
    const json = JSON.stringify(await state.json());
    expect(json).not.toMatch(/rarity|alias|Mausoleum|Lighthouse/i);
  });
});
