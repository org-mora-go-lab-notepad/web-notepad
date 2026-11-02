import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { startMockApi } from "../../__mock__";
import { getApi, snapshot } from "../../__util__";

test("5. 독립 Mock API는 Turso 없이 저장한 사용자 데이터를 재시작 후 복원한다", async ({
  request,
}) => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "notepad-mock-contract-"),
  );
  let api = await startMockApi(path.join(directory, "state.json"));
  const cookie = signedSession({
    id: "mock-persist-" + crypto.randomUUID(),
    nickname: "Mock User",
    expiresAt: Date.now() + 300000,
  });
  try {
    const grant = await (
      await getApi(request, "/api/auth/bff", {
        headers: { Cookie: "web-notepad-session=" + cookie },
      })
    ).json();
    const headers = {
      Authorization: "Bearer " + grant.token,
      Origin: "http://localhost:3000",
    };
    const eventId = crypto.randomUUID();
    const content = snapshot(["Persisted mock note"]);
    const saved = await request.post(api.url + "/api/notepad/history", {
      headers,
      data: { eventId, snapshot: content },
    });
    expect(saved.status()).toBe(200);
    expect(await saved.json()).toEqual({ saved: true });
    await api.stop();
    api = await startMockApi(path.join(directory, "state.json"));
    const loaded = await getApi(request, api.url + "/api/notepad/history", {
      headers,
    });
    expect(loaded.status()).toBe(200);
    expect(loaded.headers()["x-notepad-mock"]).toBe("1");
    expect(await loaded.json()).toMatchObject({
      count: 1,
      latest: { eventId, snapshot: content },
    });
  } finally {
    await api.stop();
    await rm(directory, { recursive: true, force: true });
  }
});
