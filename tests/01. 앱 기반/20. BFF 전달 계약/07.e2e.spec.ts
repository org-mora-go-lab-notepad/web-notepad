import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { getApi, snapshot } from "../../__util__";
import { postApi } from "../../__util__/request";

test("7. 기존 사용자 ID별 개인 그룹과 본문은 다른 계정으로 섞이지 않는다", async ({
  request,
}) => {
  const suffix = crypto.randomUUID();
  const first = {
    Cookie:
      "web-notepad-session=" +
      signedSession({
        id: "first-" + suffix,
        nickname: "현우 fixture",
        expiresAt: Date.now() + 60000,
      }),
  };
  const second = {
    Cookie:
      "web-notepad-session=" +
      signedSession({
        id: "second-" + suffix,
        nickname: "승민 fixture",
        expiresAt: Date.now() + 60000,
      }),
  };
  const firstSnapshot = snapshot(["First personal group preserved"]);
  const secondSnapshot = snapshot(["Second personal group preserved"]);
  const firstSave = await postApi(request, "/api/notepad/history", {
    headers: first,
    data: { eventId: crypto.randomUUID(), snapshot: firstSnapshot },
  });
  expect(firstSave.status()).toBe(200);
  const secondSave = await postApi(request, "/api/notepad/history", {
    headers: second,
    data: { eventId: crypto.randomUUID(), snapshot: secondSnapshot },
  });
  expect(secondSave.status()).toBe(200);
  const firstRead = await getApi(request, "/api/notepad/history", {
    headers: first,
  });
  const secondRead = await getApi(request, "/api/notepad/history", {
    headers: second,
  });
  expect(firstRead.status()).toBe(200);
  expect(secondRead.status()).toBe(200);
  const a = await firstRead.json();
  const b = await secondRead.json();
  expect(JSON.stringify(a.latest.snapshot)).toContain(
    "First personal group preserved",
  );
  expect(JSON.stringify(a.latest.snapshot)).not.toContain(
    "Second personal group preserved",
  );
  expect(JSON.stringify(b.latest.snapshot)).toContain(
    "Second personal group preserved",
  );
  expect(JSON.stringify(b.latest.snapshot)).not.toContain(
    "First personal group preserved",
  );
  expect(firstRead.headers()["set-cookie"]).toBeUndefined();
  expect(secondRead.headers()["set-cookie"]).toBeUndefined();
});
