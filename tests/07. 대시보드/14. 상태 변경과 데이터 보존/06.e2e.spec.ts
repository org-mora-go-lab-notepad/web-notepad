import { expect, test } from "@playwright/test";

import {
  moveDashboardCard,
  readStoredState,
  seedStatusIntegrity,
} from "../../__util__";

test("6. 전체 그룹에서 카드 상태를 바꿔도 원본 그룹과 다른 그룹의 소유권을 유지한다", async ({
  page,
}) => {
  await seedStatusIntegrity(page, {}, {}, { activeGroupId: "all-group" });
  await moveDashboardCard(page, "in-progress");
  const state = await readStoredState(page);
  expect(
    state.groups.find((group) => group.id === "ungrouped")?.tabs[0].tabColor,
  ).toBe("indigo");
  expect(
    state.groups
      .find((group) => group.id === "work")
      ?.tabs.map((tab) => ({ id: tab.id, tabColor: tab.tabColor })),
  ).toEqual([{ id: "tab-3", tabColor: "gray" }]);
  expect(state.activeGroupId).toBe("all-group");
});
