import { test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton, expectSelectedLines, lineButtons } from "../../__util__";

test("4. 줄 선택을 노트별로 저장하고 탭 전환 후 각각 복원한다", async ({
  page,
}) => {
  await openEditor(page);
  const editor = page.locator("textarea");
  const lines = lineButtons(page);
  await editor.fill("one\ntwo\nthree");
  await lines.nth(1).click();
  await lines.nth(2).click();
  await addTabButton(page).click();
  await editor.fill("other\nnote");
  await expectSelectedLines(page, [false]);
  await lines.first().click();
  await page.locator('[role="tab"]').first().click();
  await expectSelectedLines(page, [false, true, true]);
  await page.locator('[role="tab"]').nth(1).click();
  await expectSelectedLines(page, [true, false]);
});
