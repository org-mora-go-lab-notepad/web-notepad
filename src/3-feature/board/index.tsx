"use client";

import {
  ArrowUpRight,
  Bookmark,
  CalendarClock,
  CircleUserRound,
  Clipboard,
  Layers,
  LogOut,
  NotebookPen,
  Unlink,
  Users,
} from "lucide-react";
import {
  type CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ALL_GROUP_ID,
  ALL_MY_GROUP_ID,
  ALL_SHARED_GROUP_ID,
  type BoardPost,
  DASHBOARD_STATUSES,
  getStatusColor,
  getTabStatus,
  UNGROUPED_GROUP_ID,
  useNotepadStore,
} from "@/src/4-entity/notepad";
import { GroupSharingContext, useI18n } from "@/src/5-shared/hook";
import { ConfirmPopup, FixedPageHeader, SearchField } from "@/src/5-shared/ui";

import { useBoard, useBoardSelection } from "./hook";

const MOBILE_NOTE_PREVIEW_MIN_HEIGHT = 316.8;
const DESKTOP_NOTE_PREVIEW_HEIGHT = MOBILE_NOTE_PREVIEW_MIN_HEIGHT * 1.5;
const ALL_MY_UNGROUPED_BOARD_ID = "all-my-ungrouped";
const SYSTEM_BOARD_POST_IDS = new Set([
  ALL_GROUP_ID,
  ALL_MY_GROUP_ID,
  ALL_SHARED_GROUP_ID,
  ALL_MY_UNGROUPED_BOARD_ID,
  UNGROUPED_GROUP_ID,
  `local-${UNGROUPED_GROUP_ID}`,
]);

