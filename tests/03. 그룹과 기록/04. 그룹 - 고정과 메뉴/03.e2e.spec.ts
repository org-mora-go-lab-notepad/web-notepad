import { expect, test } from "@playwright/test";

import {
  groupsCommand,
  readStoredState,
  seedSortableGroups,
} from "../../__util__";

test("3. Close All은 선택한 그룹의 열린 에디터 탭을 모두 닫는다", async ({
  page,
}) => {
  await seedSortableGroups(page);
  const original = (await readStoredState(page)).groups
    .find((group) => group.id === "zulu")!
    .tabs.find((tab) => tab.id === "tab-2")!;
  await groupsCommand(page).click();
  const row = page.locator('[data-group-id="zulu"]');
  await row.locator(".group-actions > button").click();
  await row.getByRole("button", { name: "Close All", exact: true }).click();

  const zulu = (await readStoredState(page)).groups.find(
    (group) => group.id === "zulu",
  );
  expect(zulu?.tabs.find((tab) => tab.id === "tab-2")?.open).toBe(false);
  expect(zulu?.tabs.find((tab) => tab.id === "tab-2")?.content).toBe(
    original.content,
  );
  expect(zulu?.tabs.filter((tab) => tab.open)).toHaveLength(0);
  expect(zulu?.tabs).toHaveLength(1);
});
