import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { authenticate, getApi } from "../../__util__";
import { postApi } from "../../__util__/request";

test("4. 공유 링크는 BFF 호스트가 아닌 현재 프런트 주소를 유지한다", async ({
  page,
  context,
}) => {
  await authenticate(context);
  const response = await postApi(page.request, "/api/groups/share", {
    data: {
      group: createGroupFixture("link-" + crypto.randomUUID(), "BFF Link", [
        createTabFixture("one", "Keep link content"),
      ]),
    },
  });
  expect(response.status()).toBe(200);
  const payload = await response.json();
  const link = new URL(payload.url);
  expect(link.origin).toBe("http://localhost:3000");
  expect(link.searchParams.get("share")).toMatch(/^shared-/);
  expect(payload.group.tabs[0].content).toBe("Keep link content");
  const oauth = await page.request.get(
    "/api/auth/oauth/kakao?share=" +
      encodeURIComponent(link.searchParams.get("share")!),
    { maxRedirects: 0 },
  );
  expect(oauth.status()).toBe(307);
  expect(oauth.headers()["location"]).toContain(
    "https://kauth.kakao.com/oauth/authorize",
  );
  expect(oauth.headers()["set-cookie"]).toContain("web-notepad-share-return=");
  expect(oauth.headers()["set-cookie"]).toContain(
    link.searchParams.get("share")!,
  );

  const session = await getApi(page.request, "/api/auth/session");
  expect(session.status()).toBe(200);
  expect(session.headers()["cache-control"]).toContain("no-store");
  expect(session.headers()["set-cookie"]).toBeUndefined();
});
