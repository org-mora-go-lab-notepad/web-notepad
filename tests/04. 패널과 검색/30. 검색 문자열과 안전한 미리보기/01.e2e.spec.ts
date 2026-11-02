import { expect, test } from "@playwright/test";

import { createTabFixture } from "../../__fixture__";
import { openGlobalSearchPanel, seedSearchTabs } from "../../__util__";

test("1. 정규식 특수문자는 탭에서 리터럴 부분 문자열로 검색한다", async ({
  page,
}) => {
  await seedSearchTabs(page, [
    createTabFixture("literal", "Literal [a+b]? result"),
    createTabFixture("other", "Unrelated ab result"),
  ]);
  await openGlobalSearchPanel(page);
  await page.getByRole("searchbox", { name: "Search tabs" }).fill("[a+b]?");
  await expect(page.locator(".global-search-result")).toHaveCount(1);
  await expect(page.locator(".global-search-result strong")).toHaveText(
    "Literal [a+b]? result",
  );
  await expect(page.locator(".global-search-result mark")).toHaveText([
    "[a+b]?",
    "[a+b]?",
  ]);
  await expect(page.locator(".global-search-result p")).toHaveText(
    "Literal [a+b]? result",
  );
  await expect(page.locator("textarea")).toHaveValue("Literal [a+b]? result");
});
