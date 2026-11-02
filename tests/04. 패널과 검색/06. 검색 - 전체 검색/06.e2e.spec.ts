import { expect, test } from "@playwright/test";

import { openGlobalSearchPanel, seedStoredStateOnLoad } from "../../__util__";
import { createGlobalSearchState } from "./__fixture__";

test("6. 탭 검색은 한 열로 표시하고 스크롤 상단과 입력 너비를 맞춘다", async ({
  page,
}) => {
  await seedStoredStateOnLoad(page, createGlobalSearchState(20));
  await openGlobalSearchPanel(page);
  await page.getByRole("searchbox", { name: "Search tabs" }).fill("Quarterly");
  await expect(page.locator(".global-search-result")).toHaveCount(20);
  await expect(
    page.locator(".global-search-section h3, .global-search-preview-pane"),
  ).toHaveCount(0);
  const results = page.locator(".global-search-results-pane");
  await expect(page.locator("textarea")).toHaveValue("Current note");
  await expect(page.locator("#global-search-popup")).toHaveAttribute(
    "open",
    "",
  );
  const list = page.locator(".global-search-list");
  await list.evaluate((element) => element.scrollTo(0, 120));
  await expect(results).toHaveClass(/is-scrolled/);
  const searchBox = (await page
    .locator(".global-search .search-field")
    .boundingBox())!;
  const itemBox = (await page
    .locator(".global-search-result")
    .first()
    .boundingBox())!;
  expect(searchBox.x + searchBox.width).toBeCloseTo(
    itemBox.x + itemBox.width,
    0,
  );
  await expect
    .poll(() =>
      results.evaluate(
        (element) => getComputedStyle(element, "::after").opacity,
      ),
    )
    .toBe("1");
  const paneBox = (await results.boundingBox())!;
  const gradientTop = await results.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element, "::after").top),
  );
  expect(paneBox.y + gradientTop).toBeCloseTo(
    searchBox.y + searchBox.height,
    0,
  );
});
