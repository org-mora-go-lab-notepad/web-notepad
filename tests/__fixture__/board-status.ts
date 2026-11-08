import type { Page } from "@playwright/test";

import type { BoardPost } from "@/src/4-entity/notepad";

import { authenticateBrowser } from "../__util__/auth";

export const statusBoardPost: BoardPost = {
  id: "status-board",
  viewerRole: "member",
  groupName: "Five status board",
  title: "Five status board",
  ownerName: "Owner",
  description: "",
  noteCount: 5,
  bookmarkCount: 1,
  memberCount: 1,
  updatedAt: 1,
  inviteUrl: "/?share=sample",
  notes: [
    {
      id: "done",
      title: "A Done",
      content: "Completed content",
      dashboardStatus: "done",
      tabColor: "teal",
      bookmarked: true,
      updatedAt: 1,
    },
    {
      id: "doing",
      title: "B Doing",
      content: "Doing content",
      dashboardStatus: "in-progress",
      tabColor: "indigo",
      bookmarked: false,
      updatedAt: 1,
    },
    {
      id: "ready",
      title: "C Ready",
      content: "Ready content",
      dashboardStatus: "ready",
      tabColor: "orange",
      bookmarked: false,
      updatedAt: 1,
    },
    {
      id: "todo",
      title: "D Todo",
      content: "Todo content",
      dashboardStatus: "todo",
      tabColor: "gray",
      bookmarked: false,
      updatedAt: 1,
    },
    {
      id: "memo",
      title: "E Memo",
      content: "Memo content",
      dashboardStatus: "icebox",
      tabColor: "yellow",
      bookmarked: false,
      updatedAt: 1,
    },
  ],
};
export async function mockStatusBoard(page: Page, post = statusBoardPost) {
  await authenticateBrowser(page.context());
  await page.route("**/api/board", (route) =>
    route.fulfill({ json: { posts: [post] } }),
  );
}
