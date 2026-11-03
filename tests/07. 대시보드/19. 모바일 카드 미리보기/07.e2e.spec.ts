import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
import { previewCard, previewSheet } from "./__util__";

test("7. 바텀시트의 키보드 포커스는 내부를 순환하고 Escape로 패널에 복귀한다", async ({
  page,
  previewData,
}) => {
  const card = previewCard(page, previewData.closed.id);
  await card.tap();
  const sheet = previewSheet(page);
  await expect(sheet).toBeVisible();
  const close = sheet.getByRole("button", {
    name: "Close tab preview",
    exact: true,
  });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(sheet.locator(".bottom-sheet-content")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(card).toBeFocused();
  await expect(page.locator("textarea")).not.toBeFocused();
});
