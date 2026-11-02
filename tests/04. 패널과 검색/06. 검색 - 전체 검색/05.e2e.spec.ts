import { expect, test } from "@playwright/test";

import {
  groupStatusName,
  openGlobalSearchPanel,
  seedStoredStateOnLoad,
} from "../../__util__";
import { createGlobalSearchState } from "./__fixture__";

test("5. 탭 검색 결과를 선택하면 해당 그룹의 탭을 열고 팝업을 닫는다", async ({
  page,
}) => {
  await seedStoredStateOnLoad(page, createGlobalSearchState());
  await expect(page.locator("textarea")).toHaveValue("Current note");
  await openGlobalSearchPanel(page);
  await page.getByRole("searchbox", { name: "Search tabs" }).fill("Quarterly");
  const result = page.getByRole("button", {
    name: "Open tab Quarterly goals",
    exact: true,
  });
  await expect(result).toBeVisible();
  await expect(result.locator(".global-search-result-category")).toContainText(
    "Work",
  );
  await result.click();
  await expect(groupStatusName(page)).toHaveText("Work");
  await expect(page.locator("textarea")).toHaveValue("Quarterly goals");
  await expect(page.locator("#global-search-popup")).not.toHaveAttribute(
    "open",
    "",
  );
  await expect(page.locator(".tab-item.is-active")).toContainText(
    "Quarterly goals",
  );
  await expect(page.locator(".global-search-preview")).toHaveCount(0);
});
