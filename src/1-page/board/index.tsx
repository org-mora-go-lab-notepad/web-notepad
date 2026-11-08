"use client";

import "./index.scss";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Footer } from "@/src/2-widget";
import { Board } from "@/src/3-feature/board";
import {
  ALL_GROUP_ID,
  ALL_MY_GROUP_ID,
  ALL_SHARED_GROUP_ID,
  getActiveGroup,
  UNGROUPED_GROUP_ID,
  useCloudSave,
  useNotepadHydrated,
  useNotepadStore,
  useSharedGroups,
} from "@/src/4-entity/notepad";
import { HOME_RETURN_FOCUS_KEY, MESSAGES } from "@/src/5-shared/constant";
import { GroupSharingContext, I18nContext } from "@/src/5-shared/hook";
import { isToday } from "@/src/5-shared/util";

function markBoardReturn() {
  try {
    sessionStorage.setItem(HOME_RETURN_FOCUS_KEY, "1");
  } catch {
    /* Keep navigation usable if session storage is unavailable. */
  }
}

export function BoardPage() {
  const router = useRouter();
  const hydrated = useNotepadHydrated();
  const store = useNotepadStore();
  const { settings } = store;
  const activeGroup = getActiveGroup(store);
  const messages = MESSAGES[settings.language];
  const activeGroupName =
    store.activeGroupId === ALL_GROUP_ID
      ? messages.allGroup
      : store.activeGroupId === ALL_MY_GROUP_ID
        ? messages.allMyGroup
        : store.activeGroupId === ALL_SHARED_GROUP_ID
          ? messages.allSharedGroup
          : store.activeGroupId === UNGROUPED_GROUP_ID
            ? messages.ungrouped
            : (activeGroup?.name ?? messages.ungrouped);
  useCloudSave(hydrated);
  const shared = useSharedGroups(hydrated);
  useEffect(markBoardReturn, []);
  useEffect(() => {
    if (shared.authenticated === false) router.replace("/");
  }, [router, shared.authenticated]);
  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.style.setProperty(
      "--font-scale",
      String(settings.fontScale),
    );
  }, [settings.language, settings.fontScale]);
  if (shared.authenticated === false) return null;
  return (
    <I18nContext value={settings.language}>
      <GroupSharingContext
        value={{
          authenticated: shared.authenticated === true,
          loading: shared.loading || shared.checkingGroups,
          refreshGroups: shared.refreshGroups,
          accessByGroup: shared.accessByGroup,
          changeAccess: shared.changeAccess,
        }}
      >
        <main className="board-page" id="board-page">
          <div className="board-page-container">
            {shared.authenticated === true && (
              <Board onReturnHome={markBoardReturn} />
            )}
          </div>
        </main>
        <div className="board-mobile-footer">
          <Footer
            authenticated={shared.authenticated === true}
            hasGroupUpdateToday={store.groups.some((group) =>
              isToday(group.updatedAt),
            )}
            dashboardOpen={false}
            activeGroupName={activeGroupName}
            groupsOpen={false}
            onToggleDashboard={() => {
              markBoardReturn();
              router.push("/?panel=dashboard");
            }}
            onToggleGroups={() => {
              markBoardReturn();
              router.push("/?panel=groups");
            }}
          />
        </div>
      </GroupSharingContext>
    </I18nContext>
  );
}
