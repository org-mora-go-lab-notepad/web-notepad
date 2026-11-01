import { expect, test } from "@playwright/test";

import { mockStatusBoard, statusBoardPost } from "../../__fixture__";

test("9. 긴 그룹명은 두 줄 뒤 말줄임하고 공유자 컬럼에 10px 추가 간격을 둔다", async ({
  page,
}) => {
  const title =
    "아주 긴 그룹 이름과 길게 이어지는 제목을 두 줄까지 보여주고 나머지 내용은 생략합니다 ".repeat(
      5,
    );
  await mockStatusBoard(page, { ...statusBoardPost, title, groupName: title });
  await page.goto("/board");
  const entry = page.locator('.board-entry[data-group-id="status-board"]');
  const name = entry.locator("strong");
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(name).toHaveAttribute("title", title);
    await expect(name).toHaveCSS("-webkit-line-clamp", "2");
    const metrics = await name.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      line: parseFloat(getComputedStyle(element).lineHeight),
      overflow: element.scrollHeight > element.clientHeight,
    }));
    expect(metrics.height).toBeCloseTo(metrics.line * 2, 0);
    expect(metrics.overflow).toBe(true);
    const row = entry.locator("xpath=ancestor::tr");
    await expect(row.locator("td").first()).toHaveCSS("padding-left", "26px");
    await expect(page.getByRole("columnheader").nth(1)).toHaveCSS(
      "padding-left",
      "26px",
    );
    await expect(entry).toBeVisible();
  }
});
