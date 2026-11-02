import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { expect, test } from "@playwright/test";

test("1. 개발 실행기는 BFF 저장소 없이 독립 Mock API와 3000 및 3001 연결 경로를 제공한다", async () => {
  const run = promisify(execFile);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NOTEPAD_BFF_SECRET: "launcher-test-secret",
  };
  delete env.FORCE_COLOR;
  const result = await run(
    process.execPath,
    ["scripts/dev-local.mjs", "--check"],
    {
      cwd: process.cwd(),
      env,
    },
  );
  const output = JSON.parse(result.stdout.trim().split("\n").at(-1)!);
  expect(output.frontend).toBe(process.cwd());
  expect(output.bff).toBeNull();
  expect(output.mode).toBe("mock");
  expect(output.frontendUrl).toBe("http://localhost:3000");
  expect(output.bffUrl).toBe("http://127.0.0.1:3001");
  expect(output.swaggerUrl).toBe("http://localhost:3000/docs");
  expect(result.stderr).toBe("");
  expect(result.stdout).not.toContain("launcher-test-secret");
  expect(output).not.toHaveProperty("AUTH_SECRET");
  expect(output).not.toHaveProperty("TURSO_AUTH_TOKEN");
});
