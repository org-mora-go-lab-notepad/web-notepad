import { expect } from "@playwright/test";

import { boardTest as test } from "../../__fixture__";
import { openBoard } from "../../__util__";

test("1. role admin은 관리자 화면을 열거나 관리 동작을 활성화하지 않는다", async ({
  page,
}) => {
  await page.goto("/?role=admin");
  await expect(page.locator("#board-page")).toBeHidden();
  await page.route("**/api/board", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await openBoard(page);
  await expect(page.locator(".board-entry")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(
      ".board-admin-badge, .board-admin-actions, .board-form, .board-publish, .board-remove-confirm",
    ),
  ).toHaveCount(0);
  await expect(page.locator(".board-detail")).toHaveCount(0);
});
