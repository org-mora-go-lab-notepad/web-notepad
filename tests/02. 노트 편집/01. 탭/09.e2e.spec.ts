import { expect, test } from "@playwright/test";

import { readStoredState } from "../../__util__";

test.use({
  isMobile: true,
  hasTouch: true,
  viewport: { width: 390, height: 844 },
});

test("9. 모바일에서 모든 탭이 닫힌 에디터를 터치하면 새 탭 하나를 생성한다", async ({
  page,
}) => {
  await page.goto("/");
  const surface = page.getByRole("button", {
    name: "Create a tab in the empty editor",
    exact: true,
  });
  await expect(page.locator(".initial-sync-lock")).toHaveCount(0);
  await expect(surface).toBeVisible();
  await expect(page.locator(".tab-item")).toHaveCount(0);
  await surface.tap();
  await expect(page.locator(".tab-item")).toHaveCount(1);
  const editor = page.locator("textarea");
  await expect(editor).toHaveValue("");
  await expect(surface).toHaveCount(0);
  await editor.tap();
  await editor.fill("Mobile created note");
  await editor.tap();
  await expect(page.locator(".tab-item")).toHaveCount(1);
  const state = await readStoredState(page);
  expect(state.groups[0].tabs).toHaveLength(1);
  expect(state.groups[0].tabs[0].content).toBe("Mobile created note");
});
