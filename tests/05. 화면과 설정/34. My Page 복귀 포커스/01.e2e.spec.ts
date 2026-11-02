import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { openEditor } from "../../__util__";
import { authenticateBrowser } from "../../__util__";

test("1. My Page에서 브라우저 뒤로가기로 돌아오면 에디터에 자동 포커스하지 않는다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await openEditor(page);
    await page.goto("/my-page");
    await expect(page.locator(".my-page")).toBeVisible();
    await page.goBack();

    const editor = page.locator(".note-area").first();
    await expect(editor).toBeVisible();
    await expect(editor).not.toBeFocused();
  }
});
