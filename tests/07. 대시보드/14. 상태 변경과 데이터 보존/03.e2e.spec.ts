import { expect, test } from "@playwright/test";

import {
  moveDashboardCard,
  readActiveGroup,
  seedStatusIntegrity,
} from "../../__util__";

test("3. 편집기에서 숨긴 Closed 카드를 다른 상태로 옮겨도 자동으로 열지 않는다", async ({
  page,
}) => {
  await seedStatusIntegrity(
    page,
    { open: false, dashboardStatus: "done" },
    { activeTabId: "tab-2" },
  );
  await moveDashboardCard(page, "todo");
  const tab = (await readActiveGroup(page)).tabs[0];
  expect(tab.open).toBe(false);
  expect(tab.dashboardStatus).toBe("todo");
  await expect(page.locator("textarea")).toHaveValue("Sibling task");
  await expect(
    page.getByRole("tab", { name: "Integrity task", exact: true }),
  ).toHaveCount(0);
});
