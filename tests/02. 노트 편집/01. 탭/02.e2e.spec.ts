import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { createGroupFixture, createTabFixture } from "../../__fixture__";
import {
  dashboardColumn,
  openAddTabCommand,
  openPanel,
  readStoredState,
  writeStoredState,
} from "../../__util__";

test("2. 새 탭은 현재 탭의 Note·Doing·Closed 상태를 이어받지 않고 To Do로 생성한다", async ({
  page,
}) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    for (const dashboardStatus of [
      "icebox",
      "in-progress",
      "closed",
    ] as const) {
      await writeStoredState(page, {
        groups: [
          createGroupFixture("ungrouped", "Ungrouped", [
            createTabFixture("tab-1", "Previous note", {
              tabColor: "teal",
              dashboardStatus:
                dashboardStatus === "in-progress" ? undefined : dashboardStatus,
            }),
          ]),
        ],
        settings: { tabColorCycle: ["red", "teal", "pink"] },
        nextTabNumber: 2,
      });
      await (await openAddTabCommand(page)).click();
      await expect(page.locator(".tab-item")).toHaveCount(2);
      const saved = await readStoredState(page);
      const newTab = saved.groups[0].tabs.find((tab) => tab.id === "tab-2")!;
      expect(newTab.tabColor).toBe("red");
      expect(newTab.dashboardStatus).toBe("todo");
      await page.locator("textarea:visible").fill("New ready note");
      await openPanel(page, "dashboard-panel");
      await expect(
        dashboardColumn(page, "todo").locator(".dashboard-card"),
      ).toContainText("New ready note");
    }
  }
});
