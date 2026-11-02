import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import { DEFAULT_SETTINGS } from "@/src/4-entity/notepad/constant";
import { sanitizeCloudSnapshot } from "@/src/4-entity/notepad/persistence";
import {
  applySharedGroupData,
  getTabStatus,
  namespaceGroup,
  normalizeSharedGroupData,
  toSharedGroupData,
} from "@/src/4-entity/notepad/util";

const copy = (value) => structuredClone(value);
const tabsOf = (snapshot) => {
  const state = typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot;
  return [
    ...state.groups.flatMap((group) => group.tabs),
    ...state.closedTabs.map((entry) => entry.tab),
  ];
};
export class MockWorkspace {
  constructor(file) {
    this.file = file;
    this.state = {
      version: 1,
      history: {},
      groups: {},
      events: [],
      notifications: {},
      backups: [],
    };
    if (file) {
      if (!file.endsWith(".json"))
        throw new Error("Mock state must be a local JSON file");
      try {
        this.state = JSON.parse(readFileSync(file, "utf8"));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      if (this.state.version !== 1)
        throw new Error("Unsupported mock state version");
    }
  }
  persist() {
    if (!this.file) return;
    mkdirSync(path.dirname(this.file), { recursive: true, mode: 0o700 });
    const temporary = this.file + ".tmp";
    writeFileSync(temporary, JSON.stringify(this.state), { mode: 0o600 });
    renameSync(temporary, this.file);
  }
  record(group) {
    const record = copy(group);
    delete record.members;
    delete record.localId;
    return record;
  }
  latest(userId) {
    return this.state.history[userId]?.at(-1) ?? null;
  }
  destination(userId, tab, sourceId) {
    if (
      Object.values(this.state.groups).some(
        (group) =>
          group.id !== sourceId &&
          group.members[userId] &&
          group.data.tabs.some(
            (saved) =>
              (saved.id === tab.id || saved.id === `${group.id}-${tab.id}`) &&
              saved.content === tab.content,
          ),
      )
    )
      return true;
    return (
      !!sourceId &&
      !!this.latest(userId) &&
      tabsOf(this.latest(userId).snapshot).some(
        (saved) => saved.id === tab.id && saved.content === tab.content,
      )
    );
  }
  saveHistory(user, input) {
    if (input.userId !== undefined && input.userId !== user.id)
      return [403, { error: "Account changed" }];
    const {
      eventId,
      snapshot,
      baseEventId,
      deletedTabIds = [],
      emptyClosedTabIds = [],
      movedTabs = [],
    } = input;
    if (
      typeof eventId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(eventId) ||
      typeof snapshot !== "string" ||
      snapshot.length > 5000000 ||
      !Array.isArray(deletedTabIds) ||
      !Array.isArray(emptyClosedTabIds) ||
      !Array.isArray(movedTabs)
    )
      return [400, { error: "Invalid update" }];
    let sanitized;
    try {
      const source = JSON.parse(snapshot);
      if (
        !Array.isArray(source.groups) ||
        !Array.isArray(source.closedTabs) ||
        !source.settings
      )
        throw new Error();
      sanitized = sanitizeCloudSnapshot(snapshot);
    } catch {
      return [400, { error: "Invalid snapshot" }];
    }
    const history = (this.state.history[user.id] ??= []);
    if (history.some((record) => record.eventId === eventId))
      return [200, { saved: true }];
    const latest = history.at(-1) ?? null;
    if (baseEventId !== undefined && baseEventId !== (latest?.eventId ?? null))
      return [409, { error: "Conflict", latest }];
    if (latest) {
      const nextIds = new Set(tabsOf(sanitized).map((tab) => tab.id));
      const previous = JSON.parse(latest.snapshot);
      const live = new Set(
        previous.groups.flatMap((group) => group.tabs.map((tab) => tab.id)),
      );
      const archived = new Set(
        previous.closedTabs
          .map((entry) => entry.tab.id)
          .filter((id) => deletedTabIds.includes(id) && !live.has(id)),
      );
      const missing = tabsOf(latest.snapshot).filter(
        (tab) => !nextIds.has(tab.id),
      );
      const protectedTabIds = missing
        .filter(
          (tab) =>
            !archived.has(tab.id) &&
            !(
              baseEventId === latest.eventId &&
              emptyClosedTabIds.includes(tab.id)
            ) &&
            !movedTabs.some(
              (moved) =>
                moved.id === tab.id && this.destination(user.id, moved),
            ),
        )
        .map((tab) => tab.id);
      if (protectedTabIds.length)
        return [409, { error: "Conflict", latest, protectedTabIds }];
      if (missing.length)
        this.state.backups.push({
          scope: `personal:${user.id}`,
          revision: latest.eventId,
          snapshot: latest.snapshot,
        });
    }
    history.push({ eventId, snapshot: sanitized, createdAt: Date.now() });
    this.state.history[user.id] = history.slice(-100);
    this.persist();
    return [200, { saved: true }];
  }
  share(user, source) {
    if (
      !source ||
      typeof source.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(source.id) ||
      source.id === "ungrouped" ||
      typeof source.name !== "string" ||
      source.name.length > 60 ||
      !Array.isArray(source.tabs) ||
      !Array.isArray(source.bookmarks) ||
      source.tabs.some(
        (tab) =>
          typeof tab?.id !== "string" || typeof tab?.content !== "string",
      )
    )
      return [400, { error: "Invalid group" }];
    let group = Object.values(this.state.groups).find(
      (group) =>
        (group.ownerId === user.id && group.localId === source.id) ||
        group.id === source.id,
    );
    if (group && (group.ownerId !== user.id || !group.members[user.id]))
      return [403, { error: "Forbidden" }];
    if (!group) {
      const id = `shared-${randomUUID()}`;
      const namespaced = namespaceGroup(source, id.slice(7));
      group = {
        id,
        ownerId: user.id,
        localId: source.id,
        revision: 0,
        data: toSharedGroupData(namespaced),
        updatedAt: Date.now(),
        sharingActive: true,
        shareVersion: 0,
        members: { [user.id]: { name: user.nickname, seen: 0 } },
      };
      this.state.groups[id] = group;
    }
    group.sharingActive = true;
    this.persist();
    return [
      200,
      {
        group: applySharedGroupData(
          source.id === group.id
            ? source
            : namespaceGroup(source, group.id.slice(7)),
          group.data,
        ),
        revision: group.revision,
        shareLink: { groupId: group.id, version: group.shareVersion },
      },
    ];
  }
  join(user, link) {
    if (!link) return [400, { error: "Invalid share link" }];
    const group = this.state.groups[link.groupId];
    if (!group || !group.sharingActive || group.shareVersion !== link.version)
      return [404, { error: "Group unavailable" }];
    group.members[user.id] ??= {
      name: user.nickname,
      seen: this.state.events.at(-1)?.id ?? 0,
    };
    this.persist();
    return [200, { group: this.record(group) }];
  }
  list(user) {
    return Object.values(this.state.groups)
      .filter((group) => group.members[user.id])
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((group) => this.record(group));
  }
  update(user, input) {
    const {
      id,
      baseRevision,
      data,
      deletedTabIds = [],
      emptyClosedTabIds = [],
      movedTabIds = [],
      movedTabs = [],
      confirmedDeletion = false,
    } = input;
    if (
      typeof id !== "string" ||
      !/^shared-[0-9a-f-]{36}$/i.test(id) ||
      !Number.isSafeInteger(baseRevision) ||
      baseRevision < 0 ||
      !data ||
      data.id !== id ||
      typeof data.name !== "string" ||
      data.name.length > 60 ||
      !Array.isArray(data.tabs) ||
      !Array.isArray(data.bookmarks) ||
      data.tabs.some(
        (tab) =>
          typeof tab?.id !== "string" || typeof tab?.content !== "string",
      ) ||
      ![deletedTabIds, emptyClosedTabIds, movedTabIds, movedTabs].every(
        Array.isArray,
      ) ||
      typeof confirmedDeletion !== "boolean"
    )
      return [400, { error: "Invalid update" }];
    const group = this.state.groups[id];
    if (!group?.members[user.id]) return [403, { error: "Forbidden" }];
    if (group.revision !== baseRevision)
      return [409, { group: this.record(group) }];
    const next = normalizeSharedGroupData(copy(data));
    const nextIds = new Set(next.tabs.map((tab) => tab.id));
    const removed = group.data.tabs.filter((tab) => !nextIds.has(tab.id));
    const approved = new Set(
      confirmedDeletion
        ? deletedTabIds
        : [...movedTabIds, ...emptyClosedTabIds],
    );
    if (removed.some((tab) => !approved.has(tab.id)))
      return [409, { group: this.record(group), reset: true }];
    if (
      removed.some(
        (tab) =>
          movedTabIds.includes(tab.id) &&
          !this.destination(
            user.id,
            movedTabs.find((moved) => moved.id === tab.id) ?? tab,
            id,
          ),
      )
    )
      return [503, { error: "Tab destination is not saved yet" }];
    if (JSON.stringify(group.data) === JSON.stringify(next))
      return [200, { group: this.record(group) }];
    const previous = group.data;
    if (removed.length)
      this.state.backups.push({
        scope: `shared:${id}`,
        revision: group.revision,
        snapshot: JSON.stringify(previous),
      });
    const changed =
      next.tabs.find((tab) => {
        const old = previous.tabs.find((old) => old.id === tab.id);
        return (
          !old ||
          old.content !== tab.content ||
          old.tabColor !== tab.tabColor ||
          old.dashboardStatus !== tab.dashboardStatus
        );
      }) ??
      removed[0] ??
      next.tabs.find((tab) => tab.open) ??
      next.tabs[0];
    let summary =
      previous.name !== next.name ? `그룹 이름: ${next.name}` : "그룹 변경";
    if (changed) {
      const old = previous.tabs.find((tab) => tab.id === changed.id);
      summary = `${!old ? "글 추가" : removed.includes(changed) ? "글 삭제" : old.content !== changed.content ? "글 수정" : "상태 변경"}: ${changed.title || "제목 없는 글"}`;
    }
    group.data = next;
    group.revision++;
    group.updatedAt = Date.now();
    this.state.events.push({
      id: (this.state.events.at(-1)?.id ?? 0) + 1,
      groupId: id,
      tabId: changed?.id ?? null,
      actorId: user.id,
      actorName: user.nickname,
      summary,
      createdAt: Date.now(),
    });
    this.persist();
    return [200, { group: this.record(group) }];
  }
  access(user, id, action) {
    if (typeof id !== "string" || !/^shared-[0-9a-f-]{36}$/i.test(id))
      return [400, { error: "Invalid group" }];
    const group = this.state.groups[id];
    if (!group) return [404, { error: "missing" }];
    if (action === "revoke") {
      if (group.ownerId !== user.id) return [403, { error: "forbidden" }];
      if (group.sharingActive) group.shareVersion++;
      group.sharingActive = false;
      group.members = { [user.id]: group.members[user.id] };
    } else {
      if (group.ownerId === user.id || !group.members[user.id])
        return [403, { error: "forbidden" }];
      delete group.members[user.id];
    }
    this.persist();
    return [200, { ok: true }];
  }
  notifications(user) {
    return this.state.events
      .filter((event) => {
        const group = this.state.groups[event.groupId];
        return (
          group?.members[user.id] &&
          event.actorId !== user.id &&
          !this.state.notifications[`${user.id}:${event.id}`]?.dismissed &&
          group.data.tabs.some((tab) => tab.id === event.tabId) &&
          !event.summary.startsWith("글 삭제:")
        );
      })
      .slice(-30)
      .reverse()
      .map((event) => ({
        ...event,
        groupName: this.state.groups[event.groupId].data.name,
        unread:
          event.id > this.state.groups[event.groupId].members[user.id].seen &&
          !this.state.notifications[`${user.id}:${event.id}`]?.read,
      }));
  }
  notificationAction(user, id, clear = false) {
    for (const notification of this.notifications(user))
      if (id === undefined || notification.id === id) {
        const state = (this.state.notifications[
          `${user.id}:${notification.id}`
        ] ??= {});
        if (clear) state.dismissed = true;
        else state.read = true;
      }
    this.persist();
    return [200, clear ? { cleared: true } : { read: true }];
  }
  board(user, origin, signLink) {
    return Object.values(this.state.groups)
      .filter((group) => group.sharingActive)
      .sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id))
      .map((group) => {
        const notes = group.data.tabs.filter(
          (tab) => tab.content.trim().length > 2,
        );
        return {
          id: group.id,
          viewerRole: group.members[user?.id]
            ? group.ownerId === user.id
              ? "owner"
              : "member"
            : null,
          groupName: group.data.name,
          ownerName: group.members[group.ownerId]?.name ?? "",
          title: group.data.name,
          description: "",
          noteCount: group.data.tabs.filter((tab) => tab.content.trim()).length,
          bookmarkCount: notes.filter((tab) => tab.bookmarked).length,
          notes: notes.map(
            ({
              id,
              title,
              content,
              bookmarked,
              selectedLines,
              updatedAt,
              dashboardStatus,
              tabColor,
            }) => ({
              id,
              title,
              content,
              bookmarked,
              selectedLines,
              updatedAt,
              dashboardStatus: getTabStatus(
                { dashboardStatus, tabColor },
                DEFAULT_SETTINGS.tabColorCycle,
              ),
              tabColor,
            }),
          ),
          memberCount: Object.keys(group.members).length,
          updatedAt: group.updatedAt,
          inviteUrl: signLink(group.id, group.shareVersion, origin),
        };
      });
  }
}
