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
const candidates = process.env.NOTEPAD_BFF_DIR
  ? [path.resolve(frontend, process.env.NOTEPAD_BFF_DIR)]
  : [
      path.resolve(frontend, "../web-notepad-bff"),
      path.resolve(frontend, "../../org-mora-go-lab-notepad/web-notepad-bff"),
    ];
const bff = candidates.find(
  (candidate) =>
    existsSync(path.join(candidate, "package.json")) &&
    JSON.parse(readFileSync(path.join(candidate, "package.json"), "utf8"))
      .name === "web-notepad-bff",
);
if (!bff)
  throw new Error(
    "web-notepad-bff를 찾지 못했습니다. NOTEPAD_BFF_DIR에 로컬 체크아웃 경로를 설정하세요.",
  );
function nextCli(directory) {
  try {
    return createRequire(path.join(directory, "package.json")).resolve(
      "next/dist/bin/next",
    );
  } catch {
    throw new Error(`${directory}에서 npm ci를 먼저 실행하세요.`);
  }
}
const frontendCli = nextCli(frontend),
  bffCli = nextCli(bff);
const gatewaySecret =
  process.env.NOTEPAD_BFF_SECRET || "notepad-local-bff-only";
const shareSecret =
  process.env.AUTH_SECRET ??
  process.env.KAKAO_REST_API_KEY ??
  "web-notepad-local-development-session";
const bffUrl = "http://127.0.0.1:3001";
if (process.argv.includes("--check")) {
  console.log(
    JSON.stringify({
      frontend,
      bff,
      frontendUrl: "http://localhost:3000",
      bffUrl,
      swaggerUrl: "http://localhost:3000/docs",
    }),
  );
} else {
  const children = [];
  let stopping = false;
  function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    for (const child of children)
      if (child.exitCode === null) child.kill("SIGTERM");
  }
  process.on("SIGINT", () => stop());
  process.on("SIGTERM", () => stop());
  async function assertPortFree(port) {
    await new Promise((resolve, reject) => {
      const probe = net.createServer();
      probe.once("error", () =>
        reject(
          new Error(
            `${port} 포트를 이미 사용 중입니다. 기존 서버를 종료한 뒤 다시 실행하세요.`,
          ),
        ),
      );
      probe.listen(port, () => probe.close(resolve));
    });
  }
  function launch(directory, cli, port, env) {
    const child = spawn(
      process.execPath,
      [
        cli,
        "dev",
        "-p",
        String(port),
        ...(port === 3001 ? ["--hostname", "127.0.0.1"] : []),
      ],
      {
        cwd: directory,
        env: { ...env, NODE_ENV: "development" },
        stdio: "inherit",
      },
    );
    children.push(child);
    child.once("error", (error) => {
      console.error(error.message);
      stop(1);
    });
    child.once("exit", (code) => {
      if (!stopping) stop(code || 1);
    });
    return child;
  }
  try {
    await assertPortFree(3000);
    await assertPortFree(3001);
    const backendEnv = {
      ...inheritedEnv,
      NOTEPAD_BFF_SECRET: gatewaySecret,
      SHARE_TOKEN_SECRET: shareSecret,
    };
    // Kakao credentials stay in the frontend; BFF loads its own .env.local DB settings.
    for (const key of Object.keys(backendEnv))
      if (key === "AUTH_SECRET" || key.startsWith("KAKAO_"))
        delete backendEnv[key];
    launch(bff, bffCli, 3001, backendEnv);
    const deadline = Date.now() + 60_000;
    let ready = false;
    while (!stopping && Date.now() < deadline) {
      try {
        const health = await fetch(bffUrl + "/api/health", {
          signal: AbortSignal.timeout(1_000),
        });
        ready =
          health.ok && (await health.json()).service === "web-notepad-bff";
      } catch {
        /* Retry readiness only; never replay an API write. */
      }
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!stopping && !ready)
      throw new Error("BFF가 60초 안에 준비되지 않았습니다.");
    if (!stopping) {
      launch(frontend, frontendCli, 3000, {
        ...process.env,
        NOTEPAD_BFF_URL: bffUrl,
        NOTEPAD_BFF_SECRET: gatewaySecret,
      });
      console.log(
        "Notepad: http://localhost:3000 | BFF: http://localhost:3001 | Swagger: http://localhost:3000/docs",
      );
    }
  } catch (error) {
    console.error(error.message);
    stop(1);
  }
}
