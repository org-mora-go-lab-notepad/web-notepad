import { expect } from "@playwright/test";

import { sharingTest as test } from "../../__fixture__";
import { openPanel, toggleDashboardStatus } from "../../__util__";

test("5. 공유 그룹의 Edit Status 이름은 협업자에게 같은 상태 순서로 동기화한다", async ({
  sharing: { owner, guest },
}) => {
  test.setTimeout(60000);
  await guest.setViewportSize({ width: 390, height: 800 });
  for (const page of [owner, guest]) {
    await page.keyboard.press("Escape");
    await openPanel(page, "dashboard-panel");
    await toggleDashboardStatus(page, "icebox");
  }
  const defaults = ["To Do", "Waiting", "In Progress", "Done", "Closed"];
  const names = ["Ideas", "Next", "Queued", "Working", "Shipped"];
  await owner.locator(".dashboard-options-trigger").click();
  await owner.getByRole("button", { name: "Edit Status", exact: true }).click();
  const dialog = owner.getByRole("dialog", {
    name: "Edit Status",
    exact: true,
  });
  for (let index = 0; index < defaults.length; index++)
    await dialog
      .getByRole("textbox", { name: defaults[index], exact: true })
      .fill(names[index]);
  const saved = owner.waitForResponse(
    (response) =>
      response.url().endsWith("/api/groups/update") && response.ok(),
  );
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await saved;
  await guest.reload();
  await expect(
    guest.locator(".dashboard-statuses .dashboard-status-label"),
  ).toHaveText(names);
  await guest.locator(".dashboard-options-trigger").click();
  await guest.getByRole("button", { name: "Edit Status", exact: true }).click();
  const guestDialog = guest.getByRole("dialog", {
    name: "Edit Status",
    exact: true,
  });
  await expect(
    guestDialog.getByRole("textbox", { name: "In Progress", exact: true }),
  ).toHaveValue("Queued");
  await guestDialog
    .getByRole("textbox", { name: "In Progress", exact: true })
    .fill("Prepared");
  const guestSaved = guest.waitForResponse(
    (response) =>
      response.url().endsWith("/api/groups/update") && response.ok(),
  );
  await guestDialog.getByRole("button", { name: "Save", exact: true }).click();
  await guestSaved;
  await owner.reload();
  for (const page of [owner, guest]) {
    await expect(
      page.locator(".dashboard-statuses .dashboard-status-label"),
    ).toHaveText(["Ideas", "Next", "Prepared", "Working", "Shipped"]);
    await expect
      .poll(() =>
        page
          .locator(".dashboard-column")
          .evaluateAll((columns) =>
            columns.map((column) => column.getAttribute("data-status")),
          ),
      )
      .toEqual(["icebox", "todo", "ready", "in-progress", "done"]);
  }
});
