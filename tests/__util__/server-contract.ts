import {
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import { signedSession } from "../__fixture__";
import { authenticateBrowser } from "./auth";
import { postApi } from "./request";
import { getApi } from "./request";

export const origin = { Origin: "http://localhost:3000" };
export const foreignOrigin = { Origin: "https://attacker.example" };

export function sessionToken(id = `server-${crypto.randomUUID()}`) {
  return signedSession({
    id,
    nickname: "Server Tester",
    expiresAt: Date.now() + 300_000,
  });
}

export async function authenticate(context: BrowserContext, id?: string) {
  await authenticateBrowser(context, sessionToken(id));
}

export function snapshot(contents = ["server note"]) {
  return JSON.stringify({
    nextTabNumber: contents.length + 1,
    groups: [
      {
        id: "ungrouped",
        name: "Ungrouped",
        tabs: contents.map((content, index) => ({
          id: `tab-${index + 1}`,
          title: content,
          content,
          open: true,
        })),
        bookmarks: [],
      },
    ],
    activeGroupId: "ungrouped",
    closedTabs: [],
    settings: { language: "en", fontScale: 0.9 },
  });
}

export async function historyPost(
  page: Page,
  body: Record<string, unknown>,
  headers = origin,
) {
  return postApi(page.request, "/api/notepad/history", {
    headers,
    data: body,
  });
}

export async function oauthStart(request: APIRequestContext, path = "") {
  return getApi(request, `/api/auth/oauth/kakao${path}`, { maxRedirects: 0 });
}

export const invalidGroupBase = {
  group: {
    id: "local-group",
    name: "Server Group",
    tabs: [{ id: "tab-1", content: "valid content" }],
    bookmarks: [],
  },
};
