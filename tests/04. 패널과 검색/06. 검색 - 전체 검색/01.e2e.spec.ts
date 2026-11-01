import { expect, test } from "@playwright/test";

import { seedStoredStateOnLoad } from "../../__util__";
import { createGlobalSearchState } from "./__fixture__";

test("1. 하단 더보기의 Search를 선택하면 전체 검색 팝업을 연다", async ({
  page,
}) => {
  await seedStoredStateOnLoad(page, createGlobalSearchState());
  await page.locator(".group-select-command").click();
  await page.locator(".more-command").click();
  const search = page.locator(".footer .global-search-command");
  await expect(search).toBeVisible();
  await expect(
    page.locator('.header button[aria-controls="global-search-popup"]'),
  ).toHaveCount(0);

  await search.click();
  await expect(page.locator("#global-search-popup")).toHaveAttribute(
    "open",
    "",
  );
  await expect(page.locator("#groups-menu")).toBeVisible();
  const popup = page.locator("#global-search-popup");
  await expect(popup).toHaveCSS("border-top-width", "1px");
  expect(
    await popup.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).not.toBe("rgba(0, 0, 0, 0)");
});
