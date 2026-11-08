import { expect, test } from "@playwright/test";

import {
  moveDashboardCard,
  readActiveGroup,
  seedStatusIntegrity,
} from "../../__util__";

test("2. 보조 상태에서 일반 상태로 이동해도 고정된 노트는 고정을 유지한다", async ({
  page,
}) => {
  await seedStatusIntegrity(page, { dashboardStatus: "icebox", pinned: true });
  await moveDashboardCard(page, "done");
  expect((await readActiveGroup(page)).tabs[0]).toMatchObject({
    pinned: true,
    tabColor: "teal",
    open: true,
  });
  await expect(page.locator(".tab-item").first()).not.toHaveClass(/is-pinned/);
});
