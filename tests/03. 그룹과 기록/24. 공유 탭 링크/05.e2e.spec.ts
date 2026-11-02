import { expect } from "@playwright/test";

import { SESSION_COOKIE, sharingTest as test } from "../../__fixture__";
import { readStoredState } from "../../__util__";

test("5. 로그인 뒤에도 공유 탭 링크의 그룹과 탭을 연다", async ({
  sharing,
}) => {
  const { guest, group } = sharing;
  const context = guest.context();
  const session = (await context.cookies()).find(
    (cookie) => cookie.name === SESSION_COOKIE,
  )!;
  await context.clearCookies();
  await guest.evaluate(() => localStorage.clear());
  const url = new URL("/", "http://localhost:3000");
  url.searchParams.set("group", group.id);
  url.searchParams.set("leftTab", group.tabs[0].id);
  url.searchParams.set("pane", "left");
  await guest.goto(url.toString());
  await expect(guest.locator("textarea")).toHaveCount(0);
  await expect(
    guest.getByRole("button", { name: "New tab", exact: true }),
  ).toBeVisible();

  await context.addCookies([session]);
  await guest.goto("/");
  await expect
    .poll(async () => (await readStoredState(guest)).activeGroupId)
    .toBe(group.id);
  await expect(guest.locator("textarea")).toHaveValue("Keep this note");
});
