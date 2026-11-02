import { expect, test } from "@playwright/test";

import { STORAGE_KEY } from "../../__constant__";
import { openEditor } from "../../__util__";
import { addTabButton } from "../../__util__";

test("4. 노트 저장소 접근이 차단돼도 현재 세션에서 노트를 계속 편집한다", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(
    ({ key }) => {
      const getItem = Storage.prototype.getItem;
      const setItem = Storage.prototype.setItem;
      const removeItem = Storage.prototype.removeItem;
      Storage.prototype.getItem = function (name) {
        if (name === key)
          throw new DOMException("Storage blocked", "SecurityError");
        return getItem.call(this, name);
      };
      Storage.prototype.setItem = function (name, value) {
        if (name === key)
          throw new DOMException("Storage blocked", "SecurityError");
        return setItem.call(this, name, value);
      };
      Storage.prototype.removeItem = function (name) {
        if (name === key)
          throw new DOMException("Storage blocked", "SecurityError");
        return removeItem.call(this, name);
      };
    },
    { key: STORAGE_KEY },
  );
  await openEditor(page);

  const editor = page.locator("textarea");
  await expect(editor).toBeVisible();
  await editor.fill("memory-only note");
  await addTabButton(page).click();
  await expect(editor).toHaveValue("");
  await page.getByRole("tab", { name: "memory-only note" }).click();
  await expect(editor).toHaveValue("memory-only note");
  expect(pageErrors).toEqual([]);
});
