import { expect } from "@playwright/test";

import { previewTest as test } from "./__fixture__";
import { previewCard, previewSheet } from "./__util__";

test("4. 닫기 버튼은 카드 목록 스크롤과 누른 카드의 포커스를 복원한다", async ({
  page,
  previewData,
}) => {
  const card = previewCard(page, previewData.long.id);
  await card.scrollIntoViewIfNeeded();
  const list = page.locator(".dashboard-list");
  const before = await list.evaluate((el) => el.scrollTop);
  await card.tap();
  const sheet = previewSheet(page);
  await expect(sheet).toBeVisible();
  await sheet.locator(".bottom-sheet-content").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await sheet
    .getByRole("button", { name: "Close tab preview", exact: true })
    .tap();
  await expect(sheet).toHaveCount(0);
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  expect(await list.evaluate((el) => el.scrollTop)).toBe(before);
  await expect(card).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  await card.tap();
  await expect(previewSheet(page)).toBeVisible();
});
