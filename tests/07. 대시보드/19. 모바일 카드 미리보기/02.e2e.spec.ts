import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
test("2. 닫힌 카드도 편집한다", async ({ page, previewData }) => {
  const card = page.locator(
    '.dashboard-card[data-tab-id="closed-note"] .dashboard-card-open',
  );
  const sheet = page.locator(".dashboard-preview");
  await card.click();
  await expect(sheet.locator("textarea")).toHaveValue(
    previewData.closed.content,
  );
  await expect(sheet.locator(".dashboard-preview-meta")).toHaveCount(0);
  await expect(sheet.locator("h2")).toHaveText(previewData.closed.title);
  await expect(sheet.locator("script")).toHaveCount(0);
  await expect(sheet.locator("textarea")).toBeEditable();
  await expect(sheet.locator(".bottom-sheet-header button")).toBeVisible();
  await expect(
    page.locator('.dashboard-card[data-tab-id="closed-note"]'),
  ).toHaveClass(/is-active/);
});
