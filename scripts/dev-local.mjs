import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import nextEnv from "@next/env";

const frontend = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const inheritedEnv = { ...process.env };
nextEnv.loadEnvConfig(frontend, true);
const mode = process.argv.includes("--bff") ? "bff" : "mock";
const candidates = process.env.NOTEPAD_BFF_DIR
  ? [path.resolve(frontend, process.env.NOTEPAD_BFF_DIR)]
  : [
      path.resolve(frontend, "../web-notepad-bff"),
      path.resolve(frontend, "../../org-mora-go-lab-notepad/web-notepad-bff"),
    ];
const bff =
  mode === "bff"
    ? candidates.find(
        (candidate) =>
          existsSync(path.join(candidate, "package.json")) &&
          JSON.parse(readFileSync(path.join(candidate, "package.json"), "utf8"))
            .name === "web-notepad-bff",
      )
    : null;
if (mode === "bff" && !bff)
  throw new Error(
    "web-notepad-bff를 찾지 못했습니다. NOTEPAD_BFF_DIR에 로컬 체크아웃 경로를 설정하세요.",
  );
const resolve = createRequire(path.join(frontend, "package.json")).resolve;
const backendUrl = "http://127.0.0.1:3001";
const secret =
  mode === "mock"
    ? process.env.NOTEPAD_MOCK_SECRET || "notepad-local-mock-only"
    : process.env.NOTEPAD_BFF_SECRET || "notepad-local-bff-only";
if (process.argv.includes("--check")) {
  console.log(
    JSON.stringify({
      frontend,
      bff,
      mode,
      frontendUrl: "http://localhost:3000",
      bffUrl: backendUrl,
      swaggerUrl: "http://localhost:3000/docs",
    }),
  );
} else {
  const children = [];
  let stopping = false;
  const stop = (code = 0) => {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    for (const child of children)
      if (child.exitCode === null) child.kill("SIGTERM");
  };
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop());
  const launch = (cwd, args, env) => {
    const child = spawn(process.execPath, args, {
      cwd,
      env: { ...env, NODE_ENV: "development" },
      stdio: "inherit",
    });
    children.push(child);
    child.once("error", (error) => {
      console.error(error.message);
      stop(1);
    });
    child.once("exit", (code) => {
      if (!stopping) stop(code || 1);
    });
  };
  const portFree = (port) =>
    new Promise((resolve, reject) => {
      const probe = net.createServer();
      probe.once("error", () =>
        reject(
          new Error(
            `${port} 포트를 이미 사용 중입니다. 기존 서버를 종료한 뒤 다시 실행하세요.`,
          ),
        ),
      );
      probe.listen(port, "127.0.0.1", () => probe.close(resolve));
    });
  try {
    await portFree(3000);
    await portFree(3001);
    const backendEnv = { ...inheritedEnv, NOTEPAD_BFF_SECRET: secret };
    for (const key of Object.keys(backendEnv))
      if (
        key === "AUTH_SECRET" ||
        key === "SHARE_TOKEN_SECRET" ||
        key.startsWith("KAKAO_") ||
        (mode === "mock" && key.startsWith("TURSO_"))
      )
        delete backendEnv[key];
    if (mode === "mock")
      launch(
        frontend,
        [resolve("tsx/cli"), "scripts/mock-api.ts", "--port", "3001"],
        backendEnv,
      );
    else
      launch(
        bff,
        [
          createRequire(path.join(bff, "package.json")).resolve(
            "next/dist/bin/next",
          ),
          "dev",
          "-p",
          "3001",
          "--hostname",
          "127.0.0.1",
        ],
        backendEnv,
      );
    let ready = false;
    const deadline = Date.now() + 60000;
    while (!stopping && Date.now() < deadline) {
      try {
        const response = await fetch(backendUrl + "/api/health", {
          signal: AbortSignal.timeout(1000),
        });
        ready =
          response.ok && (await response.json()).service === "web-notepad-bff";
      } catch {
        /* Readiness checks only; writes are never replayed. */
      }
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!stopping && !ready)
      throw new Error("API가 60초 안에 준비되지 않았습니다.");
    if (!stopping) {
      launch(frontend, [resolve("next/dist/bin/next"), "dev", "-p", "3000"], {
        ...process.env,
        NOTEPAD_BFF_URL: backendUrl,
        NOTEPAD_BFF_SECRET: secret,
      });
      console.log(
        `Notepad: http://localhost:3000 | ${mode === "mock" ? "Independent Mock API" : "BFF"}: ${backendUrl}`,
      );
    }
  } catch (error) {
    console.error(error.message);
    stop(1);
  }
}
