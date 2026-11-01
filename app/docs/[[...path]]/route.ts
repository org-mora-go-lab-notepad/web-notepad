const resources = new Set([
  "",
  "openapi.json",
  "assets/swagger-ui.css",
  "assets/swagger-ui-bundle.js",
  "assets/initializer.js",
]);

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  if (process.env.NODE_ENV !== "development")
    return new Response(null, { status: 404 });
  const resource = (await context.params).path?.join("/") ?? "";
  if (!resources.has(resource)) return new Response(null, { status: 404 });
  const url = new URL(process.env.NOTEPAD_BFF_URL ?? "http://localhost:3001");
  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password
  )
    return new Response("Local BFF URL required", { status: 503 });
  url.pathname = "/docs" + (resource ? "/" + resource : "");
  url.search = "";
  url.hash = "";
  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok)
      return new Response("BFF documentation unavailable", { status: 503 });
    if (resource === "openapi.json") {
      const spec = await response.json();
      spec.servers = [
        {
          url: "/",
          description:
            "Local web-notepad → BFF (same-origin Kakao/Test session)",
        },
      ];
      spec.security = [{ FrontendSession: [] }];
      spec.components.securitySchemes = {
        FrontendSession: {
          type: "apiKey",
          in: "cookie",
          name: "web-notepad-session",
          description:
            "먼저 web-notepad에서 로그인하세요. HttpOnly 세션 쿠키는 브라우저가 자동으로 전달합니다. 수동 입력하지 않습니다.",
        },
      };
      const share =
        spec.paths["/api/groups/share"].post.responses["200"].content[
          "application/json"
        ].schema;
      delete share.properties.shareLink;
      share.properties.url = { type: "string", format: "uri" };
      share.required = ["url", "group", "revision"];
      const post = spec.components.schemas.BoardPost;
      delete post.properties.shareLink;
      post.properties.inviteUrl = { type: "string", format: "uri" };
      post.required = post.required.map((key: string) =>
        key === "shareLink" ? "inviteUrl" : key,
      );
      spec.paths["/api/groups/join"].post.description =
        "기존 공유 링크 token을 전달합니다. 프런트가 기존 키로 검증한 뒤 BFF에 서명된 검증 결과를 전달합니다.";
      delete spec.paths["/api/health"];
      return Response.json(spec, { headers: { "Cache-Control": "no-store" } });
    }
    return new Response(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "text/plain",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(
      "BFF documentation unavailable. Run npm run dev:local.",
      { status: 503 },
    );
  }
}
