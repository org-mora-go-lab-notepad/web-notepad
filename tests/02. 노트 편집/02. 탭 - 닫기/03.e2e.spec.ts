import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton, readStoredState } from "../../__util__";

test("3. 내용이 있는 탭을 닫으면 상태를 유지한 채 에디터에서만 숨긴다", async ({
  page,
}) => {
  await openEditor(page);
  const tabs = page.locator(".tab-item");
  await page.locator("textarea").fill("12345678901");
  await addTabButton(page).click();

  await tabs.first().locator(".tab-close").click();
  await expect(tabs).toHaveCount(1);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect
    .poll(async () => {
      const state = await readStoredState(page);
      const hiddenTab = state.groups[0].tabs.find(
        (tab) => tab.content === "12345678901",
      );
      return {
        open: hiddenTab?.open,
        status: hiddenTab?.tabColor,
        closedCount: state.closedTabs?.length,
      };
    })
    .toEqual({ open: false, status: "gray", closedCount: 0 });
});
