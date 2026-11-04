import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { createGroupFixture, createTabFixture } from "../../__fixture__";
import {
  dashboardPanel,
  openPanel,
  readStoredState,
  switchGroup,
  toggleDashboardStatus,
  writeStoredState,
} from "../../__util__";

test("1. Edit Status로 수정한 다섯 상태 이름은 해당 그룹에만 저장하고 새로고침 후 복원한다", async ({
  page,
}) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await writeStoredState(page, {
      activeGroupId: "work",
      groups: [
        createGroupFixture("ungrouped", "Ungrouped", [
          createTabFixture("tab-1", "Personal"),
        ]),
        createGroupFixture("work", "Work", [
          createTabFixture("tab-2", "Work task", { tabColor: "gray" }),
        ]),
      ],
      settings: { dashboardStatusNames: { todo: "Old global label" } },
    });
    await openPanel(page, "dashboard-panel");
    await toggleDashboardStatus(page, "icebox");

    const panel = dashboardPanel(page);
    const titles = panel.locator(
      viewport.width <= 512
        ? ".dashboard-column-status .dashboard-status-label"
        : ".dashboard-statuses h3 .dashboard-status-label",
    );
    const original = ["Note", "To Do", "Ready", "Doing", "Done"];
    const renamed = ["Ideas", "Next", "Queued", "Working", "Shipped"];
    const mobileOrder = [3, 2, 1, 4, 0];
    const displayedOriginal =
      viewport.width <= 512
        ? mobileOrder.map((index) => original[index])
        : original;
    const displayedRenamed =
      viewport.width <= 512
        ? mobileOrder.map((index) => renamed[index])
        : renamed;
    await expect(titles).toHaveText(displayedOriginal);
    await panel.locator(".dashboard-options-trigger").click();
    await panel
      .getByRole("button", { name: "Edit Status", exact: true })
      .click();
    const editor = page.getByRole("dialog", {
      name: "Edit Status",
      exact: true,
    });
    await expect(editor).toContainText("Applies only to Work.");
    for (let index = 0; index < original.length; index += 1) {
      await editor
        .getByRole("textbox", { name: original[index], exact: true })
        .fill(renamed[index]);
    }
    await editor.getByRole("button", { name: "Save", exact: true }).click();
    await expect(editor).toHaveCount(0);
    await expect(titles).toHaveText(displayedRenamed);
    const saved = await readStoredState(page);
    expect(
      saved.groups.find((group) => group.id === "work")!.dashboardStatusNames,
    ).toEqual({
      icebox: "Ideas",
      todo: "Next",
      ready: "Queued",
      "in-progress": "Working",
      done: "Shipped",
    });
    expect(
      saved.groups.find((group) => group.id === "ungrouped")!
        .dashboardStatusNames,
    ).toBeUndefined();
    expect(
      saved.groups.find((group) => group.id === "work")!.tabs[0].tabColor,
    ).toBe("gray");
    await page.reload();
    await expect(titles).toHaveText(displayedRenamed);
    if (viewport.width > 512) await panel.locator(".side-panel-close").click();
    else await page.keyboard.press("Escape");
    await switchGroup(page, "Ungrouped");
    await openPanel(page, "dashboard-panel");
    await toggleDashboardStatus(page, "icebox");
    await expect(titles).toHaveText(displayedOriginal);
    if (viewport.width > 512) await panel.locator(".side-panel-close").click();
    else await page.keyboard.press("Escape");
    await switchGroup(page, "Work");
    await openPanel(page, "dashboard-panel");
    await expect(titles).toHaveText(displayedRenamed);
  }
});
