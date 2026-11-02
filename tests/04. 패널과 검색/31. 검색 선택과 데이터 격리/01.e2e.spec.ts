import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import {
  openGlobalSearchPanel,
  readStoredState,
  seedSearchTabs,
} from "../../__util__";

test("1. 서로 다른 그룹의 같은 제목 탭은 선택한 원문을 연다", async ({
  page,
}) => {
  await seedSearchTabs(
    page,
    [createTabFixture("alpha", "Shared note\nFirst body")],
    [
      createGroupFixture("work", "Work", [
        createTabFixture("beta", "Shared note\nSecond body"),
      ]),
    ],
  );
  await openGlobalSearchPanel(page);
  await page
    .getByRole("searchbox", { name: "Search tabs" })
    .fill("Shared note");
  await expect(page.locator(".global-search-result")).toHaveCount(2);
  const workResult = page
    .locator(".global-search-result")
    .filter({ hasText: "Second body" });
  await expect(
    workResult.locator(".global-search-result-category"),
  ).toContainText("Work");
  await workResult.click();
  await expect(page.locator("textarea")).toHaveValue(
    "Shared note\nSecond body",
  );
  expect((await readStoredState(page)).activeGroupId).toBe("work");
});
