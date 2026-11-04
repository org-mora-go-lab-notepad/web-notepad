import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
test("3. 긴 본문을 내부에서 스크롤한다", async ({ page, previewData }) => {
  const card = page.locator(
    '.dashboard-card[data-tab-id="long-note"] .dashboard-card-open',
  );
  const sheet = page.locator(".dashboard-preview");
  await card.click();
  await expect(sheet.locator("h2")).toHaveText(previewData.long.title);
  const editor = sheet.locator(".note-editor");
  await editor.evaluate((e) => {
    e.scrollTop = e.scrollHeight;
  });
  await expect
    .poll(() => editor.evaluate((e) => e.scrollTop))
    .toBeGreaterThan(0);
  await editor.hover();
  await page.mouse.wheel(0, -100000);
  await expect.poll(() => editor.evaluate((e) => e.scrollTop)).toBe(0);
  await expect(sheet.locator(".bottom-sheet-header")).toBeVisible();
});
