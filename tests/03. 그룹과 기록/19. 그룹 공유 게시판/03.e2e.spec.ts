import { expect } from "@playwright/test";

import { boardTest as test, signedSession } from "../../__fixture__";
import { openEditor } from "../../__util__";
import { authenticateBrowser, openBoard } from "../../__util__";

test("3. 로그인한 방문자는 초대 링크를 열어 실제 공유 그룹에 참여한다", async ({
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
  await page.goto(boardPost.inviteUrl);
  await expect(
    page.getByText("Shared group added. You can edit it now."),
  ).toBeVisible();
  await expect(page.locator("textarea.note-area").first()).toHaveValue(
    "Private shared note body\nSelected shared line\nFinal shared line",
  );
  await openBoard(page);
  await expect(
    page.locator('.board-entry[data-group-id="' + boardPost.id + '"]'),
  ).toBeVisible();
});
