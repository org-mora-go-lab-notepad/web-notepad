import { expect, type Page } from "@playwright/test";

import { readStoredState } from "../state";

// User-driven preparation for editing scenarios; empty-workspace contracts use page.goto directly.
export async function openEditor(page: Page) {
  await page.goto("/");
  await expect(page.locator(".initial-sync-lock")).toHaveCount(0);
  if ((page.viewportSize()?.width ?? 1280) <= 512) {
    await page.locator(".dashboard-add-tab").click();
    await expect(page.locator(".dashboard-preview textarea")).toBeVisible();
    return;
  }
  const add = page
    .getByRole("button", { name: "New tab", exact: true })
    .first();
  await expect(add).toBeVisible();
  if ((await page.locator(".tab-item").count()) === 0) await add.click();
  await expect(page.locator("textarea").first()).toBeVisible();
}

export async function closeMobileEditor(page: Page) {
  const sheet = page.locator(".dashboard-preview");
  if (await sheet.isVisible()) {
    await sheet.locator(".bottom-sheet-header button").click();
    await expect(sheet).not.toBeVisible();
  }
}

export async function ensureEditorTab(page: Page) {
  if ((page.viewportSize()?.width ?? 1280) <= 512) {
    if (await page.locator(".dashboard-preview").isVisible()) return;
    await expect(page.locator(".initial-sync-lock")).toHaveCount(0);
    const state = await readStoredState(page);
    const group = state.groups.find(
      (group) => group.id === state.activeGroupId,
    );
    const card = page.locator(
      `.dashboard-card[data-tab-id="${group?.activeTabId}"] .dashboard-card-open`,
    );
    if (await card.isVisible()) await card.click();
    else await page.locator(".dashboard-add-tab").click();
    await expect(page.locator(".dashboard-preview textarea")).toBeVisible();
    return;
  }
  await expect(page.locator(".initial-sync-lock")).toHaveCount(0);
  if ((await page.locator("textarea").count()) === 0)
    await page
      .getByRole("button", { name: "New tab", exact: true })
      .first()
      .click();
  await expect(page.locator("textarea").first()).toBeVisible();
}
