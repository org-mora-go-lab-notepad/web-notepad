import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";
import {
  authenticateBrowser,
  createGroupWithTab,
  groupActionsButton,
  groupsCommand,
  moreCommand,
  systemGroupCommand,
} from "../../__util__";

test("1. 아이콘으로 여는 드롭다운의 바깥 모서리는 모두 5px이다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(context);
  await openEditor(page);

  await page.locator("button.auth-command").click();
  await expect(page.locator(".auth-menu")).toHaveCSS("border-radius", "5px");
  await page.keyboard.press("Escape");

  await groupsCommand(page).click();
  await createGroupWithTab(page, "Radius group");
  await groupActionsButton(page, "Radius group").click();
  await expect(page.locator(".group-action-dropdown")).toHaveCSS(
    "border-radius",
    "5px",
  );

  await systemGroupCommand(page).click();
  await expect(page.locator(".group-system-menu")).toHaveCSS(
    "border-radius",
    "5px",
  );
  await moreCommand(page).click();
  await expect(page.locator(".group-more-menu")).toHaveCSS(
    "border-radius",
    "5px",
  );
  await groupsCommand(page).click();

  await page.getByRole("tab").first().click({ button: "right" });
  await expect(page.locator(".tab-context-menu")).toHaveCSS(
    "border-radius",
    "5px",
  );
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Card" }).click();
  await page.locator(".dashboard-options-trigger").click();
  await expect(page.locator(".dashboard-options-menu")).toHaveCSS(
    "border-radius",
    "5px",
  );
});
