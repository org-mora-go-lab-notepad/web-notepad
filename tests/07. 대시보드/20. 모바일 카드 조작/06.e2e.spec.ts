import { expect } from "@playwright/test";

import { previewTest as test } from "../19. 모바일 카드 미리보기/__fixture__";

test("6. light 테마의 바텀시트는 밝은 흰색 배경을 사용한다", async ({
  page,
  previewData,
}) => {
  await page.evaluate(() => (document.documentElement.dataset.theme = "light"));
  await page
    .locator('.dashboard-card[data-tab-id="long-note"] .dashboard-card-open')
    .tap();
  const sheet = page.locator(".dashboard-preview");
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("h2")).toHaveText(previewData.long.title);
  await expect(sheet).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(sheet.locator("textarea")).toBeEditable();
  await expect(sheet.locator("h2")).toBeVisible();
  await page.evaluate(() => (document.documentElement.dataset.theme = "dark"));
  await expect(sheet).not.toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(sheet.locator("textarea")).toBeEditable();
  await sheet.locator(".bottom-sheet-header button").tap();
  await expect(sheet).toBeHidden();
});
