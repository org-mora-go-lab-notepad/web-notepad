import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";

test("3. 커서가 편집기 높이를 넘어가면 편집기와 줄 번호 영역을 함께 스크롤한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 360 });
  await openEditor(page);
  const editor = page.locator("textarea");
  const longNote = Array.from(
    { length: 40 },
    (_, index) => `line ${index + 1}`,
  ).join("\n");
  await editor.fill(longNote);
  await editor.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    textarea.closest<HTMLElement>(".note-editor")!.scrollTop = 0;
  });
  await page.keyboard.press("Enter");

  await expect
    .poll(() =>
      editor.evaluate(
        (element) => element.closest<HTMLElement>(".note-editor")!.scrollTop,
      ),
    )
    .toBeGreaterThan(0);
  await expect(page.locator(".line-rail")).toHaveCSS("overflow", "visible");
  await expect
    .poll(() =>
      editor.evaluate((element) => {
        const textarea = element as HTMLTextAreaElement;
        const style = getComputedStyle(textarea);
        const lineHeight = Number.parseFloat(style.lineHeight);
        const paddingTop = Number.parseFloat(style.paddingTop);
        const paddingBottom = Number.parseFloat(style.paddingBottom);
        const scroller = textarea.closest<HTMLElement>(".note-editor")!;
        const caretLine =
          textarea.value.slice(0, textarea.selectionStart).split("\n").length -
          1;
        const caretTop = paddingTop + caretLine * lineHeight;
        const caretBottom = caretTop + lineHeight;
        return (
          caretTop >= scroller.scrollTop + paddingTop - 1 &&
          caretBottom <=
            scroller.scrollTop + scroller.clientHeight - paddingBottom + 1
        );
      }),
    )
    .toBe(true);
});
