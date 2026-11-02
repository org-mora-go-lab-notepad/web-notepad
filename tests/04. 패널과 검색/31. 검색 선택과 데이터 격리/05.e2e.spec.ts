import { expect, test } from "@playwright/test";

import { createTabFixture } from "../../__fixture__";
import { openGlobalSearchPanel, seedSearchTabs } from "../../__util__";

test("5. 검색어를 본문으로 좁히면 같은 탭 원문과 하이라이트를 유지한다", async ({
  page,
}) => {
  await seedSearchTabs(page, [
    createTabFixture("alpha", "Alpha note\nunique detail"),
  ]);
  await openGlobalSearchPanel(page);
  const search = page.getByRole("searchbox", { name: "Search tabs" });
  await search.fill("Alpha");
  await expect(page.locator(".global-search-result strong")).toHaveText(
    "Alpha note",
  );
  await search.fill("unique detail");
  await expect(page.locator(".global-search-result mark")).toHaveText([
    "unique detail",
  ]);
  await expect(page.locator(".global-search-result p")).toHaveText(
    "Alpha note\nunique detail",
  );
  await expect(page.locator(".global-search-result")).toHaveCount(1);
  await expect(page.locator("textarea")).toHaveValue(
    "Alpha note\nunique detail",
  );
});
