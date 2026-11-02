import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import {
  authenticate,
  getApi,
  historyPost,
  readStoredState,
  snapshot,
} from "../../__util__";

test("1. 누락된 로컬 재전송 대기열과 서버 원문을 함께 복구한다", async ({
  page,
  context,
}) => {
  const userId = `omission-${crypto.randomUUID()}`;
  await authenticate(context, userId);
  expect(
    (
      await historyPost(page, {
        eventId: crypto.randomUUID(),
        snapshot: snapshot(["수정할 원문", "보존할 원문"]),
      })
    ).ok(),
  ).toBe(true);
  await openEditor(page);
  await expect(page.locator("textarea").first()).toHaveValue("수정할 원문");
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
  );
  await page.evaluate((id) => {
    const key = "web-notepad-storage";
    const stored = JSON.parse(localStorage.getItem(key)!);
    stored.state.groups[0].tabs = [stored.state.groups[0].tabs[0]];
    stored.state.groups[0].tabs[0].content = "미전송 수정 본문";
    const value = JSON.stringify(stored.state);
    localStorage.setItem(key, JSON.stringify(stored));
    localStorage.setItem(
      `web-notepad-cloud-pending:${id}`,
      JSON.stringify({ eventId: crypto.randomUUID(), snapshot: value }),
    );
  }, userId);
  await page.reload();
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
    { timeout: 20_000 },
  );
  await expect(page.locator("textarea").first()).toHaveValue(
    "미전송 수정 본문",
  );
  const state = await readStoredState(page);
  expect(state.groups[0].tabs.map((tab) => tab.content)).toEqual([
    "미전송 수정 본문",
    "보존할 원문",
  ]);
  const saved = await (
    await getApi(page.request, "/api/notepad/history")
  ).json();
  expect(
    JSON.parse(saved.latest.snapshot).groups[0].tabs.map(
      (tab: { content: string }) => tab.content,
    ),
  ).toEqual(["미전송 수정 본문", "보존할 원문"]);
});
