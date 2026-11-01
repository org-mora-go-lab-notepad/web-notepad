import { expect, test } from "@playwright/test";

import { authenticate, getApi } from "../../__util__";

test("3. 프런트 Swagger에서 카카오 세션의 단기 토큰으로 개인 이력을 실제 조회한다", async ({
  page,
  context,
}) => {
  await authenticate(context);
  await page.goto("/docs");
  await expect(
    page.getByRole("heading", { name: "Web Notepad BFF API" }),
  ).toBeVisible();
  const grant = await (await getApi(page.request, "/api/auth/bff")).json();
  await page.getByRole("button", { name: "Authorize", exact: true }).click();
  const modal = page.locator(".dialog-ux");
  await modal.locator("input").fill(grant.token);
  await modal
    .getByRole("button", { name: "Apply credentials", exact: true })
    .click();
  await modal.getByRole("button", { name: "Close", exact: true }).click();
  const history = page.locator("#operations-History-getHistory");
  await history.locator(".opblock-summary").click();
  await history.getByRole("button", { name: "Try it out" }).click();
  const completed = page.waitForResponse((response) =>
    response.url().endsWith("/api/notepad/history"),
  );
  await history.getByRole("button", { name: "Execute", exact: true }).click();
  const response = await completed;
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ latest: null, count: 0 });
  expect(response.headers()["cache-control"]).toContain("no-store");
  await expect(history.locator(".responses-wrapper")).toContainText("latest");
  await expect(page.locator("body")).not.toContainText("test-bff-secret");
  await page.screenshot({
    path: "test-results/local-swagger.png",
    fullPage: true,
  });
});
