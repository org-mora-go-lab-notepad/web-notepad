import { expect, test } from "@playwright/test";

import { authenticate, getApi } from "../../__util__";

test("3. 프런트는 클라이언트의 위조 BFF 헤더를 신뢰하지 않는다", async ({
  page,
  context,
}) => {
  await authenticate(context);
  await context.clearCookies();
  const response = await page.request.get("/api/notepad/history", {
    headers: {
      "x-notepad-context": "forged-owner",
      "x-notepad-signature": "forged",
      "x-user-id": "owner",
    },
  });
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: "Unauthorized" });
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["set-cookie"]).toBeUndefined();
  const session = await getApi(page.request, "/api/auth/session");
  expect(session.status()).toBe(200);
  expect(session.headers()["cache-control"]).toContain("no-store");
  expect(session.headers()["set-cookie"]).toBeUndefined();
});
