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

test("2. Board는 로그인한 나의 공유 그룹과 다른 사용자의 공유 그룹을 모두 표시한다", async ({
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
    ).toBeVisible();
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
