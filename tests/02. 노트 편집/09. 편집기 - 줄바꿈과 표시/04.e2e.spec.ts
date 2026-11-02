import { expect, test } from "@playwright/test";

import { MOBILE_VIEWPORT } from "../../__constant__";
import { openEditor } from "../../__util__";
import { expectSelectedLines, lineButtons } from "../../__util__";
import { WRAPPED_NOTE as content } from "./__constant__";
import { countWrappedLines } from "./__util__";

test("4. 자동 줄바꿈된 번호를 선택하면 원본 줄의 모든 표시 줄을 강조한다", async ({
  page,
}) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await openEditor(page);
  const editor = page.locator("textarea").first();
  const lines = lineButtons(page);
  await editor.fill(content);
  await expect.poll(() => lines.count()).toBe(await countWrappedLines(editor));
  const firstSourceLineCount = (await lines.count()) - 2;
  expect(firstSourceLineCount).toBeGreaterThan(1);

  await lines.first().click();
  await expectSelectedLines(page, [
    ...Array(firstSourceLineCount).fill(true),
    false,
  ]);
  const expectedSize = await editor.evaluate((element, count) => {
    const style = getComputedStyle(element);
    return `100% ${Number((count * Number.parseFloat(style.lineHeight) + Number.parseFloat(style.paddingTop)).toFixed(3))}px`;
  }, firstSourceLineCount);
  await expect(editor).toHaveCSS("background-size", expectedSize);
});
