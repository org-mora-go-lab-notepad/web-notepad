import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { authenticateBrowser, openMoreMenu } from "../../__util__";

test("5. 페이지 전환 중 사용자 프로필을 유지하고 스켈레톤을 다시 표시하지 않는다", async ({
  page,
  context,
}) => {
  const nickname = "Persistent Footer User";
  await authenticateBrowser(
    context,
    signedSession({
      id: "persistent-footer-user",
      nickname,
      expiresAt: Date.now() + 300_000,
    }),
  );
  let requestCount = 0;
  let holdRefresh = false;
  let releaseRefresh!: () => void;
  const refreshReleased = new Promise<void>((resolve) => {
    releaseRefresh = resolve;
  });
  await page.route("**/api/auth/session", async (route) => {
    requestCount += 1;
    if (holdRefresh) await refreshReleased;
    await route.continue();
  });

  await page.goto("/");
  const account = page.getByRole("button", {
    name: `${nickname} · Account menu`,
    exact: true,
  });
  await expect(account).toBeVisible();
  holdRefresh = true;
  const menu = await openMoreMenu(page);
  await menu.getByRole("button", { name: "Board", exact: true }).click();
  await expect(page).toHaveURL(/\/board$/);
  await expect(account).toBeVisible();
  await expect(page.locator(".footer .auth-command.is-loading")).toHaveCount(0);

  await account.click();
  await page.getByRole("menuitem", { name: "My Page", exact: true }).click();
  await expect(page).toHaveURL(/\/my-page$/);
  await expect(account).toBeVisible();
  await expect(page.locator(".footer .auth-command.is-loading")).toHaveCount(0);
  releaseRefresh();
  await expect.poll(() => requestCount).toBeGreaterThanOrEqual(3);
});
