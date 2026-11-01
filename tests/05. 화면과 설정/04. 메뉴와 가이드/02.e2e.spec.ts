import { expect, test } from "@playwright/test";

import { openHeaderMenu } from "../../__util__";

test("2. User Guide 1/11의 Shortcut 진입점은 단축키 패널을 연다", async ({
  page,
}) => {
  await page.goto("/");
  const tools = await openHeaderMenu(page);
  await tools.getByRole("button", { name: "Guide" }).click();
  const guide = page.getByRole("dialog");
  await expect(guide.locator(".user-guide-progress")).toHaveText("1 / 11");
  await expect(
    guide.getByRole("heading", { name: "Keyboard shortcuts" }),
  ).toBeVisible();
  await guide.getByRole("button", { name: "Shortcut" }).click();
  await expect(page.locator("#group-more-menu")).toHaveCount(0);
  await expect(page.locator("#shortcuts-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
});
