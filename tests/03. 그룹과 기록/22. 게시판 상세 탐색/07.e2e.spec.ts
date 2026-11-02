import { expect, test } from "@playwright/test";

import { mockStatusBoard } from "../../__fixture__";

test("7. 보드 상세는 북마크보다 다섯 상태 순서를 우선해 모든 탭 본문을 표시한다", async ({
  page,
}) => {
  await mockStatusBoard(page);
  await page.goto("/board?post=status-board");
  const tabs = page.locator(".board-note-tabs [role=tab]");
  await expect(tabs).toHaveText([
    "E Memo",
    "D Todo",
    "C Ready",
    "B Doing",
    "A Done",
  ]);
  expect(
    await tabs.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-status")),
    ),
  ).toEqual(["icebox", "todo", "ready", "in-progress", "done"]);
  await expect(tabs.last().locator(".board-note-bookmark")).toHaveCount(1);
  const contents = [
    "Memo content",
    "Todo content",
    "Ready content",
    "Doing content",
    "Completed content",
  ];
  for (let index = 0; index < contents.length; index++) {
    await tabs.nth(index).click();
    await expect(tabs.nth(index)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText(contents[index]);
    await expect(page.getByRole("tabpanel")).toBeVisible();
  }
  await expect(tabs).toHaveCount(5);
  await expect(page.locator(".board-detail")).toBeVisible();
  await expect(page.locator(".board-note-preview")).toHaveCount(1);
});
