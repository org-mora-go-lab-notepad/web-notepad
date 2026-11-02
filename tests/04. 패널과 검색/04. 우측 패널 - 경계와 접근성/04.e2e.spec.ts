import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { openPanel } from "../../__util__";

test("4. 고정 패널은 배경 덮개·그림자·경계 음영 없이 편집기를 계속 사용할 수 있다", async ({
  page,
}) => {
  await openEditor(page);
  await openPanel(page, "dashboard-panel");
  const panel = page.locator("#dashboard-panel");
  await expect(panel).toHaveCSS("box-shadow", "none");
  expect(
    await panel.evaluate(
      (element) => getComputedStyle(element, "::before").content,
    ),
  ).toBe("none");
  // The workspace stays usable: no backdrop covers it while the panel is pinned.
  await expect(page.locator(".dashboard .side-panel-backdrop")).toBeHidden();
  await page.locator(".note-area").click();
  await page.keyboard.type("typed while pinned");
  await expect(page.locator(".note-area")).toHaveValue("typed while pinned");
  await expect(panel).toHaveAttribute("aria-hidden", "false");
});
