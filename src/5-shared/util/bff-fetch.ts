type Grant = { url: string; token: string; expiresAt: number };
let generation = 0;
let pending: Promise<Grant> | undefined;
let cached: Grant | undefined;
if (typeof window !== "undefined")
  window.addEventListener("notepad-auth-changed", () => {
    generation += 1;
    cached = undefined;
    pending = undefined;
  });
async function getGrant(shareToken?: string): Promise<Grant> {
  if (!shareToken && cached && cached.expiresAt > Date.now() + 5_000)
    return cached;
  const load = async () => {
    const response = await fetch("/api/auth/bff", {
      cache: "no-store",
      ...(shareToken
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shareToken }),
          }
        : {}),
    });
    if (!response.ok) throw new Error("BFF authentication unavailable");
    return response.json() as Promise<Grant>;
  };
  if (shareToken) return load();
  if (!pending) {
    const started = generation;
    const work = load()
      .then((value) => {
        if (started !== generation) throw new Error("Authentication changed");
        cached = value;
        return value;
      })
      .finally(() => {
        if (pending === work) pending = undefined;
      });
    pending = work;
  }
  return pending;
}
export async function bffFetch(path: string, options: RequestInit = {}) {
  let shareToken: string | undefined;
  if (path === "/api/groups/join" && typeof options.body === "string") {
    try {
      shareToken = JSON.parse(options.body).token;
    } catch {
      /* BFF validates malformed payloads. */
    }
  }
  const started = generation;
  const grant = await getGrant(shareToken);
  if (started !== generation) throw new Error("Authentication changed");
  const headers = new Headers(options.headers);
  headers.set("Authorization", "Bearer " + grant.token);
  return fetch(new URL(path, grant.url), {
    ...options,
    headers,
    credentials: "omit",
    redirect: "error",
  });
}
