import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type BoardPost,
  hasBoardVisibleSharedContent,
  isSharedGroupId,
  useNotepadStore,
} from "@/src/4-entity/notepad";

const MOCK_BOARD_POSTS: BoardPost[] = [
  {
    id: "mock-product-notes",
    groupName: "Product Notes",
    ownerName: "Mora Team",
    title: "Product Notes",
    description: "Product planning and release notes",
    noteCount: 12,
    bookmarkCount: 1,
    notes: [
      {
        id: "mock-product-roadmap",
        title: "Roadmap",
        content: "Priorities, release milestones, and open product decisions.",
        bookmarked: true,
        updatedAt: Date.UTC(2026, 9, 28),
      },
    ],
    memberCount: 4,
    updatedAt: Date.UTC(2026, 9, 28),
    inviteUrl: "/?share=mock-product-notes",
  },
  {
    id: "mock-design-system",
    groupName: "Design System",
    ownerName: "Alex",
    title: "Design System",
    description: "Shared UI decisions and component guidelines",
    noteCount: 8,
    bookmarkCount: 0,
    notes: [
      {
        id: "mock-design-components",
        title: "Component guidelines",
        content: "Shared patterns for consistent and accessible interfaces.",
        bookmarked: false,
        updatedAt: Date.UTC(2026, 9, 24),
      },
    ],
    memberCount: 6,
    updatedAt: Date.UTC(2026, 9, 24),
    inviteUrl: "/?share=mock-design-system",
  },
  {
    id: "mock-weekly-review",
    groupName: "Weekly Review",
    ownerName: "Jamie",
    title: "Weekly Review",
    description: "Weekly goals, progress, and retrospectives",
    noteCount: 15,
    bookmarkCount: 0,
    notes: [
      {
        id: "mock-weekly-goals",
        title: "This week",
        content: "Goals, progress updates, and retrospective notes.",
        bookmarked: false,
        updatedAt: Date.UTC(2026, 9, 20),
      },
    ],
    memberCount: 3,
    updatedAt: Date.UTC(2026, 9, 20),
    inviteUrl: "/?share=mock-weekly-review",
  },
];

export function useBoard() {
  const localGroups = useNotepadStore((state) => state.groups);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => {
    setLoading(true);
    setError(false);
    setRevision((current) => current + 1);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/board", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Board unavailable");
        const result = (await response.json()) as { posts: BoardPost[] };
        if (!controller.signal.aborted) setPosts(result.posts);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPosts(MOCK_BOARD_POSTS);
          setError(false);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  const localPosts = useMemo<BoardPost[]>(
    () =>
      localGroups
        .filter((group) => !isSharedGroupId(group.id))
        .map((group) => {
          const tabs = group.tabs.filter(
            (tab) => tab.open && hasBoardVisibleSharedContent(tab.content),
          );
          return {
            id: `local-${group.id}`,
            local: true,
            viewerRole: "owner",
            groupName: group.name,
            ownerName: "Me",
            title: group.name,
            description: "",
            noteCount: group.tabs.filter((tab) => tab.content.trim()).length,
            bookmarkCount: tabs.filter((tab) => tab.bookmarked).length,
            notes: tabs.map(
              ({
                id,
                title,
                content,
                bookmarked,
                selectedLines,
                updatedAt,
              }) => ({
                id,
                title,
                content,
                bookmarked,
                selectedLines,
                updatedAt,
              }),
            ),
            memberCount: 1,
            updatedAt: group.updatedAt,
            inviteUrl: "",
          };
        }),
    [localGroups],
  );
  return {
    posts: [...localPosts, ...posts],
    loading,
    error,
    reload,
  };
}
