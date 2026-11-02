import { expect, test } from "@playwright/test";

import { STORAGE_KEY } from "../../__constant__";
import { openEditor } from "../../__util__";
import { readStoredState } from "../../__util__";

test("3. 손상된 노트 저장값을 기본 작업공간으로 복구하고 정상 상태를 다시 저장한다", async ({
  page,
}) => {
  await page.addInitScript(
    ({ key }) => localStorage.setItem(key, "{broken-json"),
    { key: STORAGE_KEY },
  );
  await openEditor(page);

  const editor = page.locator("textarea");
  await expect(editor).toBeVisible();
  await expect(editor).toHaveValue("");

  await editor.fill("recovered note");
  await expect
    .poll(async () => (await readStoredState(page)).groups[0].tabs[0].content)
    .toBe("recovered note");
});
