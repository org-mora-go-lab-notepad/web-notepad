import { expect, test } from "@playwright/test";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { authenticate, getApi } from "../../__util__";
import { postApi } from "../../__util__/request";

test("6. 클라이언트가 위조한 공유 검증 헤더로 잘못된 링크에 참여할 수 없다", async ({
  page,
  context,
}) => {
  await authenticate(context);
  const shared = await postApi(page.request, "/api/groups/share", {
    data: {
      group: createGroupFixture(
        "forged-" + crypto.randomUUID(),
        "Protected link",
        [createTabFixture("kept", "Never overwrite")],
      ),
    },
  });
  expect(shared.status()).toBe(200);
  const { group } = await shared.json();
  const before = await (await getApi(page.request, "/api/groups")).json();
  const response = await postApi(page.request, "/api/groups/join", {
    data: { token: group.id + ".invalid-signature" },
    headers: {
      "x-notepad-context": Buffer.from(
        JSON.stringify({
          verifiedShareLink: { groupId: group.id, version: 0 },
        }),
      ).toString("base64url"),
      "x-notepad-signature": "forged",
    },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: "Invalid share link" });
  expect(response.headers()["set-cookie"]).toBeUndefined();
  const after = await (await getApi(page.request, "/api/groups")).json();
  expect(after).toEqual(before);
  expect(JSON.stringify(after)).toContain("Never overwrite");
});
