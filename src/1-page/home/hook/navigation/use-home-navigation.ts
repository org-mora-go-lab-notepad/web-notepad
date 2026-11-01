"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getActiveGroup,
  getPaneActiveTabId,
  getPaneTabs,
  isAggregateGroupId,
  PANE_IDS,
  type PaneId,
  useNotepadStore,
} from "@/src/4-entity/notepad";
import type { ViewPanel } from "@/src/5-shared";

import type { ViewSnapshot } from "../../type";
import { useGroupMenuOpen } from "../use-group-menu-open";
import { useViewActions } from "./use-view-actions";
import { useViewHistory } from "./use-view-history";

type Options = {
  hydrated: boolean;
  addTabToPane: (pane: PaneId) => void;
};

// Docking only applies to the PC layout; mobile keeps the overlay drawer.
const isPinLayout = () => window.matchMedia("(min-width: 641px)").matches;

export function useHomeNavigation({ hydrated, addTabToPane }: Options) {
  const [openPanel, setOpenPanel] = useState<ViewPanel | null>(null);
  const [backgroundPanel, setBackgroundPanel] = useState<ViewPanel | null>(
    null,
  );
  const { groupMenuOpen, updateGroupMenuOpen, getGroupMenuOpen } =
    useGroupMenuOpen();
  // A pinned panel stays open until its X button closes it.
  const keepsPanelOpen = useCallback(
    () =>
      openPanel !== null &&
      openPanel !== "global-search" &&
      openPanel !== "closed" &&
      openPanel !== "bookmarks" &&
      isPinLayout(),
    [openPanel],
  );
  const keepsPanelOpenRef = useRef(keepsPanelOpen);
  useEffect(() => {
    keepsPanelOpenRef.current = keepsPanelOpen;
  }, [keepsPanelOpen]);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const getCurrentView = useCallback(
    (panel: ViewPanel | null = openPanel): ViewSnapshot => {
      const group = getActiveGroup(useNotepadStore.getState());
      return {
        groupId: group?.id ?? "",
        leftTabId: group?.activeTabId ?? "",
        rightTabId: group ? getPaneActiveTabId(group, "right") : null,
        leftBottomTabId: group
          ? getPaneActiveTabId(group, "left-bottom")
          : null,
        rightBottomTabId: group
          ? getPaneActiveTabId(group, "right-bottom")
          : null,
        pane: group?.activePane ?? "left",
        panel,
        groupMenuOpen:
          typeof window !== "undefined" &&
          window.matchMedia("(max-width: 512px)").matches
            ? getGroupMenuOpen()
            : undefined,
      };
    },
    [getGroupMenuOpen, openPanel],
  );

  const restoreView = useCallback(
    (snapshot: ViewSnapshot) => {
      if (
        window.matchMedia("(max-width: 512px)").matches &&
        snapshot.groupMenuOpen !== undefined
      ) {
        updateGroupMenuOpen(snapshot.groupMenuOpen);
      }
      const state = useNotepadStore.getState();
      const exists =
        isAggregateGroupId(snapshot.groupId) ||
        state.groups.some((group) => group.id === snapshot.groupId);
      const fallbackGroupId = state.groups[0]?.id;
      if (!exists && !fallbackGroupId) return;

      state.selectGroup(exists ? snapshot.groupId : fallbackGroupId);
      const targetGroup = getActiveGroup(useNotepadStore.getState());
      if (!targetGroup) return;
      const snapshotTabIds: Record<PaneId, string | null> = {
        left: snapshot.leftTabId,
        right: snapshot.rightTabId,
        "left-bottom": snapshot.leftBottomTabId,
        "right-bottom": snapshot.rightBottomTabId,
      };
      for (const pane of PANE_IDS) {
        const paneTabs = getPaneTabs(targetGroup, pane);
        const tab =
          paneTabs.find((item) => item.id === snapshotTabIds[pane]) ??
          paneTabs[0];
        if (tab) state.selectTab(tab.id);
      }
      state.setActivePane(snapshot.pane);
      setBackgroundPanel(null);
      setOpenPanel((current) =>
        snapshot.panel === null && keepsPanelOpenRef.current()
          ? current
          : snapshot.panel,
      );
    },
    [updateGroupMenuOpen],
  );

  const { pushView, replaceView } = useViewHistory(
    hydrated,
    getCurrentView(null),
    restoreView,
  );

  const replaceCurrentView = useCallback(
    () => replaceView(getCurrentView()),
    [getCurrentView, replaceView],
  );

  useEffect(() => {
    window.addEventListener("notepad-cloud-applied", replaceCurrentView);
    return () =>
      window.removeEventListener("notepad-cloud-applied", replaceCurrentView);
  }, [replaceCurrentView]);

  const closeGroupMenu = useCallback(() => {
    updateGroupMenuOpen(false);
    if (window.matchMedia("(max-width: 512px)").matches)
      replaceView(getCurrentView());
  }, [getCurrentView, replaceView, updateGroupMenuOpen]);

  const toggleGroupMenu = useCallback(() => {
    const open = !getGroupMenuOpen();
    updateGroupMenuOpen(open);
    if (window.matchMedia("(max-width: 512px)").matches) {
      if (open) pushView(getCurrentView());
      else replaceView(getCurrentView());
    }
  }, [
    getCurrentView,
    getGroupMenuOpen,
    pushView,
    replaceView,
    updateGroupMenuOpen,
  ]);

  const closeSidePanels = useCallback(() => {
    if (openPanel === null) return;
    if (
      backgroundPanel &&
      (openPanel === "global-search" ||
        openPanel === "closed" ||
        openPanel === "bookmarks")
    ) {
      setOpenPanel(backgroundPanel);
      setBackgroundPanel(null);
      pushView(getCurrentView(backgroundPanel));
      return;
    }
    setOpenPanel(null);
    setBackgroundPanel(null);
    pushView(getCurrentView(null));
  }, [backgroundPanel, getCurrentView, openPanel, pushView]);

  const toggleSidePanel = useCallback(
    (panel: ViewPanel) => {
      if (openPanel === panel) {
        if (
          panel === "bookmarks" ||
          panel === "board" ||
          panel === "dashboard" ||
          panel === "global-search" ||
          panel === "closed" ||
          !keepsPanelOpen()
        )
          closeSidePanels();
        return;
      }
      if (
        (panel === "global-search" ||
          panel === "closed" ||
          panel === "bookmarks") &&
        keepsPanelOpen()
      ) {
        setBackgroundPanel(openPanel);
      } else {
        setBackgroundPanel(null);
      }
      setOpenPanel(panel);
      pushView(getCurrentView(panel));
    },
    [closeSidePanels, getCurrentView, keepsPanelOpen, openPanel, pushView],
  );

  // Records a panel action; the panel closes unless it is pinned.
  const finishPanelAction = useCallback(() => {
    const panel = keepsPanelOpen() ? openPanel : null;
    setOpenPanel(panel);
    pushView(getCurrentView(panel));
  }, [getCurrentView, keepsPanelOpen, openPanel, pushView]);

  const finishBookmarkAction = useCallback(() => {
    if (window.matchMedia("(max-width: 512px)").matches)
      updateGroupMenuOpen(false);
    finishPanelAction();
  }, [finishPanelAction, updateGroupMenuOpen]);

  const actions = useViewActions({
    getCurrentView,
    pushView,
    finishPanelAction,
    finishBookmarkAction,
    addTabToPane,
  });

  useEffect(() => {
    if (openPanel === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        event.isComposing ||
        event.defaultPrevented ||
        document.querySelector("dialog[open]")
      )
        return;
      if (keepsPanelOpen()) return;
      event.preventDefault();
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
      if (openPanel === "global-search") setGlobalSearchQuery("");
      closeSidePanels();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSidePanels, keepsPanelOpen, openPanel]);

  return {
    groupMenuOpen,
    closeGroupMenu,
    toggleGroupMenu,
    openPanel,
    backgroundPanel,
    globalSearchQuery,
    setGlobalSearchQuery,
    closeSidePanels,
    toggleSidePanel,
    replaceCurrentView,
    ...actions,
  };
}
