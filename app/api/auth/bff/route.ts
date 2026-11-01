import { createHash, createHmac } from "node:crypto";

import { cookies } from "next/headers";

import {
  readGroupShareToken,
  readSession,
  SESSION_COOKIE,
} from "../_lib/session";

async function grant(request: Request, shareToken?: string) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") && request.headers.get("origin") !== origin)
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const secret =
    process.env.NOTEPAD_BFF_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "notepad-local-bff-only"
      : undefined);
  const url =
    process.env.NOTEPAD_BFF_URL ??
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : undefined);
  if (!secret || !url)
    return Response.json({ error: "Backend unavailable" }, { status: 503 });
  const target = new URL(url);
  if (
    target.username ||
    target.password ||
    target.pathname !== "/" ||
    target.search ||
    target.hash ||
    (target.protocol !== "https:" &&
      !(
        process.env.NODE_ENV === "development" &&
        target.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)
      ))
  )
    return Response.json({ error: "Invalid backend origin" }, { status: 503 });
  const user = readSession((await cookies()).get(SESSION_COOKIE)?.value);
  const groupId = shareToken ? readGroupShareToken(shareToken) : null;
  const expiresAt = Date.now() + 60_000;
  const encoded = Buffer.from(
    JSON.stringify({
      audience: "notepad-browser",
      origin,
      expiresAt,
      user,
      verifiedShareLink: groupId
        ? {
            groupId,
            version:
              shareToken!.split(".").length === 3
                ? Number(shareToken!.split(".")[1])
                : 0,
          }
        : null,
      shareTokenHash: shareToken
        ? createHash("sha256").update(shareToken).digest("hex")
        : null,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update("browser:" + encoded)
    .digest("base64url");
  return Response.json(
    { url: target.origin, token: encoded + "." + signature, expiresAt },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export const GET = (request: Request) => grant(request);
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.shareToken !== "string" || body.shareToken.length > 2048)
      return Response.json({ error: "Invalid credential" }, { status: 400 });
    return grant(request, body.shareToken);
  } catch {
    return Response.json({ error: "Invalid credential" }, { status: 400 });
  }
}