export function Board({ onReturnHome }: { onReturnHome?: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { t, language } = useI18n();
  const { posts, loading, error, reload } = useBoard();
  const boardPosts = useMemo(
    () =>
      posts.filter(
        (post) => !post.system && !SYSTEM_BOARD_POST_IDS.has(post.id),
      ),
    [posts],
  );
  const {
    selected,
    select,
    back: backSelection,
  } = useBoardSelection(boardPosts);
  const sharing = useContext(GroupSharingContext);
  const [accessConfirm, setAccessConfirm] = useState(false);
  const [accessError, setAccessError] = useState(false);
  const accessBusy = useRef(false);
  const actionRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  const [failure, setFailure] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [notePreviewHeight, setNotePreviewHeight] = useState(
    DESKTOP_NOTE_PREVIEW_HEIGHT,
  );
  const notePreviewRef = useRef<HTMLElement>(null);
  const noteTabRevealRequested = useRef(false);
  const [noteSlide, setNoteSlide] = useState<{
    direction: "left" | "right";
    sequence: number;
  } | null>(null);
  const noteTabsRef = useRef<HTMLDivElement>(null);
  const [noteTabFog, setNoteTabFog] = useState({ left: false, right: false });
  const cycle = useNotepadStore((state) => state.settings.tabColorCycle);
  const noteStatus = useCallback(
    (note: BoardPost["notes"][number]) =>
      getTabStatus(
        {
          dashboardStatus: note.dashboardStatus,
          tabColor: note.tabColor ?? cycle[0],
        },
        cycle,
      ),
    [cycle],
  );
  const orderedNotes = useMemo(
    () =>
      selected
        ? [...selected.notes].sort(
            (left, right) =>
              DASHBOARD_STATUSES.indexOf(noteStatus(left)) -
                DASHBOARD_STATUSES.indexOf(noteStatus(right)) ||
              Number(right.bookmarked) - Number(left.bookmarked) ||
              left.title.localeCompare(right.title, language, {
                numeric: true,
                sensitivity: "base",
              }),
          )
        : [],
    [language, selected, noteStatus],
  );
  const activeNote =
    orderedNotes.find((note) => note.id === activeNoteId) ?? orderedNotes[0];
  const activateNote = useCallback(
    (id: string, direction: "left" | "right") => {
      noteTabRevealRequested.current = true;
      setNoteSlide((current) => ({
        direction,
        sequence: (current?.sequence ?? 0) + 1,
      }));
      setActiveNoteId(id);
    },
    [],
  );
  const editorSwipeStart = useRef<{ x: number; y: number } | null>(null);
  const swipeNote = useCallback(
    (direction: "left" | "right") => {
      if (!selected || orderedNotes.length < 2) return false;
      const currentIndex = Math.max(
        0,
        orderedNotes.findIndex((note) => note.id === activeNote?.id),
      );
      const offset = direction === "left" ? 1 : -1;
      const nextIndex =
        (currentIndex + offset + orderedNotes.length) % orderedNotes.length;
      activateNote(orderedNotes[nextIndex].id, direction);
      return true;
    },
    [activateNote, activeNote?.id, orderedNotes, selected],
  );

  useLayoutEffect(() => {
    if (!selected) return;
    contentRef.current
      ?.closest<HTMLElement>(".board-page")
      ?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [selected]);
  const updateNoteTabFog = useCallback(() => {
    const tabs = noteTabsRef.current;
    if (!tabs) return;
    const overflowing = tabs.scrollWidth > tabs.clientWidth + 1;
    const next = {
      left: overflowing && tabs.scrollLeft > 1,
      right:
        overflowing &&
        tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 1,
    };
    setNoteTabFog((current) =>
      current.left === next.left && current.right === next.right
        ? current
        : next,
    );
  }, []);
  useEffect(() => {
    const tabs = noteTabsRef.current;
    if (!tabs) return;
    updateNoteTabFog();
    tabs.addEventListener("scroll", updateNoteTabFog, { passive: true });
    const observer = new ResizeObserver(updateNoteTabFog);
    observer.observe(tabs);
    return () => {
      tabs.removeEventListener("scroll", updateNoteTabFog);
      observer.disconnect();
    };
  }, [orderedNotes.length, selected?.id, updateNoteTabFog]);
  useEffect(() => {
    if (!noteTabRevealRequested.current) return;
    noteTabRevealRequested.current = false;
    const tabs = noteTabsRef.current;
    const activeTab = tabs?.querySelector<HTMLButtonElement>(
      '[role="tab"][aria-selected="true"]',
    );
    if (!tabs || !activeTab) return;
    const tabLeft = activeTab.offsetLeft;
    const tabRight = tabLeft + activeTab.offsetWidth;
    if (tabLeft < tabs.scrollLeft) tabs.scrollLeft = tabLeft;
    else if (tabRight > tabs.scrollLeft + tabs.clientWidth)
      tabs.scrollLeft = tabRight - tabs.clientWidth;
    const frame = requestAnimationFrame(updateNoteTabFog);
    return () => cancelAnimationFrame(frame);
  }, [activeNote?.id, updateNoteTabFog]);
  useEffect(() => {
    if (!selected?.id || !activeNote?.id) return;
    const updateMobilePreviewHeight = () => {
      if (!window.matchMedia("(max-width: 512px)").matches) {
        setNotePreviewHeight(DESKTOP_NOTE_PREVIEW_HEIGHT);
        return;
      }
      const preview = notePreviewRef.current;
      if (!preview) return;
      const page = preview.closest<HTMLElement>(".board-page");
      const footer = document.querySelector<HTMLElement>(
        ".board-mobile-footer",
      );
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      const previewTop =
        preview.getBoundingClientRect().top + (page?.scrollTop ?? 0);
      const footerHeight = footer?.getBoundingClientRect().height ?? 0;
      setNotePreviewHeight(
        Math.max(
          MOBILE_NOTE_PREVIEW_MIN_HEIGHT,
          viewportHeight - previewTop - footerHeight - 20,
        ),
      );
    };
    const frame = requestAnimationFrame(updateMobilePreviewHeight);
    window.addEventListener("resize", updateMobilePreviewHeight);
    window.visualViewport?.addEventListener(
      "resize",
      updateMobilePreviewHeight,
    );
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateMobilePreviewHeight);
      window.visualViewport?.removeEventListener(
        "resize",
        updateMobilePreviewHeight,
      );
    };
  }, [activeNote?.id, selected?.id]);
  useEffect(() => {
    const clearFeedback = () => {
      setFailure("");
      setCopied(false);
    };
    window.addEventListener("popstate", clearFeedback);
    return () => window.removeEventListener("popstate", clearFeedback);
  }, []);
  const filtered = boardPosts.filter((post) =>
    `${post.title} ${post.description} ${post.groupName}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const selectedRole =
    selected && boardPosts.find((post) => post.id === selected.id)?.viewerRole;
  const accessLabel =
    selectedRole === "owner" ? t.revokeGroupShare : t.leaveGroup;
  const back = () => {
    backSelection();
    setFailure("");
    setCopied(false);
  };

  return (
    <section className="board">
      <FixedPageHeader
        className={`board-page-header ${selected ? "is-detail" : "is-list"}`}
        onBack={selected ? back : undefined}
        onNavigateBack={onReturnHome}
        title={selected?.groupName ?? t.boardTitle}
      />
      <div
        className="board-content"
        ref={contentRef}
        aria-busy={loading}
        onKeyDown={(event) => {
          if (
            event.key !== "Escape" &&
            (event.target instanceof HTMLInputElement ||
              event.target instanceof HTMLTextAreaElement)
          )
            event.stopPropagation();
        }}
      >
        {selected ? (
          <article className="board-detail">
            <header
              className="board-detail-hero board-overview"
              aria-labelledby="board-overview-title"
            >
              <div className="board-overview-header">
                <h4 id="board-overview-title">{t.boardOverview}</h4>
                <div className="board-overview-owner">
                  <span className="board-role">
                    {selectedRole === "owner"
                      ? t.boardOwnerRole
                      : selectedRole === "member"
                        ? t.boardMemberRole
                        : t.boardGuestRole}
                  </span>
                  <span
                    className="board-owner"
                    aria-label={t.boardOwnerColumn}
                    title={selected.ownerName || t.boardUnknownOwner}
                  >
                    <CircleUserRound size={16} aria-hidden="true" />
                    <span>{selected.ownerName || t.boardUnknownOwner}</span>
                  </span>
                </div>
              </div>
              <div className="board-meta">
                <span>
                  <NotebookPen size={18} aria-hidden="true" />
                  <small>{t.boardNotesColumn}</small>
                  <strong>{selected.noteCount}</strong>
                </span>
                <span>
                  <Users size={18} aria-hidden="true" />
                  <small>{t.boardMembersColumn}</small>
                  <strong>{selected.memberCount}</strong>
                </span>
                <span>
                  <Bookmark size={18} aria-hidden="true" />
                  <small>{t.boardBookmarksColumn}</small>
                  <strong>{selected.bookmarkCount}</strong>
                </span>
                <span>
                  <CalendarClock size={18} aria-hidden="true" />
                  <small>{t.boardUpdatedColumn}</small>
                  <strong>
                    {selected.updatedAt > 0 ? (
                      <time
                        dateTime={new Date(selected.updatedAt).toISOString()}
                      >
                        {new Date(selected.updatedAt).toLocaleDateString(
                          language === "ko" ? "ko-KR" : "en-US",
                        )}
                      </time>
                    ) : (
                      "-"
                    )}
                  </strong>
                </span>
              </div>
            </header>
            <section className="board-detail-section board-note-contents">
              <div
                className={`board-note-tabs ${noteTabFog.left ? "has-left-fog" : ""} ${noteTabFog.right ? "has-right-fog" : ""}`}
                ref={noteTabsRef}
                role="tablist"
                aria-label={t.boardNoteContents}
              >
                {orderedNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    className={note.bookmarked ? "is-bookmarked" : undefined}
                    data-status={noteStatus(note)}
                    data-tab-color={
                      note.tabColor ?? getStatusColor(noteStatus(note), cycle)
                    }
                    style={
                      {
                        "--board-note-accent": `var(--color-tab-${note.tabColor ?? getStatusColor(noteStatus(note), cycle)})`,
                      } as CSSProperties
                    }
                    role="tab"
                    aria-selected={note.id === activeNote?.id}
                    aria-controls="board-active-note"
                    onClick={() => {
                      const current = orderedNotes.findIndex(
                        (item) => item.id === activeNote?.id,
                      );
                      const next = orderedNotes.findIndex(
                        (item) => item.id === note.id,
                      );
                      activateNote(note.id, next < current ? "right" : "left");
                    }}
                  >
                    {note.bookmarked && (
                      <Bookmark
                        className="board-note-bookmark"
                        size={14}
                        aria-hidden="true"
                      />
                    )}
                    <span className="board-note-title">{note.title}</span>
                  </button>
                ))}
              </div>
              {activeNote && (
                <div className="board-note-preview-shell">
                  <article
                    key={`${activeNote.id}-${noteSlide?.sequence ?? 0}`}
                    ref={notePreviewRef}
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;
                      editorSwipeStart.current = {
                        x: event.clientX,
                        y: event.clientY,
                      };
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerCancel={() => {
                      editorSwipeStart.current = null;
                    }}
                    onPointerUp={(event) => {
                      const start = editorSwipeStart.current;
                      editorSwipeStart.current = null;
                      if (!start) return;
                      const dx = event.clientX - start.x,
                        dy = event.clientY - start.y;
                      if (
                        Math.abs(dx) > 64 &&
                        Math.abs(dx) > Math.abs(dy) * 1.5
                      )
                        swipeNote(dx < 0 ? "left" : "right");
                    }}
                    className={`board-note-preview ${noteSlide ? `is-slide-${noteSlide.direction}` : ""}`}
                    id="board-active-note"
                    role="tabpanel"
                    style={
                      {
                        height: notePreviewHeight,
                        "--board-note-accent": `var(--color-tab-${activeNote.tabColor ?? getStatusColor(noteStatus(activeNote), cycle)})`,
                      } as CSSProperties
                    }
                  >
                    <pre>
                      {activeNote.content.split("\n").map((line, index) => (
                        <span
                          className={`board-note-line ${activeNote.selectedLines?.includes(index) ? "is-selected" : ""}`}
                          data-line={index}
                          key={index}
                        >
                          <span
                            className="board-note-line-number"
                            aria-hidden="true"
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="board-note-text">
                            {line || "\u200b"}
                            {"\n"}
                          </span>
                        </span>
                      ))}
                    </pre>
                  </article>
                </div>
              )}
            </section>
            {!selected.local && (
              <section className="board-detail-section board-collaboration">
                <h4>{t.boardCollaboration}</h4>
                <p className="board-join-hint">
                  {selectedRole === "owner"
                    ? t.boardOwnerHint
                    : selectedRole === "member"
                      ? t.boardMemberHint
                      : t.boardJoinHint}
                </p>
                <div className="board-detail-actions">
                  {selectedRole ? (
                    <button
                      ref={actionRef}
                      type="button"
                      className="board-primary board-access"
                      onClick={() => {
                        setAccessError(false);
                        setAccessConfirm(true);
                      }}
                    >
                      <span>{accessLabel}</span>
                      {selectedRole === "owner" ? (
                        <Unlink size={17} aria-hidden="true" />
                      ) : (
                        <LogOut size={17} aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    <a
                      className="board-primary board-join"
                      href={selected.inviteUrl}
                    >
                      {t.boardJoin}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </a>
                  )}
                  <button
                    type="button"
                    className="board-copy"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(selected.inviteUrl);
                        setCopied(true);
                      } catch {
                        setFailure(t.boardCopyError);
                      }
                    }}
                  >
                    <span>{copied ? t.boardCopied : t.boardCopy}</span>
                    <Clipboard size={15} aria-hidden="true" />
                  </button>
                </div>
              </section>
            )}
          </article>
        ) : (
          <>
            <SearchField
              value={query}
              onChange={setQuery}
              ariaLabel={t.boardSearch}
              placeholder={t.boardSearch}
            />
            {loading ? (
              <div
                className="board-list board-table-container board-skeleton"
                role="status"
                aria-label={t.boardLoading}
              >
                <span className="board-skeleton-label">{t.boardLoading}</span>
                <table className="board-table" aria-label={t.boardTitle}>
                  <colgroup>
                    {Array.from({ length: 5 }, (_, index) => (
                      <col key={index} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">{t.groupCategory}</th>
                      <th scope="col">{t.boardOwnerColumn}</th>
                      <th scope="col">{t.boardNotesColumn}</th>
                      <th scope="col">{t.boardMembersColumn}</th>
                      <th scope="col">{t.boardUpdatedColumn}</th>
                    </tr>
                  </thead>
                  <tbody aria-hidden="true">
                    {Array.from({ length: 5 }, (_, index) => (
                      <tr className="board-skeleton-row" key={index}>
                        {Array.from({ length: 5 }, (_, cellIndex) => (
                          <td key={cellIndex}>
                            <span />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : error ? (
              <div className="board-empty" role="alert">
                <p>{t.boardLoadError}</p>
                <button type="button" onClick={reload}>
                  {t.boardRetry}
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="board-empty">
                <Layers size={32} aria-hidden="true" />
                <h3>{query.trim() ? t.boardNoResults : t.boardEmpty}</h3>
                <p>{t.boardEmptyHint}</p>
              </div>
            ) : (
              <div className="board-list board-table-container">
                <table className="board-table" aria-label={t.boardTitle}>
                  <colgroup>
                    {Array.from({ length: 5 }, (_, index) => (
                      <col key={index} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">{t.groupCategory}</th>
                      <th scope="col">{t.boardOwnerColumn}</th>
                      <th scope="col">{t.boardNotesColumn}</th>
                      <th scope="col">{t.boardMembersColumn}</th>
                      <th scope="col">{t.boardUpdatedColumn}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((post) => (
                      <tr
                        key={post.id}
                        className={post.system ? "is-system-group" : undefined}
                        data-group-id={post.id}
                        onClick={() => {
                          select(post.id);
                          setFailure("");
                          setCopied(false);
                        }}
                      >
                        <th scope="row">
                          <button
                            type="button"
                            className="board-entry"
                            data-group-id={post.id}
                          >
                            <strong title={post.title}>{post.title}</strong>
                          </button>
                        </th>
                        <td>
                          <span
                            className="board-owner"
                            title={post.ownerName || t.boardUnknownOwner}
                          >
                            <CircleUserRound size={16} aria-hidden="true" />
                            <span>{post.ownerName || t.boardUnknownOwner}</span>
                          </span>
                        </td>
                        <td>{post.noteCount}</td>
                        <td>{post.memberCount}</td>
                        <td>
                          {post.updatedAt > 0 ? (
                            <time
                              dateTime={new Date(post.updatedAt).toISOString()}
                            >
                              {new Date(post.updatedAt).toLocaleDateString(
                                language === "ko" ? "ko-KR" : "en-US",
                              )}
                            </time>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {failure && (
          <p className="board-error" role="alert">
            {failure}
          </p>
        )}
        <span className="board-copy-status" role="status">
          {copied ? t.boardCopied : ""}
        </span>
      </div>
      {accessConfirm && selected && (
        <ConfirmPopup
          title={accessLabel}
          message={
            selectedRole === "owner"
              ? t.revokeGroupShareMessage
              : t.leaveGroupMessage
          }
          closeLabel={t.close}
          closeTitle={t.close}
          confirmLabel={accessLabel}
          confirmIcon={
            selectedRole === "owner" ? (
              <Unlink size={14} />
            ) : (
              <LogOut size={14} />
            )
          }
          keepOpenOnConfirm
          error={accessError ? t.groupAccessError : undefined}
          onCancel={() => {
            setAccessConfirm(false);
            actionRef.current?.focus();
          }}
          onConfirm={async () => {
            if (accessBusy.current || !sharing) return;
            accessBusy.current = true;
            setAccessError(false);
            try {
              if (
                await sharing.changeAccess(
                  selected.id,
                  selectedRole === "owner" ? "revoke" : "leave",
                )
              ) {
                setAccessConfirm(false);
                back();
                reload();
                contentRef.current
                  ?.querySelector<HTMLElement>("input, button")
                  ?.focus();
              } else setAccessError(true);
            } finally {
              accessBusy.current = false;
            }
          }}
        />
      )}
    </section>
  );
}
