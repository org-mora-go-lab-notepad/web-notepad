import { expect, test } from "@playwright/test";

import { openPanel, readStoredState, switchGroup } from "../../__util__";
import { customLabels, saveDefaults, seedDefaults } from "./__util__";

test("6. 그룹 상태 편집은 사용자 기본 이름을 라벨로 쓰고 빈 placeholder를 제공한다", async ({
  page,
  context,
}) => {
  await seedDefaults(page, context, true);
  await saveDefaults(page);
  await switchGroup(page, "Work");
  await openPanel(page, "dashboard-panel");
  const openEditor = async () => {
    await page.locator(".dashboard-options-trigger").click();
    await page
      .getByRole("button", { name: "Edit Status", exact: true })
      .click();
  };
  await openEditor();
  const editor = page.getByRole("dialog", { name: "Edit Status", exact: true });
  await expect(editor.locator("label > span")).toHaveText(customLabels);
  for (const label of customLabels) {
    const input = editor.getByRole("textbox", { name: label, exact: true });
    await expect(input).toHaveAttribute("placeholder", "");
    await expect(input).toHaveValue(label === "Queued" ? "Work queue" : "");
  }
  await editor
    .getByRole("textbox", { name: "Ideas", exact: true })
    .fill("Work ideas");
  await editor.getByRole("button", { name: "Save", exact: true }).click();
  const stored = await readStoredState(page);
  expect(stored.settings?.dashboardStatusDefaults?.icebox).toBe("Ideas");
  expect(
    stored.groups.find((group) => group.id === "work")?.dashboardStatusNames
      ?.icebox,
  ).toBe("Work ideas");
  await page.reload();
  await openEditor();
  await expect(editor.locator("label > span")).toHaveText(customLabels);
  await expect(
    editor.getByRole("textbox", { name: "Ideas", exact: true }),
  ).toHaveValue("Work ideas");
  await expect(
    editor.getByRole("textbox", { name: "Queued", exact: true }),
  ).toHaveValue("Work queue");
});
