import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import {
  openAddTabCommand,
  readStoredState,
  seedMoveGroupState,
} from "../../__util__";
import { moveTabToTarget } from "./__util__";

test("3. 원래 그룹의 마지막 탭을 이동하면 자동 생성 없이 새 탭 버튼만 남는다", async ({
  page,
}) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await seedMoveGroupState(page);
    await moveTabToTarget(page, viewport);
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(page.locator("textarea:visible")).toHaveCount(0);
    await expect(await openAddTabCommand(page)).toBeVisible();

    const [source] = (await readStoredState(page)).groups;
    expect(source.tabs).toHaveLength(0);
    expect(source.activeTabId).toBe("");
  }
});
