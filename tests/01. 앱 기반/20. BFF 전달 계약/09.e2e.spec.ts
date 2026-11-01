import { expect, test } from "@playwright/test";

test("9. 게시판은 프런트 중계 없이 BFF를 직접 호출한다", async ({ page }) => {
  const businessRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/board") businessRequests.push(request.url());
  });
  const loaded = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.origin === "http://127.0.0.1:3101" &&
      url.pathname === "/api/board" &&
      response.request().method() === "GET"
    );
  });
  await page.goto("/board");
  const response = await loaded;
  expect(response.status()).toBe(200);
  expect(response.headers()["access-control-allow-origin"]).toBe(
    "http://localhost:3000",
  );
  expect(response.request().headers()["authorization"]).toMatch(/^Bearer /);
  expect(response.request().headers()["cookie"]).toBeUndefined();
  expect(businessRequests.length).toBeGreaterThan(0);
  expect(
    businessRequests.every(
      (url) => new URL(url).origin === "http://127.0.0.1:3101",
    ),
  ).toBe(true);
});
