import { expect, test } from "@playwright/test";

test("8. 비로그인 사용자의 Board 목록과 상세 URL은 홈으로 이동한다", async ({
  page,
}) => {
  let boardRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/board") boardRequests += 1;
  });
  for (const url of ["/board", "/board?post=shared-private"]) {
    await test.step(url + " 직접 접근을 차단한다", async () => {
      await page.goto(url);
      await expect(page).toHaveURL("/");
      await expect(page.locator("main.home")).toBeVisible();
      await expect(page.locator("#board-page")).toHaveCount(0);
      await expect(page.locator("a.auth-command")).toBeVisible();
    });
  }
  expect(boardRequests).toBe(0);
});
