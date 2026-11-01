import { createHmac } from "node:crypto";

import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { authenticate, getApi } from "../../__util__";
import { postApi } from "../../__util__/request";

test("5. 기존 키의 버전 없는 공유 링크와 로그인 세션을 BFF 연결 후에도 유지한다", async ({
  page,
  context,
}) => {
  await authenticate(context);
  const before = await (await getApi(page.request, "/api/auth/session")).json();
  const shared = await postApi(page.request, "/api/groups/share", {
    data: {
      group: createGroupFixture("legacy-" + crypto.randomUUID(), "Legacy key", [
        createTabFixture("old-note", "Preserve old content"),
      ]),
    },
  });
  expect(shared.status()).toBe(200);
  const data = await shared.json();
  expect(data).not.toHaveProperty("shareLink");
  const id = data.group.id;
  const token =
    id +
    "." +
    createHmac("sha256", "test-auth-secret")
      .update("group-share:" + id)
      .digest("base64url");
  expect(new URL(data.url).searchParams.get("share")).toMatch(/^shared-/);
  const joined = await postApi(page.request, "/api/groups/join", {
    data: { token },
  });
  expect(joined.status()).toBe(200);
  expect((await joined.json()).group.data.tabs[0].content).toBe(
    "Preserve old content",
  );
  const board = await (await getApi(page.request, "/api/board")).json();
  const post = board.posts.find((post: { id: string }) => post.id === id);
  expect(new URL(post.inviteUrl).searchParams.get("share")).toMatch(/^shared-/);
  expect(post).not.toHaveProperty("shareLink");
  const after = await getApi(page.request, "/api/auth/session");
  expect(await after.json()).toEqual(before);
  expect(after.headers()["set-cookie"]).toBeUndefined();
});
