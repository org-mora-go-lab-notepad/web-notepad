import { expect } from "@playwright/test";

import { previewTest as test } from "../19. 모바일 카드 미리보기/__fixture__";
import { flickSheet } from "./__util__";
test("2. 짧은 위아래 플릭은 바텀시트 높이를 한 단계씩 바꾼다", async ({
  page,
  previewData,
}) => {
  await page
    .locator('.dashboard-card[data-tab-id="long-note"] .dashboard-card-open')
    .click();
  const sheet = page.locator(".dashboard-preview");
  await expect(sheet.locator("h2")).toHaveText(previewData.long.title);
  const grip = sheet.getByRole("slider");
  await grip.focus();
  await page.keyboard.press("ArrowDown");
  await expect(grip).toHaveAttribute("aria-valuenow", "50");
  await flickSheet(page, -35, 55);
  await expect(grip).toHaveAttribute("aria-valuenow", "75");
  await expect(sheet).toBeVisible();
  await flickSheet(page, 35, 55);
  await expect(grip).toHaveAttribute("aria-valuenow", "50");
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("textarea")).toHaveValue(previewData.long.content);
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("notepad-sheet-height")),
    )
    .toBe("50");
  await expect(sheet).not.toHaveAttribute("data-resizing", "true");
});
