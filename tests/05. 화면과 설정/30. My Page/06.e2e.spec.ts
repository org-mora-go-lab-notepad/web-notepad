import { expect, test } from "@playwright/test";

import { authenticateBrowser } from "../../__util__";

test("6. My Page 하단에는 설정·보드·로그아웃 영역을 표시하지 않는다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  await page.route("**/api/groups", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/my-page");
  await expect(page.locator(".my-page-metrics")).toBeVisible();
  await expect(page.locator('[data-metric="my-groups"] dd')).toHaveText("3");
  await expect(page.locator('[data-metric="notes"] dd')).toHaveText("18");
  await expect(
    page.locator(".my-page-actions, .my-page-actions-skeleton"),
  ).toHaveCount(0);
  await expect(
    page.locator('a[href*="panel="], button:has-text("Logout")'),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await expect(page.locator(".note-pane")).toBeVisible();
});
