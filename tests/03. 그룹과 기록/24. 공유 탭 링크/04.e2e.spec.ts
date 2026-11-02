import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";

test("4. 개인 그룹 탭 메뉴에는 공유 링크가 없다", async ({ page }) => {
  await test.step(
    "시나리오: 4. 개인 그룹 탭 메뉴에는 공유 링크가 없다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 4. 개인 그룹 탭 메뉴에는 공유 링크가 없다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      await test.step(
        "실행 1: 4. 개인 그룹 탭 메뉴에는 공유 링크가 없다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await page
            .locator(".tab-item .tab-select")
            .first()
            .click({ button: "right" });
        },
        { box: true },
      );

      await test.step(
        "검증 1: 4. 개인 그룹 탭 메뉴에는 공유 링크가 없다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(
            page.getByRole("menuitem", { name: "Link", exact: true }),
          ).toHaveCount(0);
        },
        { box: true },
      );
    },
    { box: true },
  );
});
