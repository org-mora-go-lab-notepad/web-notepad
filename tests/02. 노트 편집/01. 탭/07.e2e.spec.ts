import { expect, test } from "@playwright/test";

import { readStoredState } from "../../__util__";

test("7. 최초 진입은 탭이 없으며 플러스 버튼을 눌러야 첫 탭이 생성된다", async ({
  page,
}) => {
  await page.goto("/");
  const add = page.getByRole("button", { name: "New tab", exact: true });
  await expect(add).toBeVisible();
  await expect(page.locator(".initial-sync-lock")).toHaveCount(0);
  await expect(page.locator(".tab-item")).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveCount(0);
  const initial = await readStoredState(page);
  expect(initial.groups[0].tabs).toEqual([]);
  await add.click();
  await expect(page.locator(".tab-item")).toHaveCount(1);
  await expect(page.locator("textarea")).toHaveValue("");
  await page.locator("textarea").fill("Created by user");
  await expect(page.locator("textarea")).toHaveValue("Created by user");
  const created = await readStoredState(page);
  expect(created.groups[0].tabs).toHaveLength(1);
  expect(created.groups[0].tabs[0].content).toBe("Created by user");
});
