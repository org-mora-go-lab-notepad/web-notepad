import { expect, test } from "@playwright/test";

test("6. 사이드바의 열림과 닫힘 상태를 새로고침 후 복원한다", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".dashboard-command").click();
  await expect(page.locator("#dashboard-panel")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  const menuButton = page.getByRole("button", { name: "Toggle groups" });

  await menuButton.click();
  await expect(page.locator("#groups-menu")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem("web-notepad-group-sidebar-open"),
      ),
    )
    .toBe("true");

  await page.reload();
  await expect(page.locator("#groups-menu")).toBeVisible();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");

  await page.getByRole("button", { name: "Close Menu" }).click();
  await expect(page.locator("#groups-menu")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#groups-menu")).toHaveCount(0);
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
});
