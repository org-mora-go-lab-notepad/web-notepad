import { expect, test } from "@playwright/test";

import { readStoredState, switchGroup } from "../../__util__";
import {
  dashboardLabels,
  defaultForm,
  defaultLabels,
  saveDefaults,
  seedDefaults,
} from "./__util__";

test("3. 기본 이름 초기화는 원래 이름을 복원하고 그룹별 사용자 이름을 유지한다", async ({
  page,
  context,
}) => {
  await seedDefaults(page, context, true);
  await saveDefaults(page);
  await defaultForm(page);
  await page
    .getByRole("button", { name: "Reset default status names", exact: true })
    .click();
  await page.locator("#settings-panel .side-panel-close").click();
  await expect(await dashboardLabels(page)).toHaveText(defaultLabels);
  expect(
    (await readStoredState(page)).settings!.dashboardStatusDefaults,
  ).toEqual({});
  await switchGroup(page, "Work");
  await expect(await dashboardLabels(page)).toHaveText([
    "To Do",
    "Waiting",
    "Work queue",
    "Done",
    "Closed",
  ]);
});
