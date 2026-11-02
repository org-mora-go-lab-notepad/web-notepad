import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import path from "node:path";

export async function startMockApi(file: string) {
  const require = createRequire(path.resolve("package.json"));
  const child = spawn(
    process.execPath,
    [
      require.resolve("tsx/cli"),
      "scripts/mock-api.ts",
      "--port",
      "0",
      "--state",
      file,
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NOTEPAD_BFF_SECRET: "test-bff-secret",
        TURSO_DATABASE_URL: "libsql://must-not-be-used.invalid",
        TURSO_AUTH_TOKEN: "unused-mock-placeholder",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  let errors = "";
  child.stderr.on("data", (chunk) => {
    errors += chunk;
  });
  const url = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Mock API readiness timeout"));
    }, 15000);
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const match = output.match(
        /Mock API ready at (http:\/\/127\.0\.0\.1:\d+)/,
      );
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      if (code) reject(new Error(`Mock API exited: ${code}: ${errors}`));
    });
  });
  return {
    url,
    stop: async () => {
      if (child.exitCode !== null) return;
      const ended = once(child, "exit");
      child.kill("SIGTERM");
      await ended;
    },
  };
}
