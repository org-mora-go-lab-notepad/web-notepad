import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { createTabFixture } from "../../__fixture__";
import { openGlobalSearchPanel, seedSearchTabs } from "../../__util__";

test("7. 탭 검색 결과 본문은 Enter와 빈 줄을 보존하고 최대 여섯 줄로 표시한다", async ({
  page,
}) => {
  const content = [
    "Needle heading",
    "second line",
    "",
    "fourth line",
    "fifth line",
    "sixth line",
    "seventh line",
    "eighth line",
  ].join("\n");
  await seedSearchTabs(page, [createTabFixture("search-lines", content)]);
  await openGlobalSearchPanel(page);
  await page.getByRole("searchbox", { name: "Search tabs" }).fill("Needle");
  const preview = page.locator(".global-search-result p");
  await expect(preview).toHaveText(content);
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await expect(preview).toHaveCSS("white-space", "pre-wrap");
    await expect(preview).toHaveCSS("-webkit-line-clamp", "6");
    const dimensions = await preview.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      lineHeight: parseFloat(getComputedStyle(element).lineHeight),
      scrollHeight: element.scrollHeight,
    }));
    expect(dimensions.height).toBeCloseTo(dimensions.lineHeight * 6, 0);
    expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.height);
    await expect(preview.locator("mark")).toHaveText("Needle");
  }
});
