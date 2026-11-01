import { expect, test } from "@playwright/test";

import { authenticate, getApi, snapshot } from "../../__util__";

test("2. 개인 저장 결과와 캐시 정책을 BFF에서 그대로 전달한다", async ({
  page,
  context,
}) => {
  await authenticate(context);
  const eventId = crypto.randomUUID();
  const save = await page.request.post("/api/notepad/history", {
    data: { eventId, snapshot: snapshot(["BFF integration note"]) },
  });
  expect(save.status()).toBe(200);
  expect(await save.json()).toEqual({ saved: true });
  const history = await getApi(page.request, "/api/notepad/history");
  expect(history.headers()["cache-control"]).toContain("no-store");
  expect((await history.json()).latest.eventId).toBe(eventId);
  const session = await getApi(page.request, "/api/auth/session");
  expect(session.status()).toBe(200);
  expect(session.headers()["cache-control"]).toContain("no-store");
  expect(session.headers()["set-cookie"]).toBeUndefined();
});
