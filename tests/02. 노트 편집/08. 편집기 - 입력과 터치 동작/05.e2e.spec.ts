import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";

test("5. Shift+Tab은 탭 들여쓰기를 제거하고 없으면 역방향으로 포커스를 이동한다", async ({
  page,
}) => {
  await openEditor(page);
  const editor = page.locator(".note-area");
  await editor.fill("\tfirst\n\tsecond");
  await editor.focus();
  await editor.evaluate((element: HTMLTextAreaElement) =>
    element.setSelectionRange(0, element.value.length),
  );

  await page.keyboard.press("Shift+Tab");
  await expect(editor).toHaveValue("first\nsecond");
  await expect(editor).toBeFocused();
  expect(
    await editor.evaluate((element: HTMLTextAreaElement) => [
      element.selectionStart,
      element.selectionEnd,
    ]),
  ).toEqual([0, 12]);

  await editor.fill("ab");
  await editor.press("End");
  await page.keyboard.press("Tab");
  await expect(editor).toHaveValue("ab\t");
  await page.keyboard.press("Shift+Tab");
  await expect(editor).toHaveValue("ab");
  await expect(editor).toBeFocused();

  await page.keyboard.press("Shift+Tab");

  await expect(editor).toHaveValue("ab");
  await expect(editor).not.toBeFocused();
  await expect(page.locator('.line-rail [role="button"]').last()).toBeFocused();
});
