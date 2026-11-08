import { expect, test } from "@playwright/test";

import { dashboardColumn, openPanel, seedDashboardTabs } from "../../__util__";

test("5. Done 카드 메뉴에는 Closed 이동 바로가기가 없다", async ({ page }) => {
  await test.step(
    "시나리오: 5. Done 카드 메뉴에는 Closed 이동 바로가기가 없다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "실행 1: 5. Done 카드 메뉴에는 Closed 이동 바로가기가 없다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await seedDashboardTabs(page);
        },
        { box: true },
      );

      await test.step(
        "실행 2: 5. Done 카드 메뉴에는 Closed 이동 바로가기가 없다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await openPanel(page, "dashboard-panel");
        },
        { box: true },
      );

      const card = dashboardColumn(page, "in-progress").locator(
        ".dashboard-card",
        {
          hasText: "Beta task",
        },
      );

      await test.step(
        "실행 3: 5. Done 카드 메뉴에는 Closed 이동 바로가기가 없다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await card.click({ button: "right" });
        },
        { box: true },
      );

      await test.step(
        "검증 1: 5. Done 카드 메뉴에는 Closed 이동 바로가기가 없다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(
            page.getByRole("menu").getByRole("menuitem", {
              name: "Move to Closed",
              exact: true,
            }),
          ).toHaveCount(0);
        },
        { box: true },
      );
    },
    { box: true },
  );
});
