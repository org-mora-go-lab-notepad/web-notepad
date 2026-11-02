import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { lineButtons } from "../../__util__";
import { WRAPPED_NOTE as content } from "./__constant__";
import { countWrappedLines } from "./__util__";

test("2. 편집 내용을 바꾸면 새 자동 줄바꿈 결과에 맞춰 LINE 번호를 갱신한다", async ({
  page,
}) => {
  await openEditor(page);
  const editor = page.locator("textarea");
  const lines = lineButtons(page);
  await editor.fill(content);
  await expect.poll(() => lines.count()).toBe(await countWrappedLines(editor));
  const wrappedCount = await lines.count();

  await editor.fill("첫 줄\n둘째 줄");
  await expect(lines).toHaveText(["01", "02"]);
  await editor.fill(content);
  await expect(lines).toHaveCount(wrappedCount);
});
