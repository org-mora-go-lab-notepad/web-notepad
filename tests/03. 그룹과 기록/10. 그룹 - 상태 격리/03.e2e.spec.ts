import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import {
  addTabButton,
  createGroupsWithTabs,
  readStoredState,
  switchGroup,
} from "../../__util__";
import { dragTabToZone, paneSlot } from "../../02. 노트 편집/__util__";

test("3. 각 그룹은 마지막으로 활성화한 분할 편집기를 독립적으로 복원한다", async ({
  page,
}) => {
  await openEditor(page);
  await page.locator("textarea").fill("ungrouped left");
  await addTabButton(page).click();
  await page.locator("textarea").fill("ungrouped right");
  await dragTabToZone(
    page,
    page.getByRole("tab", { selected: true }).locator(".tab-title"),
    paneSlot(page, "left"),
    "Split right",
  );
  await page.locator(".pane-slot").nth(0).locator("textarea").click();

  await createGroupsWithTabs(page, "Work");
  await page.locator("textarea").fill("work left");
  await addTabButton(page).click();
  await page.locator("textarea").fill("work right");
  await dragTabToZone(
    page,
    page.getByRole("tab", { selected: true }).locator(".tab-title"),
    paneSlot(page, "left"),
    "Split right",
  );
  await page.locator(".pane-slot").nth(1).locator("textarea").click();

  await switchGroup(page, "Ungrouped");
  await expect(page.locator(".pane-slot")).toHaveCount(2);
  await expect(
    page.locator(".pane-slot").nth(0).locator(".note-pane"),
  ).not.toHaveClass(/is-unfocused/);
  await expect(
    page.locator(".pane-slot").nth(1).locator(".note-pane"),
  ).toHaveClass(/is-unfocused/);

  await switchGroup(page, "Work");
  await expect(page.locator(".pane-slot")).toHaveCount(2);
  await expect(
    page.locator(".pane-slot").nth(0).locator(".note-pane"),
  ).toHaveClass(/is-unfocused/);
  await expect(
    page.locator(".pane-slot").nth(1).locator(".note-pane"),
  ).not.toHaveClass(/is-unfocused/);

  const groups = (await readStoredState(page)).groups;
  expect(groups.find((group) => group.name === "Ungrouped")!.activePane).toBe(
    "left",
  );
  expect(groups.find((group) => group.name === "Work")!.activePane).toBe(
    "right",
  );
});
