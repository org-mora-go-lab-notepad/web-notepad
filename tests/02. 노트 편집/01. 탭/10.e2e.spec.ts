import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { readStoredState, seedStoredStateOnLoad } from "../../__util__";

test("10. 분할 에디터에 빈 탭이 열려 있어도 영역 클릭으로 추가 탭을 생성하지 않는다", async ({
  page,
}) => {
  await seedStoredStateOnLoad(page, {
    activeGroupId: "ungrouped",
    groups: [
      createGroupFixture(
        "ungrouped",
        "Ungrouped",
        [
          createTabFixture("left", ""),
          createTabFixture("right", "Existing note"),
        ],
        { rightTabIds: ["right"], activeRightTabId: "right" },
      ),
    ],
  });
  await expect(page.locator(".initial-sync-lock")).toHaveCount(0);
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await expect(page.locator("textarea")).toHaveCount(2);
    await expect(page.locator(".empty-editor")).toHaveCount(0);
    await page.locator("textarea").nth(0).click();
    await page.locator("textarea").nth(1).click();
    await expect(page.locator(".tab-item")).toHaveCount(2);
    const state = await readStoredState(page);
    expect(state.groups[0].tabs.map((tab) => tab.id)).toEqual([
      "left",
      "right",
    ]);
    expect(state.groups[0].tabs.map((tab) => tab.content)).toEqual([
      "",
      "Existing note",
    ]);
  }
});
