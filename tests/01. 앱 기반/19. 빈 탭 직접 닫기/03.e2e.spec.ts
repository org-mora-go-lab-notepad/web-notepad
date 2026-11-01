import { expect, test } from "@playwright/test";

import { readStoredState } from "../../__util__";

test("3. 공백이나 두 글자라도 내용이 남아 있으면 직접 닫아도 보존한다", async ({
  page,
}) => {
  await page.goto("/");
  const editor = page.locator("textarea").first();
  await editor.fill("ㅎㅎ");
  await page.locator(".tab-item").first().locator(".tab-close").click();
  await editor.fill(" ");
  await page.locator(".tab-item").first().locator(".tab-close").click();
  await expect
    .poll(async () => {
      const state = await readStoredState(page);
      return state.groups[0].tabs
        .filter((tab) => !tab.open)
        .map((tab) => tab.content);
    })
    .toEqual(["ㅎㅎ", " "]);
  await page.reload();
  const state = await readStoredState(page);
  expect(
    state.groups[0].tabs.filter((tab) => !tab.open).map((tab) => tab.content),
  ).toEqual(["ㅎㅎ", " "]);
  await expect(editor).toBeVisible();
  expect(state.closedTabs).toHaveLength(0);
});
