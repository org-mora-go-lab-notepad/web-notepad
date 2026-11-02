import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";

test("6. 새 탭을 만들면 새 탭이 선택 상태가 된다", async ({ page }) => {
  await test.step(
    "시나리오: 6. 새 탭을 만들면 새 탭이 선택 상태가 된다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 6. 새 탭을 만들면 새 탭이 선택 상태가 된다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      await test.step(
        "실행 1: 6. 새 탭을 만들면 새 탭이 선택 상태가 된다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page
            .getByRole("button", { name: "New tab", exact: true })
            .click();
        },
        { box: true },
      );

      await test.step(
        "검증 1: 6. 새 탭을 만들면 새 탭이 선택 상태가 된다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.getByRole("tab", { selected: true })).toHaveText(
            "-",
          );
        },
        { box: true },
      );

      await test.step(
        "검증 2: 6. 새 탭을 만들면 새 탭이 선택 상태가 된다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.getByRole("tab", { selected: false })).toHaveCount(
            1,
          );
        },
        { box: true },
      );
    },
    { box: true },
  );
});
