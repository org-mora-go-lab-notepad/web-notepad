import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton } from "../../__util__";

test("2. 각 탭의 실행 취소 기록을 독립적으로 유지한다", async ({ page }) => {
  await openEditor(page);
  const editor = page.locator("textarea");
  await editor.fill("tab A");
  const firstTab = page.locator(".tab-item").filter({ hasText: "tab A" });

  await addTabButton(page).click();
  await editor.fill("tab B");
  const secondTab = page.locator(".tab-item").filter({ hasText: "tab B" });

  await firstTab.locator('[role="tab"]').click();
  await editor.focus();
  await page.keyboard.press("Meta+z");
  await expect(editor).toHaveValue("");

  await secondTab.locator('[role="tab"]').click();
  await expect(editor).toHaveValue("tab B");
  await editor.focus();
  await page.keyboard.press("Meta+z");
  await expect(editor).toHaveValue("");
});
