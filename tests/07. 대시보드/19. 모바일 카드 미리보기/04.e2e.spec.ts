import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
test("4. 닫으면 선택한 카드를 유지한다", async ({ page, previewData }) => {
  const card = page.locator(
    '.dashboard-card[data-tab-id="long-note"] .dashboard-card-open',
  );
  const sheet = page.locator(".dashboard-preview");
  await card.click();
  await sheet.locator(".bottom-sheet-header button").click();
  await expect(sheet).not.toBeVisible();
  await expect(
    page.locator('.dashboard-card[data-tab-id="long-note"]'),
  ).toHaveClass(/is-active/);
  await card.click();
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("textarea")).toHaveValue(previewData.long.content);
  await expect(
    page.locator('.dashboard-card[data-tab-id="long-note"]'),
  ).toHaveClass(/is-active/);
});
