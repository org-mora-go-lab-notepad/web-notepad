"use client";

import { useCallback } from "react";

import {
  getActiveGroup,
  getPaneActiveTabId,
  getPaneOfTab,
  type GroupEntry,
  type PaneId,
  useNotepadStore,
} from "@/src/4-entity/notepad";

import type { PaneRefs } from "./use-pane-refs";

type Options = {
  editorRefs: PaneRefs<HTMLTextAreaElement | null>;
};

export function useHomeTabActions({ editorRefs }: Options) {
  // The editor showing the tab, when the tab is active in its pane.
  const editorOfTab = useCallback(
    (group: GroupEntry, tabId: string) => {
      const pane = getPaneOfTab(group, tabId);
      return getPaneActiveTabId(group, pane) === tabId
        ? editorRefs[pane].current
        : null;
    },
    [editorRefs],
  );

  const requestCloseTab = useCallback(
    (tabId: string) => {
      const state = useNotepadStore.getState();
      const group = getActiveGroup(state);
      const tab = group?.tabs.find((item) => item.id === tabId);
      if (!group || !tab) return false;

      const content = editorOfTab(group, tabId)?.value ?? tab.content;
      if (content !== tab.content) state.updateTab(tabId, content);
      state.closeTab(tabId, true);
      return true;
    },
    [editorOfTab],
  );

  const addTabToPane = (pane: PaneId) => {
    const state = useNotepadStore.getState();
    const group = getActiveGroup(state);
    if (!group) return;
    const tabId = getPaneActiveTabId(group, pane);
    const editor = editorRefs[pane].current;

    if (tabId && editor) state.updateTab(tabId, editor.value);
    state.addTab(pane);
  };

  const moveToGroup = (tabId: string, groupId: string) => {
    const state = useNotepadStore.getState();
    const group = getActiveGroup(state);
    if (!group) return;
    const editor = editorOfTab(group, tabId);
    if (
      editor &&
      editor.value !== group.tabs.find((tab) => tab.id === tabId)?.content
    ) {
      state.updateTab(tabId, editor.value);
    }
    state.moveTabToGroup(tabId, groupId);
  };

  return {
    requestCloseTab,
    addTabToPane,
    moveToGroup,
  };
}
