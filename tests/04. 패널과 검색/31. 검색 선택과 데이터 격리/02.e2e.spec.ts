import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import {
  openGlobalSearchPanel,
  readStoredState,
  seedSearchTabs,
} from "../../__util__";

test("2. 다른 그룹의 탭을 검색만 해서는 현재 그룹과 편집 탭을 변경하지 않는다", async ({
  page,
}) => {
  await seedSearchTabs(
    page,
    [createTabFixture("current", "Editor")],
    [
      createGroupFixture("work", "Work", [
        createTabFixture("target", "Find elsewhere"),
      ]),
    ],
  );
  await openGlobalSearchPanel(page);
  await page
    .getByRole("searchbox", { name: "Search tabs" })
    .fill("Find elsewhere");
  await expect(
    page.getByRole("button", { name: "Open tab Find elsewhere" }),
  ).toBeVisible();
  expect((await readStoredState(page)).activeGroupId).toBe("ungrouped");
  await expect(page.locator("textarea")).toHaveValue("Editor");
  await page.keyboard.press("Escape");
  await expect(page.locator("textarea")).toHaveValue("Editor");
  expect(
    (await readStoredState(page)).groups[0].tabs.map((tab) => tab.id),
  ).toEqual(["current"]);
});
