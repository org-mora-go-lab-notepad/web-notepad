import { expect, test } from "@playwright/test";

import { DESKTOP_VIEWPORT, MOBILE_VIEWPORT } from "../../__constant__";
import { ensureEditorTab, openEditor } from "../../__util__";
import {
  expectSelectedLines,
  lineButtons,
  readActiveGroup,
} from "../../__util__";
import { WRAPPED_NOTE as content } from "./__constant__";
import { countWrappedLines } from "./__util__";

test("5. 반응형 재줄바꿈 후에도 개행 기준 선택과 원본 줄 강조를 유지한다", async ({
  page,
}) => {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await openEditor(page);
  const editor = page.locator("textarea:visible").first();
  const lines = lineButtons(page);
  await editor.fill(content);
  await expect.poll(() => lines.count()).toBe(await countWrappedLines(editor));
  const mobileCount = await lines.count();
  const selectedMobileLines = mobileCount - 2;
  await lines.first().click();
  await expectSelectedLines(page, [
    ...Array(selectedMobileLines).fill(true),
    false,
  ]);

  const storedSelection = async () => {
    const group = await readActiveGroup(page);
    return group.tabs.find((tab) => tab.id === group.activeTabId)!
      .selectedLines;
  };
  await expect.poll(storedSelection).toHaveLength(1);
  const selection = await storedSelection();

  await page.setViewportSize(DESKTOP_VIEWPORT);
  await expect.poll(() => lines.count()).toBe(await countWrappedLines(editor));
  const desktopCount = await lines.count();
  expect(desktopCount).toBeLessThan(mobileCount);
  await expectSelectedLines(page, [
    ...Array(desktopCount - 2).fill(true),
    false,
  ]);
  expect(await storedSelection()).toEqual(selection);

  await page.setViewportSize(MOBILE_VIEWPORT);
  await ensureEditorTab(page);
  await expect(lines).toHaveCount(mobileCount);
  await expectSelectedLines(page, [
    ...Array(selectedMobileLines).fill(true),
    false,
  ]);
  expect(await storedSelection()).toEqual(selection);
});
