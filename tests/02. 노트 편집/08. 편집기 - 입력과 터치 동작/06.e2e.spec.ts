import { expect, test } from "@playwright/test";

import { MOBILE_VIEWPORT } from "../../__constant__";
import { openEditor } from "../../__util__";

test("6. 편집기를 한 번 터치하면 브라우저가 정한 접힌 커서 위치를 유지한다", async ({
  browser,
}) => {
  const page = await browser.newPage({
    hasTouch: true,
    isMobile: true,
    viewport: MOBILE_VIEWPORT,
  });
  try {
    const content = "First line\nSecond line\nThird line";
    await openEditor(page);
    const editor = page.locator("textarea:visible");
    await editor.fill(content);
    await editor.tap({ position: { x: 25, y: 20 } });
    await expect(editor).toBeFocused();
    await editor.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );

    const selection = await editor.evaluate((element: HTMLTextAreaElement) => ({
      start: element.selectionStart,
      end: element.selectionEnd,
    }));
    expect(selection.start).toBe(selection.end);
    expect(selection.end).toBeLessThan(content.length);
    await expect(editor).toHaveValue(content);
  } finally {
    await page.close();
  }
});
