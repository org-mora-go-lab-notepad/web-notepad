import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { createGroupFixture, createTabFixture } from "../../__fixture__";
import {
  openTabMenu,
  readStoredState,
  switchGroup,
  writeStoredState,
} from "../../__util__";

test("1. PC와 모바일 탭 메뉴에 Move Group을 표시하고 현재 그룹을 제외한 목록을 연다", async ({
  page,
}) => {
  const moveGroup = page.getByRole("menuitem", {
    name: "Move Group",
    exact: true,
  });
  const menu = page.getByRole("menu", { name: "Move Group", exact: true });
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await writeStoredState(page, {
      activeGroupId: "work",
      groups: [
        createGroupFixture("ungrouped", "Ungrouped", [
          createTabFixture("ungrouped-tab", "Ungrouped note"),
        ]),
        createGroupFixture("work", "Work", [
          createTabFixture("work-tab", "Work note"),
        ]),
        createGroupFixture("target", "Target", [
          createTabFixture("target-tab", "Target note"),
        ]),
      ],
    });
    await switchGroup(page, "All Group");
    const workTab =
      viewport.width <= 512
        ? page.locator(
            '.dashboard-card[data-tab-id="work-tab"] .dashboard-card-open',
          )
        : page.locator(".tab-title").filter({ hasText: "Work note" });
    await openTabMenu(workTab, viewport);
    await expect(moveGroup).toBeVisible();
    await expect(moveGroup).toBeEnabled();
    await moveGroup.click();
    const ungroupedOption = menu.getByRole("menuitem", {
      name: "Ungrouped",
      exact: true,
    });
    await expect(menu).toBeVisible();
    await expect(ungroupedOption).toHaveCount(0);
    const targetOption = menu.getByRole("menuitem", {
      name: "Target",
      exact: true,
    });
    await expect(targetOption).toBeFocused();
    await expect(
      menu.getByRole("menuitem", { name: "Work", exact: true }),
    ).toHaveCount(0);
    await targetOption.click();
    const groups = (await readStoredState(page)).groups;
    expect(
      groups
        .find((group) => group.id === "target")
        ?.tabs.some((tab) => tab.id === "work-tab"),
    ).toBe(true);
  }
});
