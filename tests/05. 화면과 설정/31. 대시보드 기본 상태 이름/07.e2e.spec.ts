import { expect, test } from "@playwright/test";

import {
  authenticateBrowser,
  openPanel,
  writeStoredState,
} from "../../__util__";
import { dashboardLabels } from "./__util__";

test("7. 한국어 기본 상태 이름을 설정과 대시보드에 표시한다", async ({
  page,
  context,
}) => {
  const labels = ["할 일", "대기중", "진행중", "완료", "종료"];
  await authenticateBrowser(context);
  await writeStoredState(page, { settings: { language: "ko" } });
  await openPanel(page, "settings-panel");
  const form = page.getByRole("form", { name: "기본 상태 이름" });
  await expect(form.locator("label > span")).toHaveText(labels);
  for (const name of labels)
    await expect(
      form.getByRole("textbox", { name, exact: true }),
    ).toHaveAttribute("placeholder", name);
  await page.locator("#settings-panel .side-panel-close").click();
  await expect(await dashboardLabels(page)).toHaveText(labels);
});
