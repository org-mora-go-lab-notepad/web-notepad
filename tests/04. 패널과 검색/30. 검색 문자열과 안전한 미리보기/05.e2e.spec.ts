import { expect, test } from "@playwright/test";

import { createTabFixture } from "../../__fixture__";
import { openGlobalSearchPanel, seedSearchTabs } from "../../__util__";

test("5. HTML 형태의 탭 본문은 실행하지 않고 텍스트로 표시한다", async ({
  page,
}) => {
  const content = "Security needle\n<img src=x onerror=alert(1)>";
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await seedSearchTabs(page, [createTabFixture("html", content)]);
  await openGlobalSearchPanel(page);
  await page.getByRole("searchbox", { name: "Search tabs" }).fill("needle");
  await expect(page.locator(".global-search-result p")).toHaveText(content);
  await expect(
    page.locator(".global-search-result img, .global-search-result script"),
  ).toHaveCount(0);
  await expect(page.locator(".global-search-result mark")).toHaveText([
    "needle",
    "needle",
  ]);
  expect(dialogs).toEqual([]);
});
