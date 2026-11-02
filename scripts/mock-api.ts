import path from "node:path";

import { createMockApiServer } from "../tests/__mock__/api";

if (process.env.NODE_ENV === "production")
  throw new Error("Mock API is development-only");
const args = process.argv.slice(2);
const port = Number(
  args.includes("--port") ? args[args.indexOf("--port") + 1] : 3001,
);
const ephemeral = args.includes("--ephemeral");
const server = createMockApiServer({
  secret: process.env.NOTEPAD_BFF_SECRET || "notepad-local-mock-only",
  file: ephemeral
    ? undefined
    : path.resolve(
        args.includes("--state")
          ? args[args.indexOf("--state") + 1]
          : ".local/mock-api.json",
      ),
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `Mock API ready at http://127.0.0.1:${(server.address() as { port: number }).port} (${ephemeral ? "isolated memory" : "local JSON persistence"})`,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
