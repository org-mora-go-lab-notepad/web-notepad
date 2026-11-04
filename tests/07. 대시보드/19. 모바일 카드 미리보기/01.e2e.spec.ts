import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
test("1. 카드에서 수정하고 제목을 갱신한다", async ({ page, previewData }) => {
  const card = page.locator(
    '.dashboard-card[data-tab-id="long-note"] .dashboard-card-open',
  );
  const sheet = page.locator(".dashboard-preview");
  await card.click();
  await expect(sheet.locator("textarea")).toHaveValue(previewData.long.content);
  await sheet.locator("textarea").fill("Edited title");
  await expect(sheet.locator("h2")).toHaveText("Edited title");
  await expect(card).toContainText("Edited title");
  await sheet.locator(".bottom-sheet-header button").click();
  await page.reload();
  await card.click();
  await expect(sheet.locator("textarea")).toHaveValue("Edited title");
  await expect(sheet.locator("h2")).toHaveText("Edited title");
  await expect(sheet.locator("textarea")).toBeEditable();
  await expect(sheet.locator(".line-rail [role=button]")).toHaveCount(1);
});
