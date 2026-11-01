"use client";

import { useEffect, useState } from "react";

import { DEFAULT_SETTINGS, UNGROUPED_GROUP_ID } from "../../constant";
import {
  createCloudSnapshot,
  mergeCloudSnapshot,
  normalizePersistedState,
  preserveMissingTabs,
} from "../../persistence";
import { useNotepadStore } from "../../store";
import type { GroupEntry } from "../../type";
import {
  getPaneLayout,
  isSharedGroupId,
  PERSONAL_TAB_DELETE_INTENT_EVENT,
  PERSONAL_TAB_TRANSFER_INTENT_EVENT,
} from "../../util";

export type CloudSaveStatus = "pending" | "saving" | "saved" | "error" | null;
type PendingUpdate = {
  eventId: string;
  snapshot: string;
  baseEventId?: string | null;
  deletedTabIds?: string[];
  emptyClosedTabIds?: string[];
  movedTabs?: { id: string; content: string }[];
};
type Baseline = { eventId: string | null; snapshot: string | null };
type CloudRecord = { eventId: string; snapshot: string; createdAt: number };
const SAVE_DELAY_MS = 250;
const RETRY_DELAY_MS = 5_000;
const OWNER_KEY = "web-notepad-cloud-owner";

function readLocal<Value>(key: string): Value | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") as Value | null;
  } catch {
    return null;
  }
}
function writeLocal(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Local editing remains available without persistent storage. */
  }
}
function hasLocalWork(snapshot: string) {
  const state = JSON.parse(snapshot);
  return (
    state.closedTabs.length > 0 ||
    Object.keys(state.sharedDashboardVisibility ?? {}).length > 0 ||
    Object.keys(state.allGroupDashboardStatusNames ?? {}).length > 0 ||
    Object.entries(DEFAULT_SETTINGS).some(
      ([key, value]) =>
        JSON.stringify(state.settings[key]) !== JSON.stringify(value),
    ) ||
    state.groups.some(
      (group: {
        id: string;
        bookmarks: unknown[];
        tabs: { content: string }[];
      }) =>
        group.id !== UNGROUPED_GROUP_ID ||
        group.bookmarks.length ||
        group.tabs.length > 1 ||
        group.tabs.some((tab) => tab.content),
    )
  );
}

