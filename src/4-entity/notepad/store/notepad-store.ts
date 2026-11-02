import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_SETTINGS, UNGROUPED_GROUP_ID } from "../constant";
import { createSafeJsonStorage, normalizePersistedState } from "../persistence";
import type { NotepadState } from "../type";
import { DEFAULT_DASHBOARD_VISIBILITY } from "../util";
import { createBookmarkActions, createClosedTabActions } from "./archive";
import { createSettingActions } from "./setting-actions";
import { createTabActions } from "./tab";
import {
  createGroupActions,
  createGroupEntry,
  createPaneActions,
} from "./workspace";

export {
  ALL_GROUP_ID,
  ALL_GROUP_NAME,
  ALL_MY_GROUP_ID,
  ALL_MY_GROUP_NAME,
  ALL_SHARED_GROUP_ID,
  ALL_SHARED_GROUP_NAME,
  isAggregateGroupId,
  MAX_SPLIT_RATIO,
  MIN_SPLIT_RATIO,
  UNGROUPED_GROUP_ID,
} from "../constant";

export const useNotepadStore = create<NotepadState>()(
  persist(
    (set, get, store) => ({
      ...createTabActions(set, get, store),
      ...createPaneActions(set, get, store),
      ...createBookmarkActions(set, get, store),
      ...createGroupActions(set, get, store),
      ...createClosedTabActions(set, get, store),
      ...createSettingActions(set, get, store),
      nextTabNumber: 1,
      activeGroupId: UNGROUPED_GROUP_ID,
      groups: [createGroupEntry(UNGROUPED_GROUP_ID, "Ungrouped", 0)],
      closedTabs: [],
      allGroupActiveTabId: null,
      allGroupLayout: null,
      allGroupDashboardVisibility: DEFAULT_DASHBOARD_VISIBILITY,
      allGroupDashboardStatusNames: {},
      sharedDashboardVisibility: {},
      settings: DEFAULT_SETTINGS,
    }),
    {
      name: "web-notepad-storage",
      skipHydration: true,
      storage: createSafeJsonStorage<NotepadState>(),
      merge: normalizePersistedState,
    },
  ),
);
