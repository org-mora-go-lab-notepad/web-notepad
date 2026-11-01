import { expect, test } from "@playwright/test";

import { openBookmarksPanel, openPanel } from "../../__util__";

test("1. 하단 더보기의 Bookmark와 Card 명령으로 각 우측 패널을 연다", async ({
  page,
}) => {
  await page.goto("/");
  await openBookmarksPanel(page);
  await expect(page.locator("#bookmarks-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await page.getByRole("button", { name: "Close Bookmarks" }).click();

  await openPanel(page, "dashboard-panel");
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
});
