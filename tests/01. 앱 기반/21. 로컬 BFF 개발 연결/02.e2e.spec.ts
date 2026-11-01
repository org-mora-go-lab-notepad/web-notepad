import { spawnSync } from "node:child_process";

import { expect, test } from "@playwright/test";

test("2. BFF 경로가 잘못되면 서버 시작 전에 명확한 오류로 중단한다", async () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/dev-local.mjs", "--check"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NOTEPAD_BFF_DIR: "/notepad-missing-" + crypto.randomUUID(),
      },
      encoding: "utf8",
    },
  );
  expect(result.status).not.toBe(0);
  expect(result.error).toBeUndefined();
  expect(result.stderr).toContain("NOTEPAD_BFF_DIR");
  expect(result.stderr).toContain("web-notepad-bff를 찾지 못했습니다");
  expect(result.stdout).not.toContain("Ready");
  expect(result.stdout).not.toContain("Starting");
  expect(result.stdout).not.toContain("Notepad:");
  expect(result.stdout).not.toContain("TURSO_AUTH_TOKEN");
  expect(result.stdout).not.toContain("AUTH_SECRET");
  expect(result.signal).toBeNull();
});
