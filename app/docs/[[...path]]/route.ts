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
      spec.servers = [{ url: url.origin, description: "Local BFF direct API" }];
      spec.security = [{ BrowserToken: [] }];
      spec.components.securitySchemes = {};
      spec.components.securitySchemes.BrowserToken = {
        type: "http",
        scheme: "bearer",
        description:
          "web-notepad /api/auth/bff에서 발급받은 단기 token을 입력하세요.",
      };
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
