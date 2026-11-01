import type { APIRequestContext } from "@playwright/test";
export async function bffRequest(
  request: APIRequestContext,
  method: "get" | "post",
  path: string,
  options?: Parameters<APIRequestContext["post"]>[1],
) {
  if (!/^\/api\/(groups|notepad|board)(\/|$)/.test(path))
    return request[method](path, options);
  const data = options?.data;
  const shareToken =
    path === "/api/groups/join" &&
    data &&
    typeof data === "object" &&
    "token" in data
      ? data.token
      : undefined;
  const headers = options?.headers ?? {};
  const cookie = Object.entries(headers).find(
    ([name]) => name.toLowerCase() === "cookie",
  );
  const auth = await request[shareToken ? "post" : "get"](
    "http://localhost:3000/api/auth/bff",
    {
      headers: cookie ? { Cookie: cookie[1] } : {},
      ...(shareToken ? { data: { shareToken } } : {}),
    },
  );
  if (!auth.ok()) throw new Error("BFF grant failed: " + auth.status());
  const grant = await auth.json();
  return request[method](new URL(path, grant.url).toString(), {
    ...options,
    headers: { ...headers, Authorization: "Bearer " + grant.token },
  });
}
export function postApi(
  request: APIRequestContext,
  path: string,
  options?: Parameters<APIRequestContext["post"]>[1],
) {
  return bffRequest(request, "post", path, options);
}
