import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import {
  dashboardPanel,
  openPanel,
  readStoredState,
  seedDashboardTabs,
  switchGroup,
} from "../../__util__";

test("3. All Group도 상태 이름을 별도로 편집하고 개별 그룹 이름을 유지한다", async ({
  page,
}) => {
  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await seedDashboardTabs(page);
    await switchGroup(page, "All Group");
    const before = (await readStoredState(page)).groups.map(
      (group) => group.dashboardStatusNames,
    );
    await openPanel(page, "dashboard-panel");
    const panel = dashboardPanel(page);
    await panel.locator(".dashboard-options-trigger").click();
    await panel
      .getByRole("button", { name: "Edit Status", exact: true })
      .click();
    const editor = page.getByRole("dialog", {
      name: "Edit Status",
      exact: true,
    });
    await editor
      .getByRole("textbox", { name: "Waiting", exact: true })
      .fill("All tasks");
    await editor.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      panel.locator(".dashboard-todo-column .dashboard-status-label"),
    ).toHaveText("All tasks");
    expect(
      (await readStoredState(page)).groups.map(
        (group) => group.dashboardStatusNames,
      ),
    ).toEqual(before);
    await page.reload();
    await expect(
      panel.locator(".dashboard-todo-column .dashboard-status-label"),
    ).toHaveText("All tasks");
  }
});
