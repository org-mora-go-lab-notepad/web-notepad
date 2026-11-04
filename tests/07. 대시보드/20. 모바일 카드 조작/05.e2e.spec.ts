import { expect } from "@playwright/test";

import { previewTest as test } from "../19. 모바일 카드 미리보기/__fixture__";
import { flickSheet } from "./__util__";

test("5. 시트 높이 조절 뒤 첫 터치가 click 누락에도 한 번 실행된다", async ({
  page,
  previewData,
}) => {
  const card = page.locator(
    '.dashboard-card[data-tab-id="long-note"] .dashboard-card-open',
  );
  await card.tap();
  const sheet = page.locator(".dashboard-preview");
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("h2")).toHaveText(previewData.long.title);
  await flickSheet(page, 35, 55);
  await expect(sheet.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "50",
  );
  const line = sheet.locator('.line-rail [role="button"]').first();
  await line.tap();
  await expect(line).toHaveAttribute("aria-pressed", "true");
  await line.tap();
  await expect(line).toHaveAttribute("aria-pressed", "false");
  await page.evaluate(() => {
    // Emulate browsers that omit compatibility clicks after a pan.
    document.addEventListener(
      "click",
      (event) => {
        if (event.isTrusted && event.detail > 0)
          event.stopImmediatePropagation();
      },
      true,
    );
  });
  await flickSheet(page, -35, 55);
  await line.tap();
  await expect(line).toHaveAttribute("aria-pressed", "true");
  await line.tap();
  await expect(line).toHaveAttribute("aria-pressed", "false");
  await sheet.locator(".bottom-sheet-header button").tap();
  await expect(sheet).toBeHidden();
  await card.tap();
  await expect(sheet).toBeVisible();
  await flickSheet(page, 100, 45);
  await expect(sheet).toBeHidden();
  await card.tap();
  await expect(sheet).toBeVisible();
});
