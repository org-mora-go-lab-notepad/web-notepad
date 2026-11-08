import { expect, test } from "@playwright/test";

import {
  moveDashboardCard,
  readActiveGroup,
  seedStatusIntegrity,
} from "../../__util__";

test("1. 분할 영역에 있는 카드 상태를 바꾸어도 분할 배치를 유지한다", async ({
  page,
}) => {
  await seedStatusIntegrity(
    page,
    {},
    { rightTabIds: ["tab-2"], activeRightTabId: "tab-2", activePane: "right" },
  );
  await moveDashboardCard(page, "in-progress");
  const group = await readActiveGroup(page);
  expect(group.rightTabIds).toEqual(["tab-2"]);
  expect(group.activeRightTabId).toBe("tab-2");
  expect(group.activePane).toBe("right");
  await expect(page.locator("textarea")).toHaveCount(2);
});
