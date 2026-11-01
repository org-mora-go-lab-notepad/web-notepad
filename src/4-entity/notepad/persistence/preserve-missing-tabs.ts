import type { NotepadState } from "../type";

// Repair only omissions rejected by the server. Keep current edits, moves,
// archives and unrelated groups; never replace the entire local workspace.
export function preserveMissingTabs(
  local: string,
  remote: string,
  protectedIds: string[],
) {
  const next = JSON.parse(local) as Pick<NotepadState, "groups" | "closedTabs">;
  const previous = JSON.parse(remote) as typeof next;
  const ids = new Set([
    ...next.groups.flatMap((group) => group.tabs.map((tab) => tab.id)),
    ...next.closedTabs.map((entry) => entry.tab.id),
  ]);
  const protectedSet = new Set(protectedIds);
  for (const group of previous.groups) {
    const missing = group.tabs.filter(
      (tab) => protectedSet.has(tab.id) && !ids.has(tab.id),
    );
    if (!missing.length) continue;
    const target = next.groups.find((item) => item.id === group.id);
    if (!target) next.groups.push({ ...group, tabs: missing });
    else {
      target.tabs.push(...missing);
      const bookmarkIds = new Set(target.bookmarks.map((item) => item.id));
      target.bookmarks.push(
        ...group.bookmarks.filter(
          (item) =>
            missing.some((tab) => tab.id === item.sourceTabId) &&
            !bookmarkIds.has(item.id),
        ),
      );
    }
    for (const tab of missing) ids.add(tab.id);
  }
  next.closedTabs.push(
    ...previous.closedTabs.filter(
      (entry) => protectedSet.has(entry.tab.id) && !ids.has(entry.tab.id),
    ),
  );
  return JSON.stringify(next);
}
