import { expect, test } from "@playwright/test";

import { openSettingsPanel } from "../../__util__";

test("3. 테마를 노트와 별도로 저장하고 새로고침·재접속 시 복원한다", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.locator("textarea").fill("Keep this note");
  await openSettingsPanel(page);
  await page.getByRole("switch", { name: "Theme" }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("web-notepad-theme")),
  ).toBe("light");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("textarea")).toHaveValue("Keep this note");

  const reopened = await context.newPage();
  await reopened.goto("/");
  await expect(reopened.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(reopened.locator("textarea")).toHaveValue("Keep this note");
  await reopened.close();
});
