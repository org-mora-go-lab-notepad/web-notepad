import { expect, test } from "@playwright/test";

import {
  dashboardColumn,
  moveDashboardCard,
  readActiveGroup,
  seedStatusIntegrity,
} from "../../__util__";

test("2. 상태 이동은 사용자 지정 색상 주기의 대상 색상을 사용한다", async ({
  page,
}) => {
  await seedStatusIntegrity(
    page,
    { dashboardStatus: "icebox" },
    {},
    {
      settings: {
        tabColorCycleVersion: 2,
        tabColorCycle: ["red", "purple", "pink"],
      },
    },
  );
  await moveDashboardCard(page, "in-progress");
  const tab = (await readActiveGroup(page)).tabs[0];
  expect(tab.tabColor).toBe("pink");
  expect(tab.dashboardStatus).toBe("in-progress");
  await expect(
    dashboardColumn(page, "in-progress").locator(".dashboard-card", {
      hasText: "Integrity task",
    }),
  ).toBeVisible();
});
