import { expect, test } from "@playwright/test";

import { DESKTOP_VIEWPORT } from "../../__constant__";
import { createGroupsWithTabs, openPanel, switchGroup } from "../../__util__";

test("3. 그룹을 전환해도 고정 패널을 열린 상태로 유지한다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 3. 그룹을 전환해도 고정 패널을 열린 상태로 유지한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 3. 그룹을 전환해도 고정 패널을 열린 상태로 유지한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await page.setViewportSize(DESKTOP_VIEWPORT);
        },
        { box: true },
      );

      await test.step(
        "준비 2: 3. 그룹을 전환해도 고정 패널을 열린 상태로 유지한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await page.goto("/");
        },
        { box: true },
      );

      await test.step(
        "실행 1: 3. 그룹을 전환해도 고정 패널을 열린 상태로 유지한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await createGroupsWithTabs(page, "Alpha");
        },
        { box: true },
      );

      await test.step(
        "실행 2: 3. 그룹을 전환해도 고정 패널을 열린 상태로 유지한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await openPanel(page, "dashboard-panel");
        },
        { box: true },
      );

      await test.step(
        "실행 3: 3. 그룹을 전환해도 고정 패널을 열린 상태로 유지한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await switchGroup(page, "Ungrouped");
        },
        { box: true },
      );

      await test.step(
        "검증 1: 3. 그룹을 전환해도 고정 패널을 열린 상태로 유지한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.locator("#dashboard-panel")).toHaveAttribute(
            "aria-hidden",
            "false",
          );
        },
        { box: true },
      );
    },
    { box: true },
  );
});
