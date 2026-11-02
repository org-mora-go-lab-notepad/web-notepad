import { expect } from "@playwright/test";

import { sharingTest as test, signedSession } from "../../__fixture__";
import { authenticateBrowser, readStoredState } from "../../__util__";

test("3. 비회원은 초대 토큰이 포함된 탭 링크로 가입해 내용을 바로 연다", async ({
  browser,
  baseURL,
  sharing,
}) => {
  const context = await browser.newContext({ baseURL });
  try {
    await authenticateBrowser(
      context,
      signedSession({
        id: "outsider-" + crypto.randomUUID(),
        nickname: "Outsider",
        expiresAt: Date.now() + 300_000,
      }),
    );
    const page = await context.newPage();
    const url = new URL("/", baseURL);
    url.searchParams.set("group", sharing.id);
    url.searchParams.set("leftTab", sharing.group.tabs[0].id);
    url.searchParams.set("pane", "left");
    await page.goto(url.toString());
    await expect(page.locator("textarea")).toHaveCount(0);
    await expect
      .poll(async () => (await readStoredState(page)).activeGroupId)
      .not.toBe(sharing.id);
    await expect(
      page.getByRole("button", { name: "New tab", exact: true }),
    ).toBeVisible();

    const inviteUrl = new URL(sharing.url);
    inviteUrl.searchParams.set("group", sharing.id);
    inviteUrl.searchParams.set("leftTab", sharing.group.tabs[0].id);
    inviteUrl.searchParams.set("pane", "left");
    await page.goto(inviteUrl.toString());
    await expect
      .poll(async () => (await readStoredState(page)).activeGroupId)
      .toBe(sharing.id);
    await expect(page.locator("textarea")).toHaveValue("Keep this note");
  } finally {
    await context.close();
  }
});
