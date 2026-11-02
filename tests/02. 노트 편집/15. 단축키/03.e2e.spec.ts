import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { addTabButton, readActiveGroup } from "../../__util__";
import { dragTabToZone, paneSlot } from "../__util__";

test("3. 분할 상태의 Alt+위아래 화살표는 패널 경계를 넘어 이동한다", async ({
  page,
}) => {
  await openEditor(page);
  const editor = page.locator("textarea");
  await editor.fill("first note");
  await addTabButton(page).click();
  await editor.fill("right note");
  await dragTabToZone(
    page,
    page.getByRole("tab", { selected: true }).locator(".tab-title"),
    paneSlot(page, "left"),
    "Split right",
  );

  const readActive = async () => {
    const group = await readActiveGroup(page);
    const activeId =
      group.activePane === "right" ? group.activeRightTabId : group.activeTabId;
    return {
      pane: group.activePane,
      content: group.tabs.find((tab) => tab.id === activeId)!.content,
    };
  };
  await expect
    .poll(readActive)
    .toEqual({ pane: "right", content: "right note" });
  await page.keyboard.press("Alt+ArrowUp");
  await expect
    .poll(readActive)
    .toEqual({ pane: "left", content: "first note" });
  await page.keyboard.press("Alt+ArrowDown");
  await expect
    .poll(readActive)
    .toEqual({ pane: "right", content: "right note" });
});
