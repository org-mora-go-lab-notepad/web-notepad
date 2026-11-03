import { expect, test } from "@playwright/test";

import { BOTH_VIEWPORTS } from "../../__constant__";
import { openEditor } from "../../__util__";
import {
  groupStatusName,
  moreCommand,
  openHeaderMenu,
  openMoreMenu,
  openSettingsPanel,
  openSystemGroupMenu,
  readStoredState,
} from "../../__util__";
import { languageRadio, settingsPanel } from "../__util__";

test("4. 선택한 언어를 메뉴·패널·하단 메뉴·편집기 안내 문구에 즉시 적용한다", async ({
  page,
}) => {
  await openEditor(page);
  await openSettingsPanel(page);
  const panel = settingsPanel(page);
  const headings = panel.locator(".setting-section h3");

  await languageRadio(page, "한국어").check();
  await expect(panel.locator("h2")).toHaveText("설정");
  await expect(headings).toHaveText([
    "테마",
    "전체 폰트 크기",
    "탭 색상",
    "언어",
    "그룹 위치",
    "패널 위치",
    "푸터에서 아이콘만 표시",
    "기본 상태 이름",
    "데이터",
  ]);
  await expect(panel.locator(".setting-hint").first()).toContainText(
    "새 탭은 첫 번째 색상으로 시작합니다.그레이 → 오렌지 → 인디고",
  );
  await expect(page.locator(".note-area")).toHaveAttribute(
    "placeholder",
    "메모를 입력하세요..",
  );

  await page.getByRole("button", { name: "설정 닫기" }).click();
  const tools = await openHeaderMenu(page);
  await expect(moreCommand(page).locator(".more-command-label")).toHaveText(
    "메뉴",
  );
  await expect(moreCommand(page)).toHaveAccessibleName("메뉴");
  await expect(tools.getByRole("button", { name: "검색" })).toBeVisible();
  await expect(
    tools.getByRole("button", { name: "설정", exact: true }),
  ).toBeVisible();
  await expect(tools.getByRole("button", { name: "닫은 탭" })).toHaveCount(0);
  await page.keyboard.press("Escape");

  for (const viewport of BOTH_VIEWPORTS) {
    await page.setViewportSize(viewport);
    if (viewport.width <= 512)
      await expect(page.locator(".group-command-label")).toHaveText("그룹");
    const groupMenu = await openSystemGroupMenu(page);
    await expect(
      page.locator("#groups-menu .group-sidebar-header h2"),
    ).toHaveText("그룹");
    await expect(page.locator(".system-group-command")).toHaveText("그룹 옵션");
    await expect(
      page.locator(".system-group-command svg.lucide-layers"),
    ).toBeVisible();
    await expect(
      groupMenu.getByRole("button", { name: "미지정 그룹", exact: true }),
    ).toBeVisible();
    await groupMenu
      .getByRole("button", { name: "모든 그룹", exact: true })
      .click();
    await expect(groupStatusName(page)).toHaveText("모든 그룹");
    const reopenedMenu = await openSystemGroupMenu(page);
    await reopenedMenu
      .getByRole("button", { name: "미지정 그룹", exact: true })
      .click();
    await expect(groupStatusName(page)).toHaveText("미지정 그룹");
    if (viewport.width > 512) await page.keyboard.press("Escape");
  }
  expect(
    (await readStoredState(page)).groups.find(
      (group) => group.id === "ungrouped",
    )!.name,
  ).toBe("Ungrouped");

  await openSettingsPanel(page);
  await languageRadio(page, "English").check();
  await expect(panel.locator("h2")).toHaveText("Settings");
  if ((await page.viewportSize())!.width <= 512)
    await expect(page.locator(".group-command-label")).toBeHidden();
  await expect(groupStatusName(page)).toHaveText("Ungrouped");
  await page.getByRole("button", { name: "Close Settings" }).click();
  await openMoreMenu(page);
  await expect(moreCommand(page)).toHaveAccessibleName("Menu");
  await expect(moreCommand(page).locator(".more-command-label")).toHaveText(
    "Menu",
  );
  const systemGroups = await openSystemGroupMenu(page);
  await expect(
    systemGroups.getByRole("button", { name: "All Group", exact: true }),
  ).toBeVisible();
  await expect(
    systemGroups.getByRole("button", { name: "Ungrouped", exact: true }),
  ).toBeVisible();
});
