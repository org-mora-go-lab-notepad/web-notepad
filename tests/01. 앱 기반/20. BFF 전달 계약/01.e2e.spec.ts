import { expect, test } from "@playwright/test";

import { authenticate, getApi, snapshot } from "../../__util__";

test("1. 외부 Origin의 인증된 저장 요청은 BFF에서도 거부된다", async ({
  page,
  context,
}) => {
  await authenticate(context);
  const response = await page.request.post("/api/notepad/history", {
    headers: { Origin: "https://attacker.example" },
    data: { eventId: crypto.randomUUID(), snapshot: snapshot(["preserve"]) },
  });
  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ error: "Invalid origin" });
  const history = await getApi(page.request, "/api/notepad/history");
  expect(history.status()).toBe(200);
  expect((await history.json()).latest).toBeNull();
  const session = await getApi(page.request, "/api/auth/session");
  expect(session.status()).toBe(200);
  expect(session.headers()["cache-control"]).toContain("no-store");
  expect(session.headers()["set-cookie"]).toBeUndefined();
});
