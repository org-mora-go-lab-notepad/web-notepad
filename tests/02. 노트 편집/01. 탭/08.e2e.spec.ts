import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { readStoredState, seedStoredStateOnLoad } from "../../__util__";

test("8. PC에서 모든 탭이 닫힌 에디터를 클릭하면 플러스와 같이 한 탭만 생성한다", async ({
  page,
}) => {
  await seedStoredStateOnLoad(page, {
    activeGroupId: "ungrouped",
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", [
        createTabFixture("closed-original", "Preserve closed note", {
          open: false,
          tabColor: "gray",
        }),
      ]),
    ],
  });
  const surface = page.getByRole("button", {
    name: "Create a tab in the empty editor",
    exact: true,
  });
  await expect(page.locator(".initial-sync-lock")).toHaveCount(0);
  await expect(page.locator(".tab-item")).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveCount(0);
  await expect(surface).toBeVisible();
  const bounds = (await surface.boundingBox())!;
  expect(bounds.height).toBeGreaterThan(100);
  await surface.dblclick();
  await expect(page.locator(".tab-item")).toHaveCount(1);
  await expect(page.locator("textarea")).toHaveValue("");
  await expect(surface).toHaveCount(0);
  const state = await readStoredState(page);
  expect(state.groups[0].tabs).toHaveLength(2);
  expect(
    state.groups[0].tabs.find((tab) => tab.id === "closed-original"),
  ).toMatchObject({
    content: "Preserve closed note",
    savedContent: "Preserve closed note",
    open: false,
  });
  expect(state.groups[0].tabs.filter((tab) => tab.open)).toHaveLength(1);
});
