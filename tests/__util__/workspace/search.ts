import type { Page } from "@playwright/test";

import type {
  BookmarkEntry,
  GroupEntry,
  NoteTab,
} from "@/src/4-entity/notepad";

import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { writeStoredState } from "../state";

export async function seedSearchWorkspace(
  page: Page,
  bookmarks: BookmarkEntry[] = [],
  otherGroups: GroupEntry[] = [],
) {
  await seedSearchTabs(
    page,
    [createTabFixture("tab-1", "Editor")],
    otherGroups,
    bookmarks,
  );
}

export async function seedSearchTabs(
  page: Page,
  tabs: NoteTab[],
  otherGroups: GroupEntry[] = [],
  bookmarks: BookmarkEntry[] = [],
) {
  await writeStoredState(page, {
    activeGroupId: "ungrouped",
    groups: [
      createGroupFixture("ungrouped", "Ungrouped", tabs, { bookmarks }),
      ...otherGroups,
    ],
  });
}
