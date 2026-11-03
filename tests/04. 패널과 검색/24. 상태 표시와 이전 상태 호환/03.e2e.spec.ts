import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { createGroupFixture, createTabFixture } from "../../__fixture__";
import { dashboardColumn, openPanel, writeStoredState } from "../../__util__";

test("3. Note는 PC·모바일과 두 테마에서 탭·대시보드에 같은 Yellow를 적용한다", async ({
  page,
}) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await writeStoredState(page, {
      groups: [
        createGroupFixture(
          "ungrouped",
          "Ungrouped",
          [
            createTabFixture("tab-1", "Todo task", { tabColor: "gray" }),
            createTabFixture("tab-2", "Note task", {
              dashboardStatus: "icebox",
              tabColor: "purple",
            }),
          ],
          {
            activeTabId: "tab-2",
            dashboardVisibility: { icebox: true, done: true },
          },
        ),
      ],
    });
    await openPanel(page, "dashboard-panel");
    const tab = page.locator('.tab-item[data-dashboard-status="icebox"]');
    await expect(
      tab.getByRole("tab", { name: "Note task", exact: true }),
    ).toHaveAttribute("aria-selected", "true");

    for (const theme of ["dark", "light"]) {
      await page.evaluate(
        (value) => (document.documentElement.dataset.theme = value),
        theme,
      );
      const iconColors = await tab.locator(".dirty-dot").evaluate((element) => {
        const sample = document.createElement("span");
        sample.style.color = "var(--color-tab-yellow)";
        document.body.append(sample);
        const expected = getComputedStyle(sample).color;
        sample.remove();
        return {
          actual: getComputedStyle(element, "::before").backgroundColor,
          expected,
        };
      });
      expect(iconColors.actual).toBe(iconColors.expected);
      for (const selector of [
        '.tab-item[data-dashboard-status="icebox"]',
        ".dashboard-icebox-column",
        ".dashboard-icebox-column .dashboard-card",
        '.dashboard-column-status[data-status="icebox"]',
        ".dashboard-icebox-status",
      ]) {
        const color = await page.locator(selector).evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            actual: style
              .getPropertyValue(
                element.classList.contains("tab-item")
                  ? "--tab-accent"
                  : "--dashboard-accent",
              )
              .trim(),
            yellow: style.getPropertyValue("--color-tab-yellow").trim(),
          };
        });
        expect(color.actual).toBe(color.yellow);
      }
      const todoAccent = await dashboardColumn(page, "todo").evaluate(
        (element) =>
          getComputedStyle(element)
            .getPropertyValue("--dashboard-accent")
            .trim(),
      );
      const noteAccent = await dashboardColumn(page, "icebox").evaluate(
        (element) =>
          getComputedStyle(element)
            .getPropertyValue("--dashboard-accent")
            .trim(),
      );
      expect(noteAccent).not.toBe(todoAccent);
    }
  }
});
