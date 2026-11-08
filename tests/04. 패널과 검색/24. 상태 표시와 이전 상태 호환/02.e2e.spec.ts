import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import {
  dashboardColumn,
  openPanel,
  readActiveGroup,
  writeStoredState,
} from "../../__util__";
test("2. 이전 closed 메모는 내용과 열린 상태를 보존하며 종료 컬럼에 표시한다", async ({
  page,
}) => {
  await writeStoredState(page, {
    activeGroupId: "ungrouped",
    settings: { tabColorCycle: ["gray", "orange", "purple"] },
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", [
        createTabFixture("legacy", "Legacy note\nKeep body", {
          dashboardStatus: "closed",
          tabColor: "gray",
        }),
      ]),
    ],
  });
  await openPanel(page, "dashboard-panel");
  await expect(
    dashboardColumn(page, "done").locator(".dashboard-card"),
  ).toContainText("Legacy note");
  expect((await readActiveGroup(page)).tabs[0]).toMatchObject({
    content: "Legacy note\nKeep body",
    dashboardStatus: "done",
    tabColor: "purple",
    open: true,
  });
  await expect(page.locator(".tab-title").first()).toHaveCSS(
    "text-decoration-line",
    "line-through",
  );
  await page.reload();
  await expect(page.locator("textarea").first()).toHaveValue(
    "Legacy note\nKeep body",
  );
});
