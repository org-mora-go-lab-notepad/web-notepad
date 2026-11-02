import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton } from "../../__util__";

test("3. 드래그로 탭 순서를 바꿀 수 있다", async ({ page }) => {
  await openEditor(page);
  const editor = page.locator("textarea");
  await editor.fill("first");
  await addTabButton(page).click();
  await editor.fill("second");
  await addTabButton(page).click();
  await editor.fill("third");

  const tabs = page.locator(".tab-item");
  await expect(tabs.locator(".tab-title")).toHaveText([
    "first",
    "second",
    "third",
  ]);
  await tabs
    .nth(0)
    .locator(".tab-title")
    .dragTo(tabs.nth(2).locator(".tab-title"));
  await expect(tabs.locator(".tab-title")).toHaveText([
    "second",
    "third",
    "first",
  ]);
});
