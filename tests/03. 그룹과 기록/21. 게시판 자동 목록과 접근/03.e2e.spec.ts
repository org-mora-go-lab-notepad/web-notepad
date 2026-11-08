import { expect, test } from "@playwright/test";

import {
  createGroupFixture,
  createTabFixture,
  signedSession,
} from "../../__fixture__";
import { authenticateBrowser, openBoard, sessionHeaders } from "../../__util__";
import { postApi } from "../../__util__/request";
import { getApi } from "../../__util__/request";

test("3. 공유 그룹 이름의 HTML은 실행하지 않고 글자로 표시하며 본문을 안전하게 제공한다", async ({
  page,
  request,
}) => {
  const title = `<img src=x onerror="window.boardInjected=1"> ${crypto.randomUUID().slice(0, 8)}`;
  const token = signedSession({
    id: crypto.randomUUID(),
    nickname: "Owner",
    expiresAt: Date.now() + 300_000,
  });
  const headers = sessionHeaders(token);
  await authenticateBrowser(page.context(), token);
  const result = await postApi(request, "/api/groups/share", {
    headers,
    data: {
      group: createGroupFixture("safe-" + crypto.randomUUID(), title, [
        createTabFixture("note", "Private body " + crypto.randomUUID()),
      ]),
    },
  });
  expect(result.ok()).toBe(true);
  const { group } = await result.json();
  try {
    await page.goto("/");
    await openBoard(page);
    await page
      .getByRole("searchbox", { name: "Search shared groups" })
      .fill(title);
    const safeEntry = page
      .locator(".board-entry")
      .filter({ has: page.getByText(title, { exact: true }) });
    await expect(safeEntry).toHaveCount(1);
    await expect(safeEntry.locator("strong")).toHaveText(title);
    await expect(safeEntry.locator("img")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => (window as Window & { boardInjected?: number }).boardInjected,
      ),
    ).toBeUndefined();
    expect(
      await (await getApi(request, "/api/board", { headers })).text(),
    ).toContain(group.tabs[0].content);
  } finally {
    await postApi(request, "/api/groups/revoke", {
      headers,
      data: { id: group.id },
    });
  }
});
