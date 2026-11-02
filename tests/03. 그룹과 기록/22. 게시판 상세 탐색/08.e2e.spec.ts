import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { mockStatusBoard, statusBoardPost } from "../../__fixture__";

test("8. 탭 헤더와 선택 라인은 활성 노트의 상태 색상을 함께 사용한다", async ({
  page,
}) => {
  await mockStatusBoard(page, {
    ...statusBoardPost,
    notes: statusBoardPost.notes.map((note) => ({
      ...note,
      content: `${note.content}\nSelected status line`,
      selectedLines: [1],
    })),
  });
  await page.goto("/board?post=status-board");
  const tabs = page.locator(".board-note-tabs [role=tab]");
  await expect(tabs).toHaveCount(5);
  const colors = ["yellow", "gray", "orange", "indigo", "teal"];
  const expected = await page.evaluate(
    (colors) =>
      colors.map((color) => {
        const probe = document.createElement("span");
        probe.style.color = `var(--color-tab-${color})`;
        probe.style.backgroundColor = `color-mix(in srgb, var(--color-tab-${color}) 20%, transparent)`;
        document.body.append(probe);
        const computed = getComputedStyle(probe);
        const result = {
          color: computed.color,
          background: computed.backgroundColor,
        };
        probe.remove();
        return result;
      }),
    colors,
  );
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    for (let index = 0; index < colors.length; index++) {
      await tabs.nth(index).click();
      await expect(tabs.nth(index)).toHaveAttribute(
        "data-tab-color",
        colors[index],
      );
      await expect(tabs.nth(index)).toHaveCSS(
        "border-top-color",
        expected[index].color,
      );
      await expect(tabs.nth(index)).toHaveCSS(
        "box-shadow",
        `${expected[index].color} 0px 2px 0px 0px inset`,
      );
      const selectedLine = page.locator(".board-note-line.is-selected");
      await expect(selectedLine).toHaveCount(1);
      await expect(selectedLine).toContainText("Selected status line");
      await expect(selectedLine).toHaveCSS(
        "border-left-color",
        expected[index].color,
      );
      await expect(selectedLine).toHaveCSS(
        "background-color",
        expected[index].background,
      );
      await expect(selectedLine.locator(".board-note-line-number")).toHaveCSS(
        "color",
        expected[index].color,
      );
      const unselectedLine = page.locator('.board-note-line[data-line="0"]');
      await expect(unselectedLine).not.toHaveClass(/is-selected/);
      await expect(unselectedLine).toHaveCSS(
        "background-color",
        "rgba(0, 0, 0, 0)",
      );
    }
  }
});
