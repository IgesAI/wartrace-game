import { expect, type Page } from "@playwright/test";

/** Answers chosen by prompt keyword so tests don't depend on round order. `null` = deliberately invalid. */
export const PLAN: { match: RegExp; answer: string; expect: "valid" | "invalid" | "suggest"; name?: string }[] = [
  { match: /Seven Wonders/, answer: "Mausoleum at Halicarnassus", expect: "valid", name: "Mausoleum at Halicarnassus" },
  { match: /Columbus/, answer: "Pinta", expect: "valid", name: "Pinta" },
  { match: /Central Powers/, answer: "Atlantis", expect: "invalid" },
  { match: /North Atlantic Treaty/, answer: "Icelnd", expect: "suggest", name: "Iceland" },
  { match: /Normandy/, answer: "Sword", expect: "valid", name: "Sword Beach" },
  { match: /Vostok/, answer: "Bykovsky", expect: "valid", name: "Valery Bykovsky" },
  { match: /Moon/, answer: "Irwin", expect: "valid", name: "James Irwin" },
];

export const ARTIFACTS = process.env.E2E_ARTIFACTS_DIR ?? "test-results/screens";

export async function startDaily(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: /Play today’s operation/ }).click();
  await expect(page).toHaveURL(/\/game\//);
  await expect(page.getByRole("button", { name: "Begin round 1" })).toBeVisible();
}

export async function playRound(page: Page, opts: { keyboard?: boolean } = {}) {
  const heading = page.locator("#round-heading");
  await expect(page.getByRole("textbox", { name: "Your answer" })).toBeVisible();
  const prompt = (await heading.textContent()) ?? "";
  const step = PLAN.find((p) => p.match.test(prompt));
  if (!step) throw new Error(`No plan for prompt: ${prompt}`);
  const input = page.getByRole("textbox", { name: "Your answer" });
  if (opts.keyboard) {
    await expect(input).toBeFocused();
    await page.keyboard.type(step.answer);
    await page.keyboard.press("Enter");
  } else {
    await input.fill(step.answer);
    await page.getByRole("button", { name: "Lock" }).click();
  }
  if (step.expect === "suggest") {
    const yes = page.getByRole("button", { name: new RegExp(`Yes, lock “${step.name}”`) });
    await expect(yes).toBeVisible();
    if (opts.keyboard) {
      await expect(yes).toBeFocused();
      await page.keyboard.press("Enter");
    } else await yes.click();
  }
  if (step.expect === "invalid") await expect(heading).toHaveText("Not on our list");
  else await expect(heading).toHaveText(step.name!);
  return step;
}

export async function advance(page: Page, opts: { keyboard?: boolean } = {}) {
  const next = page.getByRole("button", { name: /^Next: round|See your expedition/ });
  const skip = page.getByRole("button", { name: "Skip animation" });
  // The skip button unmounts the moment travel finishes, so a missed click is fine.
  if (await skip.isVisible().catch(() => false)) {
    if (opts.keyboard) {
      await skip.focus({ timeout: 1000 }).catch(() => {});
      await page.keyboard.press("Enter");
    } else await skip.click({ timeout: 1000 }).catch(() => {});
  }
  await expect(next).toBeEnabled();
  if (opts.keyboard) {
    await expect(next).toBeFocused();
    await page.keyboard.press("Enter");
  } else await next.click();
}
