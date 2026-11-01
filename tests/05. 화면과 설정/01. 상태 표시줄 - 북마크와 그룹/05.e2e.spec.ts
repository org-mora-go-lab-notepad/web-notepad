import { expect, test } from "@playwright/test";

import { createGroup, groupsCommand } from "../../__util__";

test("5. PC에서 그룹 동작 아이콘 메뉴에는 Bookmark가 없다", async ({
  page,
}) => {
  await page.goto("/");
  await groupsCommand(page).click();
  await createGroup(page, "Work");
  const selectedBefore = await page
    .locator(".group-current-value")
    .textContent();
  const row = page.locator(".group-item", {
    has: page.getByRole("button", { name: "Work", exact: true }),
  });
  await row.locator(".group-actions > button").click();
  await expect(row.locator(".group-action-dropdown")).toBeVisible();
  await expect(
    row.locator(".group-action-dropdown").getByRole("button"),
  ).toHaveText(["Close All", "Share", "Edit", "Delete"]);
  await page.keyboard.press("Escape");
  await row.locator(".group-select").click({ button: "right" });
  await expect(row.locator("[role=menuitem]")).toHaveText([
    "Close All",
    "Pin to footer",
    "Edit",
  ]);
  await row.getByRole("menuitem", { name: "Edit Work group" }).click();
  await expect(page.locator(".group-edit-form input")).toHaveValue("Work");
  await page.keyboard.press("Escape");
  await expect(page.locator(".group-current-value")).toHaveText(
    selectedBefore!,
  );
});
