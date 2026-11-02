import { expect, test } from "@playwright/test";

import { DEFAULT_SETTINGS } from "@/src/4-entity/notepad";

import {
  createGroupFixture,
  createTabFixture,
  signedSession,
} from "../../__fixture__";
import { openEditor } from "../../__util__";
import {
  authenticateBrowser,
  switchGroup,
  writeStoredState,
} from "../../__util__";

test("5. 재접속 시 이전 서버 선택보다 마지막에 접근한 로컬 그룹을 유지한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: "last-group-" + crypto.randomUUID(),
      nickname: "Last group user",
      expiresAt: Date.now() + 300000,
    }),
  );
  const state = {
    settings: DEFAULT_SETTINGS,
    activeGroupId: "work",
    closedTabs: [],
    nextTabNumber: 4,
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", [
        createTabFixture("a", "Personal"),
      ]),
      createGroupFixture("work", "Work", [createTabFixture("b", "Work note")]),
      createGroupFixture("later", "Later", [
        createTabFixture("c", "Later note"),
      ]),
    ],
  };
  await page.route("**/api/notepad/history", (route) =>
    route.fulfill({
      json:
        route.request().method() === "GET"
          ? {
              latest: {
                eventId: "older-view",
                snapshot: JSON.stringify({
                  ...state,
                  activeGroupId: "ungrouped",
                }),
                createdAt: Date.now(),
              },
              count: 1,
            }
          : { saved: true },
    }),
  );
  await writeStoredState(page, state);
  await expect(page.locator("button.auth-command")).toBeVisible();
  await expect(page.locator(".group-current-value")).toHaveText("Work");
  await switchGroup(page, "Later");
  await openEditor(page);
  await expect(page.locator("button.auth-command")).toBeVisible();
  await expect(page.locator(".group-current-value")).toHaveText("Later");
  await expect(page.locator("textarea").first()).toHaveValue("Later note");
});
