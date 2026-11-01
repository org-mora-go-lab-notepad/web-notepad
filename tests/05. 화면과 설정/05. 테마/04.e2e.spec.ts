import { expect, test } from "@playwright/test";

import { openSettingsPanel } from "../../__util__";

test("4. 다른 브라우저 탭의 테마 변경을 현재 열린 앱에 반영한다", async ({
  page,
  context,
}) => {
  await test.step(
    "시나리오: 4. 다른 브라우저 탭의 테마 변경을 현재 열린 앱에 반영한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 4. 다른 브라우저 탭의 테마 변경을 현재 열린 앱에 반영한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await page.goto("/");
        },
        { box: true },
      );

      const other = await context.newPage();

      await test.step(
        "준비 2: 4. 다른 브라우저 탭의 테마 변경을 현재 열린 앱에 반영한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await other.goto("/");
        },
        { box: true },
      );

      await test.step(
        "실행 1: 4. 다른 브라우저 탭의 테마 변경을 현재 열린 앱에 반영한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await openSettingsPanel(other);
        },
        { box: true },
      );

      await test.step(
        "실행 2: 4. 다른 브라우저 탭의 테마 변경을 현재 열린 앱에 반영한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await other.getByRole("switch", { name: "Theme" }).click();
        },
        { box: true },
      );

      await test.step(
        "검증 1: 4. 다른 브라우저 탭의 테마 변경을 현재 열린 앱에 반영한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.locator("html")).toHaveAttribute(
            "data-theme",
            "light",
          );
        },
        { box: true },
      );

      await test.step(
        "실행 3: 4. 다른 브라우저 탭의 테마 변경을 현재 열린 앱에 반영한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await other.close();
        },
        { box: true },
      );
    },
    { box: true },
  );
});
