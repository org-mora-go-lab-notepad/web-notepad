"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { GroupSharingAccess } from "@/src/5-shared/type";
import { bffFetch } from "@/src/5-shared/util";

import { UNGROUPED_GROUP_ID } from "../../constant";
import { useNotepadStore } from "../../store";
import type { GroupEntry, SharedGroupData } from "../../type";
import {
  applySharedGroupData,
  createJoinedGroup,
  isSharedGroupId,
  mergeSharedGroupData,
  SHARED_TAB_DELETE_INTENT_EVENT,
  toSharedGroupData,
} from "../../util";

type SharedRecord = {
  id: string;
  ownerId: string;
  revision: number;
  data: SharedGroupData;
  updatedAt: number;
  sharingActive?: boolean;
};
export type ShareInviteStatus = "login" | "joining" | "joined" | "error" | null;
type PendingGroup = {
  base: SharedRecord;
  data: SharedGroupData;
  deletedTabIds?: string[];
  emptyClosedTabIds?: string[];
  movedTabs?: { id: string; content: string }[];
};
const same = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right);

export function useSharedGroups(hydrated: boolean) {
  const [loading, setLoading] = useState(true);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [checkingGroups, setCheckingGroups] = useState(false);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const [savingTabIds, setSavingTabIds] = useState<string[]>([]);
  const [accessByGroup, setAccessByGroup] = useState<
    Record<string, GroupSharingAccess>
  >({});
  const [inviteStatus, setInviteStatus] = useState<ShareInviteStatus>(null);
  const [inviteToken] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("share"),
  );

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    let userId: string | null = null;
    let sessionChecked = false;
    let refreshing = false;
    let refreshQueued = false;
    const refreshWaiters: Array<() => void> = [];
    let applying = false;
    const baselines = new Map<string, SharedRecord>();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const sending = new Set<string>();
    const editedContents = new Map<string, string>();
    const changedBeforeLoad = new Set<string>();
    const explicitDeletes = new Map<string, Set<string>>();
    const movedContents = new Map<string, string>();
    const emptyCloses = new Set<string>();
    const pendingKey = (id: string, groupId: string) =>
      `web-notepad-shared-pending:${id}:${groupId}`;
    const share = inviteToken;

    const currentGroup = (id: string) =>
      useNotepadStore.getState().groups.find((group) => group.id === id);
    const clearTimer = (id: string) => {
      const timer = timers.get(id);
      if (timer) clearTimeout(timer);
      timers.delete(id);
    };
    const applyData = (data: SharedGroupData) => {
      applying = true;
      try {
        useNotepadStore.setState((state) => {
          const current = state.groups.find((group) => group.id === data.id);
          return {
            groups: current
              ? state.groups.map((group) =>
                  group.id === data.id
                    ? applySharedGroupData(group, data)
                    : group,
                )
              : [...state.groups, createJoinedGroup(data)],
          };
        });
      } finally {
        applying = false;
      }
    };
    const persistPending = (id: string, pending: PendingGroup | null) => {
      if (!userId) return;
      try {
        if (pending)
          localStorage.setItem(pendingKey(userId, id), JSON.stringify(pending));
        else localStorage.removeItem(pendingKey(userId, id));
      } catch {
        /* Local edits remain available. */
      }
    };
    const approvedDeletedTabIds = (
      id: string,
      base: SharedRecord,
      data: SharedGroupData,
    ) => {
      const nextIds = new Set(data.tabs.map((tab) => tab.id));
      const approved = explicitDeletes.get(id);
      return base.data.tabs
        .filter((tab) => !nextIds.has(tab.id) && approved?.has(tab.id))
        .map((tab) => tab.id);
    };
    const dataForSave = (id: string, group: GroupEntry) => {
      const data = toSharedGroupData(group);
      const deleted = explicitDeletes.get(id);
      if (!deleted?.size) return data;
      const tabs = data.tabs.filter((tab) => !deleted.has(tab.id));
      const tabIds = new Set(tabs.map((tab) => tab.id));
      return {
        ...data,
        tabs,
        bookmarks: data.bookmarks.filter((bookmark) =>
          tabIds.has(bookmark.sourceTabId),
        ),
      };
    };
    const applySavedDeletes = (id: string, deletedTabIds: string[]) => {
      if (!deletedTabIds.length) return;
      const deleted = new Set(deletedTabIds);
      applying = true;
      try {
        useNotepadStore.setState((state) => ({
          groups: state.groups.map((group) => {
            if (group.id !== id) return group;
            const data = toSharedGroupData(group);
            const tabs = data.tabs.filter((tab) => !deleted.has(tab.id));
            const tabIds = new Set(tabs.map((tab) => tab.id));
            return applySharedGroupData(group, {
              ...data,
              tabs,
              bookmarks: data.bookmarks.filter((bookmark) =>
                tabIds.has(bookmark.sourceTabId),
              ),
            });
          }),
        }));
      } finally {
        applying = false;
      }
    };

    const flush = async (id: string) => {
      timers.delete(id);
      const base = baselines.get(id);
      const group = currentGroup(id);
      if (!active || !userId || !base || !group || sending.has(id)) return;
      const data = dataForSave(id, group);
      if (same(data, base.data)) {
        explicitDeletes.delete(id);
        persistPending(id, null);
        return;
      }
      sending.add(id);
      const deletedTabIds = approvedDeletedTabIds(id, base, data);
      const sentContents = new Map(
        data.tabs
          .filter((tab) => editedContents.get(tab.id) === tab.content)
          .map((tab) => [tab.id, tab.content]),
      );
      setSavingTabIds((current) => [
        ...new Set([...current, ...sentContents.keys()]),
      ]);
      try {
        const response = await bffFetch("/api/groups/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            baseRevision: base.revision,
            data,
            deletedTabIds,
            emptyClosedTabIds: deletedTabIds.filter((tabId) =>
              emptyCloses.has(tabId),
            ),
            movedTabIds: deletedTabIds.filter(
              (tabId) => !emptyCloses.has(tabId),
            ),
            movedTabs: deletedTabIds
              .filter((tabId) => !emptyCloses.has(tabId))
              .map((tabId) => ({
                id: tabId,
                content:
                  movedContents.get(tabId) ??
                  base.data.tabs.find((tab) => tab.id === tabId)!.content,
              })),
          }),
        });
        if (response.status === 409) {
          // Never carry an empty-close authorization over another user's revision.
          for (const tabId of deletedTabIds) {
            if (!emptyCloses.has(tabId)) continue;
            explicitDeletes.get(id)?.delete(tabId);
            emptyCloses.delete(tabId);
          }
          const { group: remote, reset } = (await response.json()) as {
            group: SharedRecord;
            reset?: boolean;
          };
          if (!active) return;
          if (reset) {
            const local = currentGroup(id);
            const candidate = local ? dataForSave(id, local) : data;
            const localIds = new Set(candidate.tabs.map((tab) => tab.id));
            const localBookmarks = new Set(
              candidate.bookmarks.map((bookmark) => bookmark.id),
            );
            baselines.set(id, remote);
            applyData({
              ...candidate,
              tabs: [
                ...candidate.tabs,
                ...remote.data.tabs.filter((tab) => !localIds.has(tab.id)),
              ],
              bookmarks: [
                ...candidate.bookmarks,
                ...remote.data.bookmarks.filter(
                  (bookmark) => !localBookmarks.has(bookmark.id),
                ),
              ],
            });
            explicitDeletes.delete(id);
            queue(id);
            return;
          }
          const latestLocal = currentGroup(id);
          const merged = mergeSharedGroupData(
            base.data,
            latestLocal ? dataForSave(id, latestLocal) : data,
            remote.data,
          );
          baselines.set(id, remote);
          applyData(merged);
          queue(id);
          return;
        }
        if (!response.ok) throw new Error("Shared group save failed");
        const { group: saved } = (await response.json()) as {
          group: SharedRecord;
        };
        if (!active) return;
        baselines.set(id, saved);
        applySavedDeletes(id, deletedTabIds);
        const remainingDeletes = explicitDeletes.get(id);
        for (const tabId of deletedTabIds) {
          remainingDeletes?.delete(tabId);
          movedContents.delete(tabId);
          emptyCloses.delete(tabId);
        }
        const savedTabIds = new Set(saved.data.tabs.map((tab) => tab.id));
        for (const tabId of remainingDeletes ?? [])
          if (!savedTabIds.has(tabId)) remainingDeletes?.delete(tabId);
        if (remainingDeletes?.size === 0) explicitDeletes.delete(id);
        for (const [tabId, content] of sentContents)
          if (editedContents.get(tabId) === content)
            editedContents.delete(tabId);
        if (same(dataForSave(id, currentGroup(id) ?? group), saved.data))
          persistPending(id, null);
        else queue(id);
      } catch {
        if (active && userId)
          timers.set(
            id,
            setTimeout(() => void flush(id), 5_000),
          );
      } finally {
        sending.delete(id);
        if (active)
          setSavingTabIds((current) =>
            current.filter((tabId) => !sentContents.has(tabId)),
          );
      }
    };

    const queue = (id: string) => {
      const base = baselines.get(id);
      const group = currentGroup(id);
      if (!base || !group || !userId) return;
      const data = dataForSave(id, group);
      if (same(data, base.data)) {
        explicitDeletes.delete(id);
        persistPending(id, null);
        clearTimer(id);
        return;
      }
      persistPending(id, {
        base,
        data,
        deletedTabIds: approvedDeletedTabIds(id, base, data),
        emptyClosedTabIds: approvedDeletedTabIds(id, base, data).filter(
          (tabId) => emptyCloses.has(tabId),
        ),
        movedTabs: approvedDeletedTabIds(id, base, data)
          .filter((tabId) => !emptyCloses.has(tabId))
          .map((tabId) => ({
            id: tabId,
            content:
              movedContents.get(tabId) ??
              base.data.tabs.find((tab) => tab.id === tabId)!.content,
          })),
      });
      clearTimer(id);
      timers.set(
        id,
        setTimeout(() => void flush(id), 500),
      );
    };

    const refreshGroups = async (): Promise<void> => {
      if (!userId) return;
      if (refreshing) {
        refreshQueued = true;
        return new Promise<void>((resolve) => refreshWaiters.push(resolve));
      }
      refreshing = true;
      setCheckingGroups(true);
      setLoadError(false);
      try {
        const response = await bffFetch("/api/groups", { cache: "no-store" });
        if (!response.ok) throw Error("Groups unavailable");
        const result = (await response.json()) as { groups: SharedRecord[] };
        if (!active) return;
        const allowedIds = new Set(result.groups.map((record) => record.id));
        setAccessByGroup(
          Object.fromEntries(
            result.groups.map((record) => [
              record.id,
              {
                role: record.ownerId === userId ? "owner" : "member",
                active: record.sharingActive !== false,
              },
            ]),
          ),
        );
        for (const id of baselines.keys()) {
          if (allowedIds.has(id)) continue;
          clearTimer(id);
          persistPending(id, null);
          baselines.delete(id);
          changedBeforeLoad.delete(id);
          explicitDeletes.delete(id);
        }
        applying = true;
        try {
          useNotepadStore.setState((state) => ({
            groups: state.groups.filter(
              (group) => !isSharedGroupId(group.id) || allowedIds.has(group.id),
            ),
            activeGroupId:
              isSharedGroupId(state.activeGroupId) &&
              !allowedIds.has(state.activeGroupId)
                ? UNGROUPED_GROUP_ID
                : state.activeGroupId,
          }));
        } finally {
          applying = false;
        }
        for (const remote of result.groups) {
          const base = baselines.get(remote.id);
          if (!base) {
            let pending: PendingGroup | null = null;
            try {
              const value = localStorage.getItem(pendingKey(userId, remote.id));
              if (value) pending = JSON.parse(value) as PendingGroup;
            } catch {
              /* Ignore damaged local queue data. */
            }
            baselines.set(remote.id, pending?.base ?? remote);
            if (pending?.deletedTabIds?.length)
              explicitDeletes.set(remote.id, new Set(pending.deletedTabIds));
            for (const tabId of pending?.emptyClosedTabIds ?? [])
              emptyCloses.add(tabId);
            for (const tab of pending?.movedTabs ?? [])
              movedContents.set(tab.id, tab.content);
            if (!currentGroup(remote.id))
              applyData(pending?.data ?? remote.data);
            else if (!pending && !changedBeforeLoad.has(remote.id))
              applyData(remote.data);
            if (pending || changedBeforeLoad.has(remote.id)) queue(remote.id);
            changedBeforeLoad.delete(remote.id);
          } else if (remote.revision > base.revision) {
            const local = currentGroup(remote.id);
            if (!local || same(toSharedGroupData(local), base.data)) {
              baselines.set(remote.id, remote);
              applyData(remote.data);
              explicitDeletes.delete(remote.id);
              persistPending(remote.id, null);
            }
          }
        }
        if (active) setGroupsLoaded(true);
      } catch {
        if (active) setLoadError(true);
      } finally {
        refreshing = false;
        if (active) setLoading(false);
        if (active && userId && refreshQueued) {
          refreshQueued = false;
          await refreshGroups();
        } else {
          refreshQueued = false;
          if (active) setCheckingGroups(false);
          refreshWaiters.splice(0).forEach((resolve) => resolve());
        }
      }
    };

    const unsubscribe = useNotepadStore.subscribe((state, previous) => {
      if (!userId) return;
      if (applying) return;
      const previousContents = new Map(
        previous.groups
          .filter((group) => isSharedGroupId(group.id))
          .flatMap((group) =>
            group.tabs.map((tab) => [tab.id, tab.content] as const),
          ),
      );
      const changedIds: string[] = [];
      for (const group of state.groups.filter((group) =>
        isSharedGroupId(group.id),
      )) {
        for (const tab of group.tabs) {
          if (
            previousContents.has(tab.id) &&
            previousContents.get(tab.id) !== tab.content
          ) {
            editedContents.set(tab.id, tab.content);
            changedIds.push(tab.id);
          }
        }
      }
      if (changedIds.length)
        setSavingTabIds((current) =>
          current.filter((id) => !changedIds.includes(id)),
        );
      for (const group of state.groups) {
        if (!isSharedGroupId(group.id)) continue;
        const previousGroup = previous.groups.find(
          (item) => item.id === group.id,
        );
        if (
          previousGroup &&
          same(toSharedGroupData(previousGroup), toSharedGroupData(group))
        )
          continue;
        if (!baselines.has(group.id)) changedBeforeLoad.add(group.id);
        else queue(group.id);
      }
    });

    const joinInvite = async () => {
      if (!share || !userId) return;
      setInviteStatus("joining");
      try {
        const response = await bffFetch("/api/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: share }),
        });
        if (!response.ok) throw new Error("Cannot join shared group");
        const { group } = (await response.json()) as { group: SharedRecord };
        if (!active) return;
        await refreshGroups();
        useNotepadStore.getState().selectGroup(group.id);
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete("share");
        window.history.replaceState(window.history.state, "", nextUrl);
        setInviteStatus("joined");
      } catch {
        if (active) setInviteStatus("error");
      }
    };

    const refreshSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        if (!response.ok) throw Error("Session unavailable");
        const result = (await response.json()) as {
          user?: { id?: string } | null;
        };
        if (!active) return;
        const nextId = result.user?.id ?? null;
        if (sessionChecked && nextId === userId) {
          if (userId) await refreshGroups();
          return;
        }
        sessionChecked = true;
        userId = nextId;
        setGroupsLoaded(false);
        setLoadError(false);
        baselines.clear();
        editedContents.clear();
        explicitDeletes.clear();
        emptyCloses.clear();
        movedContents.clear();
        setSavingTabIds([]);
        timers.forEach(clearTimeout);
        timers.clear();
        if (!userId) {
          setGroupsLoaded(true);
          setLoading(false);
          setAccessByGroup({});
          if (share) setInviteStatus("login");
          applying = true;
          try {
            useNotepadStore.setState((state) => ({
              groups: state.groups.filter(
                (group) => !isSharedGroupId(group.id),
              ),
              activeGroupId: isSharedGroupId(state.activeGroupId)
                ? UNGROUPED_GROUP_ID
                : state.activeGroupId,
            }));
          } finally {
            applying = false;
          }
          return;
        }
        if (share) await joinInvite();
        else await refreshGroups();
      } catch {
        if (active) {
          setLoading(false);
          setLoadError(true);
          if (share) setInviteStatus("error");
        }
      }
    };

    refreshRef.current = refreshGroups;
    const onShared = () => void refreshGroups();
    const onRestore = () => {
      if (document.visibilityState !== "hidden") void refreshGroups();
    };
    const onSharedTabDeleteIntent = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          groupId?: string;
          tabId?: string;
          content?: string;
          emptyClose?: boolean;
        }>
      ).detail;
      if (
        !detail ||
        typeof detail.groupId !== "string" ||
        typeof detail.tabId !== "string" ||
        !isSharedGroupId(detail.groupId)
      )
        return;
      const ids = explicitDeletes.get(detail.groupId) ?? new Set<string>();
      ids.add(detail.tabId);
      if (detail.emptyClose) emptyCloses.add(detail.tabId);
      explicitDeletes.set(detail.groupId, ids);
      if (typeof detail.content === "string")
        movedContents.set(detail.tabId, detail.content);
    };
    window.addEventListener("shared-groups-changed", onShared);
    window.addEventListener(
      SHARED_TAB_DELETE_INTENT_EVENT,
      onSharedTabDeleteIntent,
    );
    window.addEventListener("notepad-auth-changed", refreshSession);
    window.addEventListener("online", onRestore);
    window.addEventListener("focus", onRestore);
    document.addEventListener("visibilitychange", onRestore);
    void refreshSession();
    return () => {
      active = false;
      refreshRef.current = null;
      unsubscribe();
      timers.forEach(clearTimeout);
      window.removeEventListener("focus", onRestore);
      document.removeEventListener("visibilitychange", onRestore);
      window.removeEventListener("shared-groups-changed", onShared);
      window.removeEventListener(
        SHARED_TAB_DELETE_INTENT_EVENT,
        onSharedTabDeleteIntent,
      );
      window.removeEventListener("notepad-auth-changed", refreshSession);
      window.removeEventListener("online", onRestore);
    };
  }, [hydrated, inviteToken]);

  const changeAccess = async (id: string, action: "leave" | "revoke") => {
    try {
      const response = await bffFetch("/api/groups/" + action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) return false;
      window.dispatchEvent(new Event("shared-groups-changed"));
      return true;
    } catch {
      return false;
    }
  };

  const dismissInvite = useCallback(() => setInviteStatus(null), []);

  return {
    loading,
    checkingGroups,
    groupsLoaded,
    loadError,
    refreshGroups: () => refreshRef.current?.(),
    savingTabIds,
    accessByGroup,
    changeAccess,
    inviteStatus,
    inviteToken,
    dismissInvite,
  };
}
