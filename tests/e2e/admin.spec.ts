import { expect, test } from "@playwright/test";

test.describe("editorial suite", () => {
  test("anonymous visitors are redirected and admin APIs refuse them", async ({ page, request }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
    const res = await request.get("/api/v1/admin/questions");
    expect(res.status()).toBe(401);
  });

  test("an editor cannot publish; a publisher can publish a draft only as labelled demo content", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByRole("button", { name: /Sign in as Editor/ }).click();
    await expect(page.getByRole("heading", { name: "Operations" })).toBeVisible();
    const draftLink = page.getByRole("row").filter({ hasText: "draft" }).first().getByRole("link");
    await draftLink.click();
    await expect(page.getByText("Readiness gate")).toBeVisible();
    await expect(page.getByText("Your role cannot publish")).toBeVisible();
    await page.getByRole("button", { name: /^Publish/ }).click();
    await expect(page.getByRole("status")).toContainText("FORBIDDEN");
    const opUrl = page.url();

    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByRole("button", { name: /Sign in as Publisher/ }).click();
    await page.goto(opUrl);
    await page.getByRole("button", { name: /^Publish/ }).click();
    await expect(page.getByRole("status")).toContainText("PUBLISH_BLOCKED");
    await page.getByLabel(/Publish as labelled DEMO content/).check();
    await page.getByRole("button", { name: /Publish as demo/ }).click();
    await expect(page.getByRole("status")).toContainText("Published and frozen");
    await expect(page.locator(".pill").filter({ hasText: "published" })).toBeVisible();

    await page.goto("/admin/audit");
    await expect(page.getByRole("table")).toContainText("operation.publish");
  });

  test("admin mutations require same-origin requests", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByRole("button", { name: /Sign in as Owner/ }).click();
    await expect(page.getByRole("heading", { name: "Operations" })).toBeVisible();
    const res = await page.context().request.post(`/api/v1/admin/operations/${crypto.randomUUID()}/disable`, {
      headers: { origin: "https://evil.example" },
      data: { reason: "cross-site attempt" },
    });
    expect(res.status()).toBe(403);
  });
});
