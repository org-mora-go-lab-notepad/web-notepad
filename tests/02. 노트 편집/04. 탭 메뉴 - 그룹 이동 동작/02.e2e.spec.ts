import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import {
  activeTabItem,
  ensureEditorTab,
  readStoredState,
  seedMoveGroupState,
  switchGroup,
} from "../../__util__";
import { moveTabToTarget } from "./__util__";

test("2. 그룹 이동 후 현재 그룹 화면을 유지하고 대상 그룹에서 옮긴 탭을 왼쪽 활성 탭으로 지정한다", async ({
  page,
}) => {
  const editor = page.locator("textarea:visible");
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await seedMoveGroupState(page, { splitSource: true, sourceRight: false });
    await moveTabToTarget(page, viewport);
    await ensureEditorTab(page);
    await expect(editor).toHaveValue("Keep source note");

    const moved = await readStoredState(page);
    expect(moved.activeGroupId).toBe("ungrouped");
    expect(moved.groups[1].activeTabId).toBe("tab-1");
    expect(moved.groups[1].activePane).toBe("left");
    expect(moved.groups[1].rightTabIds).not.toContain("tab-1");

    await switchGroup(page, "Target");
    await ensureEditorTab(page);
    await expect(activeTabItem(page)).toHaveCount(1);
    await expect(editor).toHaveValue("Move me\nselected line");
  }
});
