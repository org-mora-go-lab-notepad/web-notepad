import { expect, test } from "@playwright/test";

import { createTabFixture } from "../../__fixture__";
import { openGlobalSearchPanel, seedSearchTabs } from "../../__util__";

test("2. 한글 검색어로 탭 본문을 찾고 원문을 연다", async ({ page }) => {
  const content = "회의 기록\n내일 일정 확인";
  await seedSearchTabs(page, [createTabFixture("korean", content)]);
  await openGlobalSearchPanel(page);
  await page.getByRole("searchbox", { name: "Search tabs" }).fill("내일 일정");
  const result = page.getByRole("button", { name: "Open tab 회의 기록" });
  await expect(result).toBeVisible();
  await expect(result.locator("p")).toHaveText(content);
  await expect(result.locator("mark")).toHaveText("내일 일정");
  await expect(result.locator("p")).toHaveCSS("white-space", "pre-wrap");
  await result.click();
  await expect(page.locator("textarea")).toHaveValue(content);
  await expect(page.locator("#global-search-popup")).not.toHaveAttribute(
    "open",
    "",
  );
  await expect(page.locator(".tab-item.is-active")).toContainText("회의 기록");
});
