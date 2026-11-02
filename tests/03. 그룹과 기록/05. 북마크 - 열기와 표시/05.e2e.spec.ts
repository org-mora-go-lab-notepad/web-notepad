import { expect, test } from "@playwright/test";

import { seedBookmarkContentItems } from "./__fixture__";

test("5. 북마크 카드 본문은 전체 내용을 유지하고 여섯 줄로 미리보기한다", async ({
  page,
}) => {
  const { detailLines } = await seedBookmarkContentItems(page);
  const content = page
    .locator(".bookmark-item")
    .first()
    .locator(".bookmark-item-content");

  await expect(content).toHaveText(detailLines.join("\n"), {
    useInnerText: true,
  });
  expect(
    await content.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true);
  const dimensions = await content.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    lineHeight: parseFloat(getComputedStyle(element).lineHeight),
  }));
  expect(dimensions.height).toBeCloseTo(dimensions.lineHeight * 6, 0);
  await expect(content).toHaveCSS("-webkit-line-clamp", "6");
});