export function useCloudSave(hydrated: boolean) {
  const [ready, setReady] = useState(false);
  const [initialSyncing, setInitialSyncing] = useState(false);
  const [serverLoaded, setServerLoaded] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [savingTabIds, setSavingTabIds] = useState<string[]>([]);
  const [status, setStatus] = useState<CloudSaveStatus>(null);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    let userId: string | null = null;
    let generation = 0;
    let sessionRequest = 0;
    let initialized = false;
    let applying = false;
    let pulling = false;
    let sending = false;
    let readyToSend = false;
    let changedBeforeAuth = false;
    let pending: PendingUpdate | null = null;
    let baseline: Baseline = { eventId: null, snapshot: null };
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastSnapshot = createCloudSnapshot(useNotepadStore.getState());
    const editedContents = new Map<string, string>();
    const explicitDeletes = new Set<string>();
    const emptyCloses = new Set<string>();
    const explicitTransfers = new Map<string, string>();
    const pendingKey = (id: string) => `web-notepad-cloud-pending:${id}`;
    const baseKey = (id: string) => `web-notepad-cloud-base:${id}`;
    const localKey = (id: string) => `web-notepad-cloud-local:${id}`;
    const valid = (id: string, version: number) =>
      active && userId === id && generation === version;
    const clearTimer = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
    };
    const rememberBase = (latest: Baseline) => {
      baseline = latest;
      if (userId) writeLocal(baseKey(userId), baseline);
    };
    const apply = (
      snapshot: string,
      keepView: boolean,
      preserveShared = true,
    ) => {
      const current = useNotepadStore.getState();
      const source = JSON.parse(snapshot);
      if (
        !source ||
        !Array.isArray(source.groups) ||
        !Array.isArray(source.closedTabs) ||
        !source.settings
      ) {
        throw new Error("Invalid cloud snapshot");
      }
      if (preserveShared && source.sharedDashboardVisibility === undefined)
        source.sharedDashboardVisibility = current.sharedDashboardVisibility;
      // Shared groups have their own membership checks and revision protocol.
      source.groups = [
        ...source.groups.filter(
          (group: { id: string }) => !isSharedGroupId(group.id),
        ),
        ...(preserveShared
          ? current.groups.filter((group) => isSharedGroupId(group.id))
          : []),
      ];
      source.closedTabs = [
        ...source.closedTabs.filter(
          (entry: { groupId: string }) => !isSharedGroupId(entry.groupId),
        ),
        ...(preserveShared
          ? current.closedTabs.filter((entry) => isSharedGroupId(entry.groupId))
          : []),
      ];
      if (
        keepView ||
        (preserveShared && isSharedGroupId(current.activeGroupId))
      ) {
        source.activeGroupId = current.activeGroupId;
        source.allGroupLayout = current.allGroupLayout;
        source.allGroupActiveTabId = current.allGroupActiveTabId;
        source.groups = source.groups.map((group: GroupEntry) => {
          const existing = current.groups.find((item) => item.id === group.id);
          return existing ? { ...group, ...getPaneLayout(existing) } : group;
        });
      }
      applying = true;
      try {
        const normalized = normalizePersistedState(source, current);
        // Personal history must not normalize or queue changes to shared records.
        if (preserveShared) {
          normalized.groups = normalized.groups.map((group) =>
            isSharedGroupId(group.id)
              ? (current.groups.find((existing) => existing.id === group.id) ??
                group)
              : group,
          );
          normalized.closedTabs = [
            ...normalized.closedTabs.filter(
              (entry) => !isSharedGroupId(entry.groupId),
            ),
            ...current.closedTabs.filter((entry) =>
              isSharedGroupId(entry.groupId),
            ),
          ];
        }
        useNotepadStore.setState(normalized);
      } finally {
        applying = false;
      }
      lastSnapshot = createCloudSnapshot(useNotepadStore.getState());
      if (userId) writeLocal(localKey(userId), lastSnapshot);
      window.dispatchEvent(new Event("notepad-cloud-applied"));
      return lastSnapshot;
    };
    const queue = (snapshot: string, restored?: PendingUpdate) => {
      if (!userId || !initialized) {
        changedBeforeAuth = true;
        return;
      }
      pending =
        restored?.snapshot === snapshot
          ? { ...restored, baseEventId: baseline.eventId }
          : {
              eventId: crypto.randomUUID(),
              snapshot,
              baseEventId: baseline.eventId,
            };
      pending.deletedTabIds = [...explicitDeletes];
      pending.emptyClosedTabIds = [...emptyCloses];
      pending.movedTabs = [...explicitTransfers].map(([id, content]) => ({
        id,
        content,
      }));
      writeLocal(pendingKey(userId), pending);
      writeLocal(localKey(userId), snapshot);
      setStatus("pending");
      readyToSend = false;
      clearTimer();
      timer = setTimeout(() => void flush(), SAVE_DELAY_MS);
    };
    const reconcile = (latest: CloudRecord | null, first: boolean) => {
      const local = createCloudSnapshot(useNotepadStore.getState());
      let next = local;
      if (latest) {
        const dirty =
          !!pending ||
          changedBeforeAuth ||
          (baseline.snapshot !== null && local !== baseline.snapshot);
        next =
          dirty || (first && !baseline.snapshot && hasLocalWork(local))
            ? mergeCloudSnapshot(baseline.snapshot, local, latest.snapshot)
            : latest.snapshot;
      }
      const restored = pending ?? undefined;
      const needsSave = latest
        ? next !== latest.snapshot
        : !!restored || changedBeforeAuth || hasLocalWork(next);
      next = apply(
        next,
        !first ||
          hasLocalWork(local) ||
          useNotepadStore.getState().activeGroupId !== UNGROUPED_GROUP_ID,
      );
      rememberBase({
        eventId: latest?.eventId ?? null,
        snapshot: latest ? (needsSave ? latest.snapshot : next) : null,
      });
      initialized = true;
      setInitialSyncing(false);
      setServerLoaded(true);
      setReady(true);
      setLastSavedAt(latest?.createdAt ?? null);
      changedBeforeAuth = false;
      if (needsSave) queue(next, restored);
      else {
        clearTimer();
        pending = null;
        if (userId) writeLocal(pendingKey(userId), null);
        setStatus(latest ? "saved" : null);
      }
    };
    const pull = async () => {
      if (!userId || pulling || sending) return;
      const id = userId;
      const version = generation;
      pulling = true;
      if (!initialized) {
        setInitialSyncing(true);
        setReady(false);
        setStatus(null);
      }
      try {
        const response = await fetch("/api/notepad/history", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Cloud load failed");
        const { latest } = (await response.json()) as {
          latest: CloudRecord | null;
        };
        if (!valid(id, version)) return;
        if (!initialized || (latest?.eventId ?? null) !== baseline.eventId)
          reconcile(latest, !initialized);
      } catch {
        if (valid(id, version) && !initialized) {
          setInitialSyncing(false);
          setStatus("error");
          setReady(true);
        }
      } finally {
        pulling = false;
      }
    };
    const flush = async (keepalive = false) => {
      timer = undefined;
      if (!active || !userId || !pending || !initialized) return;
      if (sending) {
        readyToSend = true;
        return;
      }
      sending = true;
      const update = pending;
      const id = userId;
      const version = generation;
      setStatus("saving");
      const sentContents = new Map(editedContents);
      setSavingTabIds([...sentContents.keys()]);
      try {
        const response = await fetch("/api/notepad/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...update, userId: id }),
          cache: "no-store",
          keepalive,
        });
        if (!valid(id, version)) return;
        if (response.status === 409) {
          emptyCloses.clear();
          const { latest, protectedTabIds } = (await response.json()) as {
            latest: CloudRecord | null;
            protectedTabIds?: string[];
          };
          if (!valid(id, version)) return;
          if (latest && protectedTabIds?.length) {
            const state = useNotepadStore.getState();
            // The destination save uses a different queue. Leave the source in
            // the DB and retry until that save commits, including after reload.
            if (
              state.groups.some(
                (group) =>
                  isSharedGroupId(group.id) &&
                  group.tabs.some((tab) =>
                    protectedTabIds.some(
                      (id) => tab.id === id || tab.id === `${group.id}-${id}`,
                    ),
                  ),
              )
            )
              throw new Error("Waiting for durable tab destination");
            const repaired = preserveMissingTabs(
              createCloudSnapshot(state),
              latest.snapshot,
              protectedTabIds,
            );
            apply(repaired, true);
            rememberBase({
              eventId: latest.eventId,
              snapshot: latest.snapshot,
            });
            queue(repaired);
            return;
          }
          if (valid(id, version)) reconcile(latest, false);
          return;
        }
        if (!response.ok) throw new Error("Cloud save failed");
        rememberBase({ eventId: update.eventId, snapshot: update.snapshot });
        for (const tabId of update.emptyClosedTabIds ?? [])
          emptyCloses.delete(tabId);
        for (const tabId of update.deletedTabIds ?? [])
          explicitDeletes.delete(tabId);
        for (const tab of update.movedTabs ?? [])
          explicitTransfers.delete(tab.id);
        setLastSavedAt(Date.now());
        for (const [tabId, content] of sentContents)
          if (editedContents.get(tabId) === content)
            editedContents.delete(tabId);
        if (pending?.eventId === update.eventId) {
          pending = null;
          writeLocal(pendingKey(id), null);
          setStatus("saved");
        } else if (pending) {
          pending.baseEventId = update.eventId;
          writeLocal(pendingKey(id), pending);
          setStatus("pending");
        }
      } catch {
        if (valid(id, version) && pending) {
          setStatus("error");
          clearTimer();
          timer = setTimeout(() => void flush(), RETRY_DELAY_MS);
        }
      } finally {
        sending = false;
        if (valid(id, version)) setSavingTabIds([]);
        if (valid(id, version) && pending && readyToSend) {
          readyToSend = false;
          clearTimer();
          void flush();
        }
      }
    };
    const unsubscribe = useNotepadStore.subscribe((state, previous) => {
      const snapshot = createCloudSnapshot(state);
      if (applying || snapshot === lastSnapshot) return;
      const previousContents = new Map(
        previous.groups
          .filter((group) => !isSharedGroupId(group.id))
          .flatMap((group) =>
            group.tabs.map((tab) => [tab.id, tab.content] as const),
          ),
      );
      const changedIds: string[] = [];
      for (const group of state.groups.filter(
        (group) => !isSharedGroupId(group.id),
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
      lastSnapshot = snapshot;
      queue(snapshot);
    });
    const refreshSession = async () => {
      const requestId = ++sessionRequest;
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        if (!response.ok) throw Error("Session unavailable");
        const result = (await response.json()) as {
          user?: { id?: string } | null;
        };
        if (!active || requestId !== sessionRequest) return;
        const nextId = result.user?.id ?? null;
        if (nextId === userId) {
          if (!nextId) {
            setReady(true);
            setServerLoaded(true);
          } else if (!initialized) await pull();
          return;
        }
        setReady(false);
        setInitialSyncing(false);
        setServerLoaded(false);
        setLastSavedAt(null);
        generation += 1;
        explicitDeletes.clear();
        emptyCloses.clear();
        explicitTransfers.clear();
        clearTimer();
        pending = null;
        initialized = false;
        if (!nextId || (userId !== null && userId !== nextId))
          editedContents.clear();
        userId = nextId;
        setStatus(null);
        setSavingTabIds([]);
        if (!userId) {
          setReady(true);
          setServerLoaded(true);
          return;
        }
        const previousOwner = readLocal<string>(OWNER_KEY);
        if (previousOwner && previousOwner !== userId) {
          editedContents.clear();
          apply(
            readLocal<string>(localKey(userId)) ??
              createCloudSnapshot(useNotepadStore.getInitialState()),
            false,
            false,
          );
          changedBeforeAuth = false;
        }
        writeLocal(OWNER_KEY, userId);
        baseline = readLocal<Baseline>(baseKey(userId)) ?? {
          eventId: null,
          snapshot: null,
        };
        const restored = readLocal<PendingUpdate>(pendingKey(userId));
        if (
          restored &&
          typeof restored.eventId === "string" &&
          typeof restored.snapshot === "string"
        ) {
          pending = restored;
          for (const id of restored.emptyClosedTabIds ?? [])
            emptyCloses.add(id);
          for (const id of restored.deletedTabIds ?? [])
            explicitDeletes.add(id);
          for (const tab of restored.movedTabs ?? [])
            explicitTransfers.set(tab.id, tab.content);
        }
        await pull();
      } catch {
        if (active) {
          setInitialSyncing(false);
          setReady(true);
          setStatus("error");
        }
      }
    };
    const refresh = () => {
      if (document.visibilityState === "hidden") {
        clearTimer();
        void flush(true);
      } else void pull();
    };
    const flushBeforeLeave = () => {
      clearTimer();
      void flush(true);
    };
    const onDeleteIntent = (event: Event) => {
      const detail = (
        event as CustomEvent<{ tabId?: string; emptyClose?: boolean }>
      ).detail;
      if (typeof detail?.tabId !== "string") return;
      if (detail.emptyClose) emptyCloses.add(detail.tabId);
      else explicitDeletes.add(detail.tabId);
    };
    window.addEventListener(PERSONAL_TAB_DELETE_INTENT_EVENT, onDeleteIntent);
    const onTransferIntent = (event: Event) => {
      const detail = (
        event as CustomEvent<{ tabId?: string; content?: string }>
      ).detail;
      if (
        typeof detail?.tabId === "string" &&
        typeof detail.content === "string"
      )
        explicitTransfers.set(detail.tabId, detail.content);
    };
    window.addEventListener(
      PERSONAL_TAB_TRANSFER_INTENT_EVENT,
      onTransferIntent,
    );
    window.addEventListener("notepad-auth-changed", refreshSession);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pagehide", flushBeforeLeave);
    void refreshSession();
    return () => {
      flushBeforeLeave();
      active = false;
      unsubscribe();
      window.removeEventListener(
        PERSONAL_TAB_TRANSFER_INTENT_EVENT,
        onTransferIntent,
      );
      window.removeEventListener(
        PERSONAL_TAB_DELETE_INTENT_EVENT,
        onDeleteIntent,
      );
      clearTimer();
      window.removeEventListener("notepad-auth-changed", refreshSession);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("pagehide", flushBeforeLeave);
    };
  }, [hydrated]);

  return {
    status,
    savingTabIds,
    ready,
    initialSyncing,
    serverLoaded,
    lastSavedAt,
  };
}
