"use client";

import "./index.scss";

import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { useCloudSave, useHome, useSharedGroups } from "@/src/1-page/home/hook";
import { readViewFromUrl } from "@/src/1-page/home/util";
import { Footer, Panel } from "@/src/2-widget";
import { NoteEditor } from "@/src/3-feature";
import { isSharedGroupId, useNotepadStore } from "@/src/4-entity/notepad";
import { MESSAGES } from "@/src/5-shared/constant";
import {
  AccountActionsContext,
  GroupSharingContext,
  I18nContext,
  SavingTabsContext,
} from "@/src/5-shared/hook";

import { Loading, PaneColumn } from "./component";

const SHARED_TAB_LINK_KEY = "web-notepad-pending-shared-tab-link";
const SHARED_TAB_LINK_MAX_AGE = 10 * 60 * 1000;

export function Home() {
  const router = useRouter();
  const sheetEditorRef = useRef<HTMLTextAreaElement>(null);
  const sheetComposingRef = useRef(false);
  const {
    hydrated,
    groupMenuOpen,
    closeGroupMenu,
    toggleGroupMenu,
    globalSearchQuery,
    setGlobalSearchQuery,
    openPanel,
    backgroundPanel,
    toggleSidePanel,
    closeSidePanels,
    activeGroupId,
    selectGroupAndClosePanel,
    openBookmarkAndClosePanel,
    openTabAndClosePanel,
    openSearchTabAndClosePanel,
    activeTab,
    split,
    activeGroupTabs,
    tabColorCycle,
    moveDashboardTab,
    toggleBookmark,
    moveToGroup,
    deleteDashboardTab,
    groups,
    activeGroupName,
    hasGroupUpdateToday,
    swipeMobileTab,
    columns,
    removeBookmark,
    createGroupAndRecord,
    renameGroup,
    setGroupStatusNames,
    setGroupDashboardVisibility,
    dashboardVisibility,
    dashboardStatusNames,
    toggleGroupPin,
    moveGroup,
    removeGroupAndRecord,
    fontScale,
    language,
    groupPosition,
    panelPosition,
  } = useHome();
  const {
    status: cloudSaveStatus,
    savingTabIds,
    initialSyncing,
    ready: cloudReady,
  } = useCloudSave(hydrated);
  const shared = useSharedGroups(hydrated);
  const [sharedTabLink] = useState(() => {
    if (typeof window === "undefined") return null;
    const view = readViewFromUrl();
    if (view && isSharedGroupId(view.groupId)) {
      const link = { groupId: view.groupId, tabId: view.leftTabId };
      try {
        sessionStorage.setItem(
          SHARED_TAB_LINK_KEY,
          JSON.stringify({ ...link, savedAt: Date.now() }),
        );
      } catch {
        /* The current page can still open the link. */
      }
      return link;
    }
    try {
      const stored = JSON.parse(
        sessionStorage.getItem(SHARED_TAB_LINK_KEY) ?? "null",
      );
      if (
        stored &&
        isSharedGroupId(stored.groupId) &&
        typeof stored.tabId === "string" &&
        typeof stored.savedAt === "number" &&
        Date.now() - stored.savedAt < SHARED_TAB_LINK_MAX_AGE
      )
        return {
          groupId: stored.groupId as string,
          tabId: stored.tabId as string,
        };
      sessionStorage.removeItem(SHARED_TAB_LINK_KEY);
    } catch {
      /* A blocked or damaged session store does not block the workspace. */
    }
    return null;
  });
  const sharedTabLinkOpened = useRef(false);
  const { inviteStatus, dismissInvite } = shared;
  const entryOpened = useRef(false);
  const inviteRef = useRef<HTMLElement>(null);
  const messages = MESSAGES[language];
  const cloudSaveText = {
    pending: messages.cloudPending,
    saving: messages.cloudSaving,
    saved: messages.cloudSaved,
    error: messages.cloudError,
  };
  const isMobileViewport = () =>
    window.matchMedia("(max-width: 512px)").matches;
  const toggleDashboardFromFooter = () => {
    if (isMobileViewport()) closeGroupMenu();
    toggleSidePanel("dashboard");
  };
  const toggleGroupsFromFooter = () => {
    if (isMobileViewport()) closeSidePanels();
    toggleGroupMenu();
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.style.setProperty(
      "--font-scale",
      String(fontScale),
    );
  }, [language, fontScale]);

  useEffect(() => {
    if (
      !sharedTabLink ||
      sharedTabLinkOpened.current ||
      !hydrated ||
      shared.loading ||
      shared.checkingGroups ||
      !shared.accessByGroup[sharedTabLink.groupId]?.active
    )
      return;
    const state = useNotepadStore.getState();
    const group = state.groups.find(
      (item) => item.id === sharedTabLink.groupId,
    );
    if (!group?.tabs.some((tab) => tab.id === sharedTabLink.tabId)) return;
    sharedTabLinkOpened.current = true;
    state.selectGroup(sharedTabLink.groupId);
    state.selectTab(sharedTabLink.tabId);
    try {
      sessionStorage.removeItem(SHARED_TAB_LINK_KEY);
    } catch {
      /* The selected tab remains available. */
    }
  }, [hydrated, shared, sharedTabLink]);

  useEffect(() => {
    if (!hydrated || entryOpened.current) return;
    entryOpened.current = true;
    const panel = new URLSearchParams(window.location.search).get("panel");
    if (panel === "board") {
      router.replace("/board");
      return;
    }
    if (panel === "guide") {
      const url = new URL(window.location.href);
      url.searchParams.delete("panel");
      window.history.replaceState(window.history.state, "", url);
      window.dispatchEvent(new Event("notepad-open-guide"));
      return;
    }
    if (panel === "groups") {
      closeSidePanels();
      if (!groupMenuOpen) toggleGroupMenu();
      return;
    }
    if (
      panel === "settings" ||
      panel === "dashboard" ||
      panel === "bookmarks" ||
      panel === "global-search"
    ) {
      if (openPanel !== panel) toggleSidePanel(panel);
    }
  }, [
    hydrated,
    closeGroupMenu,
    closeSidePanels,
    groupMenuOpen,
    openPanel,
    toggleGroupMenu,
    toggleSidePanel,
    router,
  ]);

  useEffect(() => {
    if (!inviteStatus || inviteStatus === "joining") return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const controls = () =>
      Array.from(
        inviteRef.current?.querySelectorAll<HTMLElement>("a[href], button") ??
          [],
      );
    controls()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismissInvite();
        return;
      }
      if (event.key !== "Tab") return;
      const items = controls();
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === items[items.length - 1]
      ) {
        event.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [inviteStatus, dismissInvite]);

  if (!hydrated) {
    return (
      <main className="home is-loading" aria-busy="true">
        <Loading />
      </main>
    );
  }

  const syncLocked = !cloudReady || initialSyncing;

  return (
    <I18nContext value={language}>
      <AccountActionsContext
        value={{
          onOpenSettings: () => {
            if (openPanel !== "settings") toggleSidePanel("settings");
          },
        }}
      >
        <GroupSharingContext
          value={{
            authenticated: shared.authenticated === true,
            loading: shared.loading || shared.checkingGroups,
            refreshGroups: shared.refreshGroups,
            accessByGroup: shared.accessByGroup,
            changeAccess: shared.changeAccess,
          }}
        >
          <SavingTabsContext value={[...savingTabIds, ...shared.savingTabIds]}>
            <main
              className={`home ${syncLocked ? "is-loading" : ""} ${groupMenuOpen ? "is-group-sidebar-open" : ""} ${backgroundPanel || (openPanel && openPanel !== "global-search" && openPanel !== "closed" && openPanel !== "bookmarks") ? "is-panel-pinned" : ""}`}
              style={{ "--font-scale": fontScale } as CSSProperties}
              data-panel-position={panelPosition}
              data-group-position={groupPosition}
              data-cloud-save={cloudSaveStatus ?? "idle"}
              aria-busy={syncLocked}
            >
              {syncLocked && <Loading />}
              <section className="workspace">
                <div className={`pane-group ${split ? "is-split" : ""}`}>
                  {columns.map((column) => (
                    <PaneColumn
                      key={column.column}
                      {...column}
                      panes={column.panes}
                    />
                  ))}
                </div>

                <Footer
                  authenticated={shared.authenticated === true}
                  hasGroupUpdateToday={hasGroupUpdateToday}
                  dashboardOpen={
                    openPanel === "dashboard" || backgroundPanel === "dashboard"
                  }
                  activeGroupName={activeGroupName}
                  groupsOpen={groupMenuOpen}
                  groups={groups}
                  onSwipeTabs={
                    activeTab &&
                    !groupMenuOpen &&
                    !openPanel &&
                    !backgroundPanel
                      ? swipeMobileTab
                      : undefined
                  }
                  onToggleDashboard={toggleDashboardFromFooter}
                  onToggleGroups={toggleGroupsFromFooter}
                  onSelectGroup={selectGroupAndClosePanel}
                  onOpenGuide={() =>
                    window.dispatchEvent(new Event("notepad-open-guide"))
                  }
                  searchOpen={openPanel === "global-search"}
                  onOpenSettings={() => {
                    if (openPanel !== "settings") toggleSidePanel("settings");
                  }}
                  onToggleBookmarks={() => toggleSidePanel("bookmarks")}
                  onToggleSearch={() => toggleSidePanel("global-search")}
                />
              </section>

              {cloudSaveStatus && (
                <span
                  className="cloud-save-announcement"
                  role="status"
                  aria-live="polite"
                >
                  {cloudSaveText[cloudSaveStatus]}
                </span>
              )}
              {inviteStatus && (
                <div className="share-invite-backdrop">
                  <section
                    ref={inviteRef}
                    className="share-invite-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-label={messages.shareGroup}
                  >
                    <p>
                      {inviteStatus === "login"
                        ? messages.shareInviteLogin
                        : inviteStatus === "joining"
                          ? messages.shareInviteJoining
                          : inviteStatus === "joined"
                            ? messages.shareInviteJoined
                            : messages.shareInviteError}
                    </p>
                    {inviteStatus === "login" && shared.inviteToken && (
                      <a
                        href={`/api/auth/oauth/kakao?share=${encodeURIComponent(shared.inviteToken)}`}
                      >
                        {messages.kakaoLogin}
                      </a>
                    )}
                    {inviteStatus !== "joining" && (
                      <button type="button" onClick={dismissInvite}>
                        {messages.close}
                      </button>
                    )}
                  </section>
                </div>
              )}

              <Panel
                activeGroupName={activeGroupName}
                renderTabEditor={(tab) => (
                  <NoteEditor
                    tab={tab}
                    editorRef={sheetEditorRef}
                    composingRef={sheetComposingRef}
                    onChange={(content) =>
                      useNotepadStore.getState().updateTab(tab.id, content)
                    }
                  />
                )}
                activeTabId={activeTab?.id}
                openPanel={openPanel}
                backgroundPanel={backgroundPanel}
                activeGroupTabs={activeGroupTabs}
                tabColorCycle={tabColorCycle}
                groups={groups}
                activeGroupId={activeGroupId}
                groupMenuOpen={groupMenuOpen}
                onCloseGroupMenu={closeGroupMenu}
                globalSearchQuery={globalSearchQuery}
                onClose={closeSidePanels}
                onGlobalSearchQueryChange={setGlobalSearchQuery}
                onOpenBookmark={openBookmarkAndClosePanel}
                onRemoveBookmark={removeBookmark}
                onOpenDashboardTab={openTabAndClosePanel}
                onMoveDashboardCard={moveDashboardTab}
                onMoveDashboardTabToGroup={moveToGroup}
                onToggleDashboardTabBookmark={toggleBookmark}
                onDeleteDashboardTab={deleteDashboardTab}
                onCreateGroup={createGroupAndRecord}
                onSelectGroup={selectGroupAndClosePanel}
                onSelectSearchTab={openSearchTabAndClosePanel}
                onRemoveGroup={removeGroupAndRecord}
                onRenameGroup={renameGroup}
                onSaveDashboardStatusNames={(names) =>
                  setGroupStatusNames(activeGroupId, names)
                }
                dashboardVisibility={dashboardVisibility}
                dashboardStatusNames={dashboardStatusNames}
                onDashboardVisibilityChange={(visibility) =>
                  setGroupDashboardVisibility(activeGroupId, visibility)
                }
                onToggleGroupPin={toggleGroupPin}
                onMoveGroup={moveGroup}
                onOpenShortcuts={() => toggleSidePanel("shortcuts")}
              />
            </main>
          </SavingTabsContext>
        </GroupSharingContext>
      </AccountActionsContext>
    </I18nContext>
  );
}
