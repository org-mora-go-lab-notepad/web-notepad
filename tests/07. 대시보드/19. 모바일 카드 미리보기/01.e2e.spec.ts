import { expect } from "@playwright/test";

import { readStoredState } from "../../__util__";
import { previewTest as test } from "./__fixture__";
import { previewCard, previewSheet } from "./__util__";

test("1. 모바일 카드를 누르면 패널과 메인 선택을 유지하고 전체 본문을 바텀시트로 표시한다", async ({
  page,
  previewData,
}) => {
  const before = await readStoredState(page);
  const card = previewCard(page, previewData.long.id);
  await card.tap();
  const sheet = previewSheet(page);
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAttribute("aria-modal", "true");
  await expect(sheet.locator("h2")).toHaveText(previewData.long.title);
  expect(await sheet.locator("pre").textContent()).toBe(
    previewData.long.content,
  );
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(page.locator("textarea")).toHaveValue(
    previewData.active.content,
  );
  const after = await readStoredState(page);
  expect(after.groups[0].activeTabId).toBe(before.groups[0].activeTabId);
  expect(after.groups[0].tabs).toEqual(before.groups[0].tabs);
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
    "BUTTON",
  );
  expect(
    await page.evaluate(
      () => document.querySelector("textarea") === document.activeElement,
    ),
  ).toBe(false);
});
