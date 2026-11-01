import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { dashboardColumn, openPanel, writeStoredState } from "../../__util__";

test("5. 완료 상태 변경에 따라 PC와 모바일 탭 헤더의 취소선을 전환한다", async ({
  page,
}) => {
  await writeStoredState(page, {
    activeGroupId: "ungrouped",
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", [
        createTabFixture("done-title", "Complete this note", {
          dashboardStatus: "todo",
          tabColor: "gray",
        }),
      ]),
    ],
  });
  const title = page.locator(".tab-item .tab-title");
  await expect(title).toHaveCSS("text-decoration-line", "none");
  await openPanel(page, "dashboard-panel");
  await dashboardColumn(page, "todo")
    .locator(".dashboard-card")
    .dragTo(dashboardColumn(page, "done"));
  await expect(title).toHaveCSS("text-decoration-line", "line-through");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(title).toHaveCSS("text-decoration-line", "line-through");
  await expect(page.locator("textarea").first()).toHaveCSS(
    "text-decoration-line",
    "none",
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await dashboardColumn(page, "done")
    .locator(".dashboard-card")
    .dragTo(dashboardColumn(page, "todo"));
  await expect(title).toHaveCSS("text-decoration-line", "none");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(title).toHaveCSS("text-decoration-line", "none");
});
