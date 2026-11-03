import { expect, test } from "@playwright/test";

import { authenticateBrowser } from "../../__util__";

test("3. 계정의 Alarm 기능과 클라이언트 알람 조회를 제거한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/groups/notifications")) requests++;
  });
  await page.goto("/");
  const account = page.locator("button.auth-command");
  await account.click();
  await expect(
    page.getByRole("menuitem", { name: "My Page", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("menuitem", { name: "Alarm", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Alarm" })).toHaveCount(0);
  await expect(account).toBeFocused();
  expect(requests).toBe(0);
});
