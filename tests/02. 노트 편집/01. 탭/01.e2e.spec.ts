import { expect, test } from "@playwright/test";

import { readStoredState } from "../../__util__";

test("1. 마지막 탭을 닫으면 자동 생성 없이 상단 새 탭 버튼만 남는다", async ({
  page,
}) => {
  await page.goto("/");
  const add = page.getByRole("button", { name: "New tab", exact: true });
  await expect(add).toBeVisible();
  await add.click();
  await page.locator("textarea").fill("Keep this closed note");
  await page.locator(".tab-close").click();
  await expect(page.locator(".tab-item")).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveCount(0);
  await expect(add).toBeVisible();
  const state = await readStoredState(page);
  const original = state.groups[0].tabs.find(
    (tab) => tab.content === "Keep this closed note",
  );
  expect(original).toBeDefined();
  expect(original?.open).toBe(false);
  await page.reload();
  await expect(add).toBeVisible();
  await expect(page.locator(".tab-item")).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveCount(0);
});
