import "server-only";

import {
  createGroupShareToken,
  readGroupShareToken,
} from "../auth/_lib/session";

// Only the frontend sees the existing session/link signing key.
export function verifiedShareLink(path: string, method: string, body: Buffer) {
  if (path !== "/api/groups/join" || method !== "POST") return null;
  try {
    const { token } = JSON.parse(body.toString("utf8"));
    if (typeof token !== "string") return null;
    const groupId = readGroupShareToken(token);
    return groupId
      ? {
          groupId,
          version:
            token.split(".").length === 3 ? Number(token.split(".")[1]) : 0,
        }
      : null;
  } catch {
    return null;
  }
}

type ShareLink = { groupId: string; version: number };
export function signedShareUrl(link: ShareLink, requestUrl: string) {
  const url = new URL("/", requestUrl);
  url.searchParams.set(
    "share",
    createGroupShareToken(link.groupId, link.version),
  );
  return url.toString();
}

export function signResponseLinks(
  path: string,
  method: string,
  payload: Record<string, unknown>,
  requestUrl: string,
) {
  if (path === "/api/groups/share" && method === "POST") {
    const { shareLink, ...rest } = payload;
    return { ...rest, url: signedShareUrl(shareLink as ShareLink, requestUrl) };
  }
  if (path === "/api/board" && method === "GET") {
    const posts = payload.posts as (Record<string, unknown> & {
      shareLink: ShareLink;
    })[];
    return {
      ...payload,
      posts: posts.map(({ shareLink, ...post }) => ({
        ...post,
        inviteUrl: signedShareUrl(shareLink, requestUrl),
      })),
    };
  }
  return payload;
}
