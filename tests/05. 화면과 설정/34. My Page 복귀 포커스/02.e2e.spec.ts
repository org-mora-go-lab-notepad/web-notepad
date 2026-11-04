import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { closeMobileEditor, openEditor } from "../../__util__";
import { authenticateBrowser } from "../../__util__";

test("2. My Page의 메모로 돌아가기 링크를 누르면 에디터에 자동 포커스하지 않는다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await openEditor(page);
    await closeMobileEditor(page);
    await expect(page.locator("button.auth-command")).toBeVisible();
    await page.locator("button.auth-command").click();
    await page.getByRole("menuitem", { name: "My Page" }).click();
    await expect(page).toHaveURL(/\/my-page$/);
    await page.getByRole("link", { name: "Back" }).click();

    const editor = page.locator(".note-area").first();
    if (viewport.width <= 512) {
      await expect(editor).not.toBeVisible();
      await expect(page.locator("#dashboard-panel")).toBeVisible();
    } else await expect(editor).toBeVisible();
    await expect(editor).not.toBeFocused();
  }
});
