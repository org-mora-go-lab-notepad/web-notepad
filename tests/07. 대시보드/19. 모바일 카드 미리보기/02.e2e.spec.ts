import { expect } from "@playwright/test";

import { readStoredState } from "../../__util__";
import { previewTest as test } from "./__fixture__";
import { previewCard, previewSheet } from "./__util__";

test("2. 닫힌 카드의 미리보기는 탭을 다시 열거나 기존 본문을 변경하지 않는다", async ({
  page,
  previewData,
}) => {
  const before = await readStoredState(page);
  const openCount = await page.locator(".tab-item").count();
  await previewCard(page, previewData.closed.id).tap();
  const sheet = previewSheet(page);
  await expect(sheet).toBeVisible();
  expect(await sheet.locator("pre").textContent()).toBe(
    previewData.closed.content,
  );
  await expect(sheet.locator("pre script")).toHaveCount(0);
  await expect(sheet.getByLabel("Bookmarked")).toBeVisible();
  await expect(page.locator(".tab-item")).toHaveCount(openCount);
  await sheet
    .getByRole("button", { name: "Close tab preview", exact: true })
    .tap();
  await expect(sheet).toHaveCount(0);
  const after = await readStoredState(page);
  expect(after.groups[0].tabs).toEqual(before.groups[0].tabs);
  expect(
    after.groups[0].tabs.find((tab) => tab.id === previewData.closed.id)?.open,
  ).toBe(false);
  await expect(page.locator("textarea")).toHaveValue(
    previewData.active.content,
  );
});
