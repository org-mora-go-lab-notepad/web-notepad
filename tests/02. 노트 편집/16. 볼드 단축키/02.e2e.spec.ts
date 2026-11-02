import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";

test("2. 선택 없는 Cmd+B는 빈 굵게 표식을 토글한다", async ({ page }) => {
  await openEditor(page);
  const editor = page.locator("textarea");
  await editor.fill("note ");
  await editor.press("End");

  await editor.press("Meta+b");
  await expect(editor).toHaveValue("note ****");
  await expect
    .poll(() =>
      editor.evaluate((element) => {
        const textarea = element as HTMLTextAreaElement;
        return [textarea.selectionStart, textarea.selectionEnd];
      }),
    )
    .toEqual([7, 7]);
  await editor.press("Meta+b");
  await expect(editor).toHaveValue("note ");
});
