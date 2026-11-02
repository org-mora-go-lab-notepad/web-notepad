import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { MockWorkspace } from "./model.mjs";

const require = createRequire(import.meta.url);
const methods = {
  "/api/board": ["GET"],
  "/api/notepad/history": ["GET", "POST"],
  "/api/groups": ["GET"],
  "/api/groups/share": ["POST"],
  "/api/groups/join": ["POST"],
  "/api/groups/update": ["POST"],
  "/api/groups/leave": ["POST"],
  "/api/groups/revoke": ["POST"],
  "/api/groups/notifications": ["GET", "DELETE"],
  "/api/groups/notifications/read": ["POST"],
};
const equal = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const expected = Buffer.from(a),
    received = Buffer.from(b);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
};
/** @param {{secret?: string, file?: string}} [options] */
export function createMockApiServer({
  secret = "notepad-local-mock-only",
  file,
} = {}) {
  const model = new MockWorkspace(file);
  let queue = Promise.resolve();
  const sign = (value) =>
    createHmac("sha256", secret).update(value).digest("base64url");
  const shareUrl = (id, version, origin) => {
    const url = new URL("/", origin);
    url.searchParams.set(
      "share",
      `${id}${version ? "." + version : ""}.${sign(`share:${id}:${version}`)}`,
    );
    return url.toString();
  };
  const credential = (request) => {
    const bearer = request.headers.authorization;
    if (!bearer?.startsWith("Bearer ")) return null;
    const [payload, signature, extra] = bearer.slice(7).split(".");
    if (
      !payload ||
      payload.length > 32768 ||
      extra ||
      !equal(sign("browser:" + payload), signature)
    )
      return null;
    try {
      const value = JSON.parse(Buffer.from(payload, "base64url").toString());
      if (
        value.audience !== "notepad-browser" ||
        !Number.isFinite(value.expiresAt) ||
        value.expiresAt <= Date.now() ||
        value.expiresAt > Date.now() + 65000 ||
        new URL(value.origin).origin !== value.origin ||
        (value.user !== null && (!value.user?.id || !value.user?.nickname))
      )
        return null;
      return value;
    } catch {
      return null;
    }
  };
  const verifiedLink = (token, grant) => {
    if (typeof token !== "string") return null;
    const parts = token.split(".");
    const id = parts[0],
      version = parts.length === 3 ? Number(parts[1]) : 0;
    if (
      [2, 3].includes(parts.length) &&
      /^shared-[0-9a-f-]{36}$/i.test(id) &&
      Number.isSafeInteger(version) &&
      version >= 0 &&
      equal(sign(`share:${id}:${version}`), parts.at(-1))
    )
      return { groupId: id, version };
    if (
      createHash("sha256").update(token).digest("hex") === grant.shareTokenHash
    )
      return grant.verifiedShareLink;
    return null;
  };
  return createServer(async (request, response) => {
    const origin = request.headers.origin;
    const send = (
      status,
      data,
      contentType = "application/json",
      extra = {},
    ) => {
      response.writeHead(status, {
        "Cache-Control": "private, no-store",
        Vary: "Origin",
        "Content-Type": contentType,
        ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "X-Notepad-Mock": "1",
        ...extra,
      });
      response.end(
        status === 204
          ? undefined
          : contentType === "application/json"
            ? JSON.stringify(data)
            : data,
      );
    };
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (request.method === "OPTIONS") {
      send(204);
      return;
    }
    if (pathname === "/api/health") {
      send(200, { service: "web-notepad-bff", status: "ok", mode: "mock" });
      return;
    }
    if (pathname === "/api/openapi" || pathname === "/docs/openapi.json") {
      send(
        200,
        JSON.parse(
          await readFile(new URL("./openapi.json", import.meta.url), "utf8"),
        ),
      );
      return;
    }
    if (pathname === "/docs" || pathname === "/docs/") {
      send(
        200,
        '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Notepad Mock API</title><link rel="stylesheet" href="/docs/assets/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="/docs/assets/swagger-ui-bundle.js"></script><script src="/docs/assets/initializer.js"></script></body></html>',
        "text/html",
      );
      return;
    }
    if (pathname === "/docs/assets/initializer.js") {
      send(
        200,
        'window.ui = SwaggerUIBundle({ url: "/docs/openapi.json", dom_id: "#swagger-ui", deepLinking: true, validatorUrl: null, persistAuthorization: false, withCredentials: false, presets: [SwaggerUIBundle.presets.apis], layout: "BaseLayout" });',
        "application/javascript; charset=utf-8",
      );
      return;
    }
    if (
      [
        "/docs/assets/swagger-ui.css",
        "/docs/assets/swagger-ui-bundle.js",
      ].includes(pathname)
    ) {
      send(
        200,
        await readFile(
          require.resolve("swagger-ui-dist/" + pathname.split("/").at(-1)),
        ),
        pathname.endsWith(".css")
          ? "text/css"
          : "application/javascript; charset=utf-8",
      );
      return;
    }
    if (!methods[pathname]) {
      send(404, { error: "Not found" });
      return;
    }
    if (!methods[pathname].includes(request.method)) {
      send(405, { error: "Method not allowed" }, "application/json", {
        Allow: methods[pathname].join(", "),
      });
      return;
    }
    const grant = credential(request);
    if (!grant) {
      send(401, { error: "Unauthorized gateway" });
      return;
    }
    if (origin && origin !== grant.origin) {
      send(403, { error: "Invalid origin" });
      return;
    }
    if (!grant.user && pathname !== "/api/board") {
      send(401, { error: "Unauthorized" });
      return;
    }
    let body = "";
    try {
      for await (const chunk of request) {
        body += chunk;
        if (body.length > 5000000) {
          send(413, { error: "Payload too large" });
          return;
        }
      }
    } catch {
      return; /* An aborted client must not stop the local server. */
    }
    let input = {};
    try {
      if (body) input = JSON.parse(body);
    } catch {
      send(400, {
        error:
          pathname === "/api/notepad/history"
            ? "Invalid JSON"
            : "Invalid update",
      });
      return;
    }
    const operation = () => {
      const user = grant.user;
      if (pathname === "/api/board")
        return [200, { posts: model.board(user, grant.origin, shareUrl) }];
      if (pathname === "/api/notepad/history")
        return request.method === "GET"
          ? [
              200,
              {
                latest: model.latest(user.id),
                count: model.state.history[user.id]?.length ?? 0,
              },
            ]
          : model.saveHistory(user, input ?? {});
      if (pathname === "/api/groups")
        return [200, { groups: model.list(user) }];
      if (pathname === "/api/groups/share") {
        const [status, result] = model.share(user, input?.group);
        if (status === 200) {
          result.url = shareUrl(
            result.shareLink.groupId,
            result.shareLink.version,
            grant.origin,
          );
          delete result.shareLink;
        }
        return [status, result];
      }
      if (pathname === "/api/groups/join")
        return model.join(user, verifiedLink(input?.token, grant));
      if (pathname === "/api/groups/update")
        return model.update(user, input ?? {});
      if (pathname === "/api/groups/leave" || pathname === "/api/groups/revoke")
        return model.access(user, input?.id, pathname.split("/").at(-1));
      if (pathname === "/api/groups/notifications")
        return request.method === "GET"
          ? [200, { notifications: model.notifications(user) }]
          : model.notificationAction(user, undefined, true);
      if (body && (!Number.isSafeInteger(input?.id) || input.id < 1))
        return [400, { error: "Invalid notification" }];
      return model.notificationAction(user, input?.id);
    };
    const task = queue.then(operation);
    queue = task.catch(() => undefined);
    try {
      const [status, data] = await task;
      send(status, data);
    } catch (error) {
      console.error("Mock API request failed", error.message);
      send(500, { error: "Mock server error" });
    }
  });
}
export const mockApiDirectory = fileURLToPath(new URL(".", import.meta.url));
