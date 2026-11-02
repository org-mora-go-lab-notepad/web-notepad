import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { lineButtons } from "../../__util__";
import { WRAPPED_NOTE as content } from "./__constant__";
import { countWrappedLines } from "./__util__";

test("1. 자동 줄바꿈된 표시 줄 수에 맞춰 연속된 LINE 번호를 표시한다", async ({
  page,
}) => {
  await openEditor(page);
  const editor = page.locator("textarea").first();
  const lines = lineButtons(page);
  const numbers = (count: number) =>
    Array.from({ length: count }, (_, index) =>
      String(index + 1).padStart(2, "0"),
    );

  await editor.fill(content);
  await expect.poll(() => lines.count()).toBe(await countWrappedLines(editor));
  const desktopCount = await lines.count();
  expect(desktopCount).toBeGreaterThan(3);
  await expect(lines).toHaveText(numbers(desktopCount));

  await expect(lines).toHaveText(numbers(desktopCount));
});
