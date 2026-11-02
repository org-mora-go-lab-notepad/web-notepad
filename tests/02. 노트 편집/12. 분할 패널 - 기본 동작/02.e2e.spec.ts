import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton } from "../../__util__";
import { dragTabToZone, paneSlot } from "../__util__";

test("2. 탭을 Split right 영역에 드롭해 좌우 분할 화면을 만든다", async ({
  page,
}) => {
  await openEditor(page);
  await page.locator("textarea").fill("first");
  await addTabButton(page).click();
  await page.locator("textarea").fill("second");

  const tab = page.locator(".tab-item").filter({ hasText: /^first$/ });
  await dragTabToZone(page, tab, paneSlot(page, "left"), "Split right");
  await expect(page.locator(".pane-slot")).toHaveCount(2);
  await expect(paneSlot(page, "right").locator("textarea")).toHaveValue(
    "first",
  );
});
