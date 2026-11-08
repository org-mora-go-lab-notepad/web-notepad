import { expect, test } from "@playwright/test";

import { dashboardColumn, openPanel, restoreWorkspace } from "../../__util__";

test("3. 상태 표시명이 배열로 손상되면 기본 상태명을 사용한다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 3. 상태 표시명이 배열로 손상되면 기본 상태명을 사용한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "실행 1: 3. 상태 표시명이 배열로 손상되면 기본 상태명을 사용한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await restoreWorkspace(page, { dashboardStatusNames: ["wrong"] });
        },
        { box: true },
      );

      await test.step(
        "실행 2: 3. 상태 표시명이 배열로 손상되면 기본 상태명을 사용한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await openPanel(page, "dashboard-panel");
        },
        { box: true },
      );

      await test.step(
        "검증 1: 3. 상태 표시명이 배열로 손상되면 기본 상태명을 사용한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(
            dashboardColumn(page, "todo").locator(".dashboard-column-status"),
          ).toContainText("Waiting");
        },
        { box: true },
      );
    },
    { box: true },
  );
});
