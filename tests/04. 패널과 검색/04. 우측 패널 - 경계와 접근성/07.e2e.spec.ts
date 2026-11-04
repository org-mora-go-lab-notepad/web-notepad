import { expect, test } from "@playwright/test";

import { groupsCommand, openEditor, openPanel } from "../../__util__";
test("7. PC 탭과 좌우 패널의 헤더 높이와 본문 시작선이 같다", async ({
  page,
}) => {
  await openEditor(page);
  await groupsCommand(page).click();
  await openPanel(page, "dashboard-panel");
  const tab = await page.locator(".note-pane .header").first().boundingBox();
  expect(tab!.height).toBe(44);
  for (const selector of [
    ".group-sidebar-header",
    "#dashboard-panel .side-panel-header",
  ]) {
    const box = await page.locator(selector).boundingBox();
    expect(box!.height).toBe(tab!.height);
    expect(box!.y).toBe(tab!.y);
    expect(box!.height).toBeGreaterThan(0);
    expect(box!.y + box!.height).toBe(tab!.y + tab!.height);
  }
});
