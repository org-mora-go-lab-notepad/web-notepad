import { expect } from "@playwright/test";

import { boardTest as test } from "../../__fixture__";
import { openBoard } from "../../__util__";

test("1. 더보기의 게시판은 공유 그룹을 표시하고 방문자에게 관리 버튼을 노출하지 않는다", async ({
  page,
  boardPost,
}) => {
  await page.goto("/");
  let releaseBoard!: () => void;
  const boardResponse = new Promise<void>((resolve) => {
    releaseBoard = resolve;
  });
  await page.route("**/api/board", async (route) => {
    await boardResponse;
    await route.continue();
  });
  await openBoard(page);
  await expect(page.getByRole("table", { name: "Board" })).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveText([
    "Group",
    "Shared by",
    "Notes",
    "Members",
    "Updated",
  ]);
  const signalColor = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.color = "var(--color-signal)";
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect(page.getByRole("columnheader").first()).toHaveCSS(
    "color",
    signalColor,
  );
  await expect(page.locator(".board-skeleton-row")).toHaveCount(5);
  const skeletonHeaderLefts = await page
    .getByRole("columnheader")
    .evaluateAll((headers) =>
      headers.map((header) => header.getBoundingClientRect().left),
    );
  const skeletonHeaderGaps = skeletonHeaderLefts
    .slice(1)
    .map((left, index) => left - skeletonHeaderLefts[index]);
  for (const gap of skeletonHeaderGaps) {
    expect(Math.abs(gap - skeletonHeaderGaps[0])).toBeLessThanOrEqual(1);
  }
  const skeletonRowHeight = (await page
    .locator(".board-skeleton-row")
    .first()
    .boundingBox())!.height;
  releaseBoard();
  await page
    .getByRole("searchbox", { name: "Search shared groups" })
    .fill(boardPost.title);
  const entry = page.locator(".board-entry").filter({
    hasText: boardPost.groupName,
  });
  await expect(page.locator(".board-skeleton-row")).toHaveCount(0);
  await expect(entry).toHaveCount(1);
  await expect(page.getByRole("table", { name: "Board" })).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveText([
    "Group",
    "Shared by",
    "Notes",
    "Members",
    "Updated",
  ]);
  const boardHeaderLefts = await page
    .getByRole("columnheader")
    .evaluateAll((headers) =>
      headers.map((header) => header.getBoundingClientRect().left),
    );
  expect(boardHeaderLefts).toHaveLength(5);
  boardHeaderLefts.forEach((left, index) => {
    expect(Math.abs(left - skeletonHeaderLefts[index])).toBeLessThanOrEqual(1);
  });
  const boardHeaderGaps = boardHeaderLefts
    .slice(1)
    .map((left, index) => left - boardHeaderLefts[index]);
  for (const gap of boardHeaderGaps) {
    expect(Math.abs(gap - boardHeaderGaps[0])).toBeLessThanOrEqual(1);
  }
  expect(boardPost.notes.every((note) => note.content.trim().length > 2)).toBe(
    true,
  );
  expect(boardPost.notes).toHaveLength(4);
  expect(boardPost.noteCount).toBe(6);
  const boardRow = entry.locator("xpath=ancestor::tr");
  await expect(boardRow.locator("td").nth(1)).toHaveText(
    String(boardPost.noteCount),
  );
  const boardRowHeight = (await entry
    .locator("xpath=ancestor::tr")
    .boundingBox())!.height;
  expect(Math.abs(skeletonRowHeight - boardRowHeight)).toBeLessThanOrEqual(1);
  await expect(entry.locator("svg")).toHaveCount(0);
  const groupName = entry.locator("strong");
  await expect(groupName).toHaveAttribute("title", boardPost.title);
  await expect(groupName).toHaveCSS("overflow", "hidden");
  await expect(groupName).toHaveCSS("white-space", "normal");
  await expect(groupName).toHaveCSS("text-overflow", "ellipsis");
  await expect(groupName).toHaveCSS("-webkit-line-clamp", "2");
  expect(
    await entry.evaluate(
      (button) =>
        button.getBoundingClientRect().right <=
        button.parentElement!.getBoundingClientRect().right,
    ),
  ).toBe(true);
  const owner = entry.locator("xpath=ancestor::tr").locator(".board-owner");
  await expect(owner).toHaveText("Board owner");
  await expect(owner.locator("svg")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Publish a group" }),
  ).toHaveCount(0);
});
