import { expect, test } from "@playwright/test";

import { getApi } from "../../__util__";

test("8. 프런트에는 인증 API만 있고 업무 중계 API는 없다", async ({
  request,
}) => {
  const grant = await getApi(request, "/api/auth/bff");
  expect(grant.status()).toBe(200);
  expect(grant.headers()["cache-control"]).toContain("no-store");
  const credential = await grant.json();
  expect(credential.url).toBe("http://127.0.0.1:3101");
  expect(credential.token).toEqual(expect.any(String));
  expect(credential).not.toHaveProperty("secret");
  for (const path of [
    "/api/groups",
    "/api/board",
    "/api/notepad/history",
    "/api/groups/share",
    "/api/groups/update",
    "/api/groups/join",
  ]) {
    // Deliberately address the frontend to verify removed routes, not the BFF helper.
    const response = await getApi(request, "http://localhost:3000" + path);
    expect(response.status(), path + " must not proxy business APIs").toBe(404);
  }
  const session = await getApi(request, "/api/auth/session");
  expect(session.status()).toBe(200);
  expect(await session.json()).toEqual({ user: null });
  expect(session.headers()["set-cookie"]).toBeUndefined();
});
