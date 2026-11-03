import { expect, test } from "@playwright/test";

import { groupsCommand, openSettingsPanel } from "../../__util__";

test("8. PC에서 그룹과 패널의 좌우 위치 네 조합 모두 에디터와 겹치지 않는다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await openSettingsPanel(page);
  await groupsCommand(page).click();
  const panel = page.locator("#settings-panel");
  const group = page.locator("#groups-menu");
  for (const groupSide of ["Left", "Right"]) {
    await panel
      .getByRole("radiogroup", { name: "Group Position", exact: true })
      .getByRole("radio", { name: groupSide, exact: true })
      .check();
    for (const panelSide of ["Left", "Right"]) {
      await panel
        .getByRole("radiogroup", { name: "Panel Position", exact: true })
        .getByRole("radio", { name: panelSide, exact: true })
        .check();
      const g = (await group.boundingBox())!;
      const p = (await panel.boundingBox())!;
      const w = (await page.locator(".workspace").boundingBox())!;
      expect(g.width + p.width + w.width).toBeCloseTo(1440, 0);
      expect(groupSide === "Left" ? g.x : g.x + g.width).toBeCloseTo(
        groupSide === "Left" ? 0 : 1440,
        0,
      );
      const leftSpace =
        (groupSide === "Left" ? g.width : 0) +
        (panelSide === "Left" ? p.width : 0);
      expect(w.x).toBeCloseTo(leftSpace, 0);
      expect(p.x + p.width <= g.x + 1 || g.x + g.width <= p.x + 1).toBe(true);
      expect(p.x + p.width <= w.x + 1 || w.x + w.width <= p.x + 1).toBe(true);
      expect(g.x + g.width <= w.x + 1 || w.x + w.width <= g.x + 1).toBe(true);
    }
  }
});
