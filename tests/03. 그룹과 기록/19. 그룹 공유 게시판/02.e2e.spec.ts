import { expect } from "@playwright/test";

import { boardTest as test } from "../../__fixture__";
import { openEditor } from "../../__util__";
import { openBoard, selectBoardPost, sessionHeaders } from "../../__util__";
import { getApi } from "../../__util__/request";

test("2. 공유 그룹 상세는 소유자에게 노트 본문과 초대 링크 복사를 제공한다", async ({
  page,
  request,
  boardPost,
  boardOwnerToken,
}) => {
  await openEditor(page);
  await openBoard(page);
  await selectBoardPost(page, boardPost.title);
  await expect(page.locator(".board-detail .board-owner")).toHaveText(
    "Board owner",
  );
  await expect(page.locator(".board-detail .board-owner svg")).toHaveCount(1);
  await expect(page.locator(".board-description")).toHaveCount(0);
  await page.getByRole("tab", { name: "Private shared note body" }).click();
  expect(
    (await page.locator(".board-note-text").allTextContents()).map((line) =>
      line.trim(),
    ),
  ).toEqual([
    "Private shared note body",
    "Selected shared line",
    "Final shared line",
  ]);
  await expect(page.locator(".board-note-line-number")).toHaveText([
    "01",
    "02",
    "03",
  ]);
  await expect(page.locator('.board-note-line[data-line="1"]')).toHaveClass(
    /is-selected/,
  );
  await expect(page.locator('.board-note-line[data-line="0"]')).not.toHaveClass(
    /is-selected/,
  );
  const selectedLineLayout = await page
    .locator('.board-note-line[data-line="1"]')
    .evaluate((line) => {
      const preview = line.closest<HTMLElement>(".board-note-preview")!;
      const marker = document.createElement("span");
      marker.style.color = document
        .querySelector<HTMLElement>('.board-note-tabs [aria-selected="true"]')!
        .style.getPropertyValue("--board-note-accent");
      document.body.append(marker);
      const statusColor = getComputedStyle(marker).color;
      marker.remove();
      return {
        borderColor: getComputedStyle(line).borderLeftColor,
        statusColor,
        rightGap:
          preview.getBoundingClientRect().left +
          preview.clientWidth -
          line.getBoundingClientRect().right,
      };
    });
  expect(selectedLineLayout.borderColor).toBe(selectedLineLayout.statusColor);
  expect(Math.abs(selectedLineLayout.rightGap)).toBeLessThanOrEqual(1);
  await page.getByRole("tab", { name: "Follow-up shared note body" }).click();
  await expect(page.locator(".board-note-text")).toHaveText(
    "Follow-up shared note body",
  );
  await expect(page.locator(".board-note-line-number")).toHaveText("01");
  await expect(
    page.getByRole("button", { name: "Copy Invitation Link" }),
  ).toBeVisible();
  expect(
    await (
      await getApi(request, "/api/board", {
        headers: sessionHeaders(boardOwnerToken),
      })
    ).text(),
  ).toContain("Private shared note body");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.locator(".board-list")).toBeVisible();
});
