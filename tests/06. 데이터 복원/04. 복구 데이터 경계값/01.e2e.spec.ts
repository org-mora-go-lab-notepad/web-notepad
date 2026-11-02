import { expect, test } from "@playwright/test";

import { seedStoredStateOnLoad } from "../../__util__";

test("1. 저장 상태가 null이면 기본 작업공간으로 복구한다", async ({ page }) => {
  await test.step(
    "시나리오: 1. 저장 상태가 null이면 기본 작업공간으로 복구한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "실행 1: 1. 저장 상태가 null이면 기본 작업공간으로 복구한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await seedStoredStateOnLoad(page, null);
        },
        { box: true },
      );

      await test.step(
        "검증 1: 1. 저장 상태가 null이면 기본 작업공간으로 복구한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.locator(".tab-item")).toHaveCount(0);
        },
        { box: true },
      );

      await test.step(
        "검증 2: 1. 저장 상태가 null이면 기본 작업공간으로 복구한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.locator("textarea")).toHaveCount(0);
          await expect(
            page.getByRole("button", { name: "New tab", exact: true }),
          ).toBeVisible();
        },
        { box: true },
      );
    },
    { box: true },
  );
});
