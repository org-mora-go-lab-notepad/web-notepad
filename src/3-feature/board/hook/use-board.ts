import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type BoardPost,
  hasBoardVisibleSharedContent,
  isSharedGroupId,
  useNotepadStore,
} from "@/src/4-entity/notepad";
import { bffFetch } from "@/src/5-shared/util";

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
    bffFetch("/api/board", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Board unavailable");
        const result = (await response.json()) as { posts: BoardPost[] };
        if (!controller.signal.aborted)
          setPosts(
            result.posts.filter(
              (post) =>
                post.viewerRole === "owner" || post.viewerRole === "member",
            ),
          );
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPosts([]);
          setError(true);
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
          const tabs = group.tabs.filter((tab) =>
            hasBoardVisibleSharedContent(tab.content),
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
                dashboardStatus,
                tabColor,
              }) => ({
                id,
                title,
                content,
                bookmarked,
                selectedLines,
                updatedAt,
                dashboardStatus,
                tabColor,
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
