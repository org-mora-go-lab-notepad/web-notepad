import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const child = spawn(
  process.execPath,
  [require.resolve("@playwright/test/cli"), "test", ...process.argv.slice(2)],
  { stdio: "inherit", env: { ...process.env, NOTEPAD_API_MODE: "bff" } },
);
child.once("exit", (code) => {
  process.exitCode = code ?? 1;
});
child.once("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
