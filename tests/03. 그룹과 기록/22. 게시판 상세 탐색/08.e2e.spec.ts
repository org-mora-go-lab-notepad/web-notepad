import { expect, test } from "@playwright/test";

import { mockStatusBoard } from "../../__fixture__";

test("8. 보드 상세의 각 탭 헤더와 활성 강조는 원래 탭 색상을 사용한다", async ({
  page,
}) => {
  await mockStatusBoard(page);
  await page.goto("/board?post=status-board");
  const tabs = page.locator(".board-note-tabs [role=tab]");
  await expect(tabs).toHaveCount(5);
  const colors = ["yellow", "gray", "orange", "indigo", "teal"];
  const expected = await page.evaluate(
    (colors) =>
      colors.map((color) => {
        const probe = document.createElement("span");
        probe.style.color = `var(--color-tab-${color})`;
        document.body.append(probe);
        const computed = getComputedStyle(probe).color;
        probe.remove();
        return computed;
      }),
    colors,
  );
  for (let index = 0; index < colors.length; index++) {
    await tabs.nth(index).click();
    await expect(tabs.nth(index)).toHaveAttribute(
      "data-tab-color",
      colors[index],
    );
    await expect(tabs.nth(index)).toHaveCSS(
      "border-top-color",
      expected[index],
    );
    await expect(tabs.nth(index)).toHaveCSS(
      "box-shadow",
      `${expected[index]} 0px 2px 0px 0px inset`,
    );
  }
});
