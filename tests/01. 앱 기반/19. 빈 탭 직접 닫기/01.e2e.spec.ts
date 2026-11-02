import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import { authenticate, getApi, historyPost, snapshot } from "../../__util__";

test("1. 개인 탭을 비운 직후 직접 닫으면 DB에서도 삭제하고 다른 그룹은 보존한다", async ({
  page,
  context,
}) => {
  await authenticate(context);
  const original = JSON.parse(snapshot(["삭제할 원문", "ㅎㅎ"]));
  original.groups.push({
    ...original.groups[0],
    id: "other",
    name: "Other",
    tabs: [
      {
        ...original.groups[0].tabs[1],
        id: "other-tab",
        content: "다른 그룹 원문",
      },
    ],
  });
  const prepared = await historyPost(page, {
    eventId: crypto.randomUUID(),
    snapshot: JSON.stringify(original),
  });
  expect(prepared.status(), await prepared.text()).toBe(200);
  await openEditor(page);
  await expect(page.locator("textarea").first()).toHaveValue("삭제할 원문");
  await page.locator("textarea").first().fill("");
  await page.locator(".tab-item").first().locator(".tab-close").click();
  await expect
    .poll(async () => {
      const { latest } = await (
        await getApi(page.request, "/api/notepad/history")
      ).json();
      return JSON.parse(latest.snapshot).groups[0].tabs.map(
        (tab: { id: string }) => tab.id,
      );
    })
    .toEqual(["tab-2"]);
  const { latest } = await (
    await getApi(page.request, "/api/notepad/history")
  ).json();
  const saved = JSON.parse(latest.snapshot);
  expect(
    saved.groups.find((group: { id: string }) => group.id === "other").tabs,
  ).toMatchObject(original.groups[1].tabs);
  expect(saved.groups[0].tabs[0].content).toBe("ㅎㅎ");
  await page.reload();
  await expect(page.locator("textarea").first()).toHaveValue("ㅎㅎ");
});
