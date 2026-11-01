import { bffFetch } from "@/src/5-shared/util";

import type { GroupEntry } from "../type";

export async function createSharedTabLink(group: GroupEntry, tabId: string) {
  let url = new URL("/", window.location.origin);

  try {
    const response = await bffFetch("/api/groups/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group }),
    });
    if (response.ok) {
      const result = (await response.json()) as { url?: unknown };
      if (typeof result.url === "string") url = new URL(result.url);
    }
  } catch {
    // Existing members can still use the direct group link if invites are unavailable.
  }

  url.searchParams.set("group", group.id);
  url.searchParams.set("leftTab", tabId);
  url.searchParams.set("pane", "left");
  return url.toString();
}
