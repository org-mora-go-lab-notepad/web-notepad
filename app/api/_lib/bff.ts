import "server-only";

import { createHash, createHmac } from "node:crypto";

import { cookies } from "next/headers";

import { readSession, SESSION_COOKIE } from "../auth/_lib/session";

export async function forwardToBff(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const base =
    process.env.NOTEPAD_BFF_URL ??
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : undefined);
  const secret =
    process.env.NOTEPAD_BFF_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "notepad-local-bff-only"
      : undefined);
  if (!base || !secret)
    return Response.json(
      { error: "Backend unavailable" },
      { status: 503, headers },
    );
  try {
    const target = new URL(base);
    if (
      target.username ||
      target.password ||
      target.search ||
      target.hash ||
      target.pathname !== "/"
    )
      throw new Error("BFF URL must be an origin");
    if (
      target.protocol !== "https:" &&
      !(
        process.env.NODE_ENV === "development" &&
        target.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)
      )
    )
      throw new Error("BFF requires HTTPS");
    const incoming = new URL(request.url);
    target.pathname = incoming.pathname;
    target.search = incoming.search;
    const body = Buffer.from(await request.arrayBuffer());
    const cookieStore = await cookies();
    const user = readSession(cookieStore.get(SESSION_COOKIE)?.value);
    const context = Buffer.from(
      JSON.stringify({
        version: 1,
        issuedAt: Date.now(),
        user,
        url: request.url,
        method: request.method,
        origin: request.headers.get("origin"),
        contentType: request.headers.get("content-type"),
        bodyHash: createHash("sha256").update(body).digest("hex"),
      }),
    ).toString("base64url");
    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        "x-notepad-context": context,
        "x-notepad-signature": createHmac("sha256", secret)
          .update(context)
          .digest("base64url"),
      },
      body: ["GET", "HEAD"].includes(request.method) ? undefined : body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
    // Only protocol headers cross the boundary; BFF cannot replace login cookies.
    const responseHeaders = new Headers(headers);
    for (const name of ["content-type", "allow", "retry-after"])
      if (upstream.headers.has(name))
        responseHeaders.set(name, upstream.headers.get(name)!);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    // Never retry writes: a disconnected response may already have been committed.
    return Response.json(
      { error: "Backend unavailable" },
      { status: 503, headers },
    );
  }
}
