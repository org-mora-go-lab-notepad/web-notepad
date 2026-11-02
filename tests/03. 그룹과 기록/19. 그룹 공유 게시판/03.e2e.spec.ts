import { expect } from "@playwright/test";

import { boardTest as test, signedSession } from "../../__fixture__";
import { openEditor } from "../../__util__";
import {
  authenticateBrowser,
  openBoard,
  selectBoardPost,
} from "../../__util__";

test("3. 로그인한 방문자는 게시글 초대를 수락해 실제 공유 그룹에 참여한다", async ({
  page,
  context,
  boardPost,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: crypto.randomUUID(),
      nickname: "Board guest",
      expiresAt: Date.now() + 300000,
    }),
  );
  await openEditor(page);
  await openBoard(page);
  await selectBoardPost(page, boardPost.title);
  await page.getByRole("link", { name: "Join this group" }).click();
  await expect(
    page.getByText("Shared group added. You can edit it now."),
  ).toBeVisible();
  await expect(page.locator("textarea.note-area").first()).toHaveValue(
    "Private shared note body\nSelected shared line\nFinal shared line",
  );
});
