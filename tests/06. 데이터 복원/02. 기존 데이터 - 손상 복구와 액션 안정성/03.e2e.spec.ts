import { expect, test } from "@playwright/test";

import { readStoredState } from "../../__util__";
import { seedRecoveryCollision } from "./__util__";

test("3. 빈 그룹 복구 탭 ID는 다른 그룹 탭과 북마크 원본 ID를 재사용하지 않는다", async ({
  page,
}) => {
  await seedRecoveryCollision(page);
  await expect(page.locator("textarea")).toHaveCount(0);
  await page
    .getByRole("button", { name: "New tab", exact: true })
    .first()
    .click();
  await page.locator("textarea").fill("Recovered workspace");
  await expect
    .poll(async () => {
      const tab = (await readStoredState(page)).groups.find(
        (group) => group.id === "ungrouped",
      )?.tabs[0];
      return (
        tab?.content === "Recovered workspace" &&
        !["tab-1", "tab-2", "tab-3"].includes(tab.id)
      );
    })
    .toBe(true);

  const state = await readStoredState(page);
  const tabs = state.groups.flatMap((group) => group.tabs);
  const reservedIds = new Set([
    ...tabs.map((tab) => tab.id),
    ...state.groups.flatMap((group) =>
      group.bookmarks.map((bookmark) => bookmark.sourceTabId),
    ),
  ]);
  expect(reservedIds.size).toBe(
    tabs.length + state.groups.flatMap((group) => group.bookmarks).length,
  );
});
