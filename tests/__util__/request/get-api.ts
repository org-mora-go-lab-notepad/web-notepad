import type { APIRequestContext } from "@playwright/test";

import { bffRequest } from "./bff-request";

const readOnlyPaths = new Set([
  "/api/auth/session",
  "/api/board",
  "/api/groups",
  "/api/groups/notifications",
  "/api/notepad/history",
]);

// Playwright retries ECONNRESET only; HTTP responses still reach each assertion.
export function getApi(
  request: APIRequestContext,
  url: string,
  options?: Parameters<APIRequestContext["get"]>[1],
) {
  const path = new URL(url, "http://localhost").pathname;
  return bffRequest(request, "get", url, {
    maxRetries: readOnlyPaths.has(path) ? 2 : 0,
    ...options,
  });
}
