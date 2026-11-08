import { expect } from "@playwright/test";

import {
  boardTest as test,
  createGroupFixture,
  createTabFixture,
  signedSession,
} from "../../__fixture__";
import { authenticateBrowser, openBoard, sessionHeaders } from "../../__util__";
import { postApi } from "../../__util__/request";
import { getApi } from "../../__util__/request";

test("2. Board는 소유한 그룹을 표시하고 참여하지 않은 그룹은 직접 주소로도 열 수 없다", async ({
  page,
  context,
  request,
  boardPost,
  boardOwnerToken,
}) => {
  const headers = sessionHeaders(
    signedSession({
      id: crypto.randomUUID(),
      nickname: "Other owner",
      expiresAt: Date.now() + 300_000,
    }),
  );
  const response = await postApi(request, "/api/groups/share", {
    headers,
    data: {
      group: createGroupFixture(
        "other-" + crypto.randomUUID(),
        "Other " + crypto.randomUUID(),
        [createTabFixture("note", "Other private note")],
      ),
    },
  });
  expect(response.ok()).toBe(true);
  const { group } = await response.json();
  try {
    await authenticateBrowser(context, boardOwnerToken);
    await page.goto("/");
    await openBoard(page);
    await expect(
      page.locator(".board-entry", { hasText: boardPost.title }),
    ).toBeVisible();
    await expect(
      page.locator(".board-entry", { hasText: group.name }),
    ).toHaveCount(0);
    await page.goto("/board?post=" + group.id);
    await expect(page.locator(".board-list")).toBeVisible();
    await expect(page.locator(".board-detail")).toHaveCount(0);
    const board = await getApi(page.request, "/api/board");
    expect(board.status()).toBe(200);
    expect(await board.text()).not.toContain("Other private note");
    const ownGroups = (await (await getApi(page.request, "/api/groups")).json())
      .groups;
    expect(
      ownGroups.some((entry: { id: string }) => entry.id === group.id),
    ).toBe(false);
  } finally {
    await postApi(request, "/api/groups/revoke", {
      headers,
      data: { id: group.id },
    });
  }
});
