import { expect, test } from "@playwright/test";

import { getApi } from "../../__util__";

test("4. 프런트 Swagger 명세는 BFF 직접 호출 토큰 계약을 제공하며 비로그인 API 접근을 허용하지 않는다", async ({
  request,
}) => {
  const response = await getApi(request, "/docs/openapi.json");
  expect(response.status()).toBe(200);
  const document = await response.json();
  expect(document.servers[0].url).toBe("http://127.0.0.1:3101");
  expect(document.security).toEqual([{ BrowserToken: [] }]);
  expect(document.components.securitySchemes.BrowserToken.scheme).toBe(
    "bearer",
  );
  expect(document.components.securitySchemes).not.toHaveProperty(
    "GatewaySignature",
  );
  expect(document.paths).toHaveProperty("/api/health");
  const denied = await getApi(request, "/api/notepad/history");
  expect(denied.status()).toBe(401);
  expect(await denied.json()).toEqual({ error: "Unauthorized" });
  const unknown = await getApi(request, "/docs/private-file.json");
  expect(unknown.status()).toBe(404);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["set-cookie"]).toBeUndefined();
});
