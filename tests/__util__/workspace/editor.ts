import { expect, type Page } from "@playwright/test";

// User-driven preparation for editing scenarios; empty-workspace contracts use page.goto directly.
export async function openEditor(page: Page) {
  await page.goto("/");
  await expect(page.locator(".initial-sync-lock")).toHaveCount(0);
  const add = page
    .getByRole("button", { name: "New tab", exact: true })
    .first();
  await expect(add).toBeVisible();
  if ((await page.locator(".tab-item").count()) === 0) await add.click();
  await expect(page.locator("textarea").first()).toBeVisible();
}

export async function ensureEditorTab(page: Page) {
  await expect(page.locator(".initial-sync-lock")).toHaveCount(0);
  if ((await page.locator("textarea").count()) === 0)
    await page
      .getByRole("button", { name: "New tab", exact: true })
      .first()
      .click();
  await expect(page.locator("textarea").first()).toBeVisible();
}
