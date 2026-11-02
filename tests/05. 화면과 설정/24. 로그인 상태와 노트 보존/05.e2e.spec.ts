import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";

test("5. 세션 조회 네트워크 실패 후에도 로그인 진입점을 다시 활성화한다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 5. 세션 조회 네트워크 실패 후에도 로그인 진입점을 다시 활성화한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 5. 세션 조회 네트워크 실패 후에도 로그인 진입점을 다시 활성화한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await page.route("**/api/auth/session", (route) => route.abort());
        },
        { box: true },
      );

      await test.step(
        "준비 2: 5. 세션 조회 네트워크 실패 후에도 로그인 진입점을 다시 활성화한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      await test.step(
        "검증 1: 5. 세션 조회 네트워크 실패 후에도 로그인 진입점을 다시 활성화한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.locator("a.auth-command")).toHaveAttribute(
            "aria-disabled",
            "false",
          );
        },
        { box: true },
      );

      await test.step(
        "검증 2: 5. 세션 조회 네트워크 실패 후에도 로그인 진입점을 다시 활성화한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.locator("textarea")).toBeEditable();
        },
        { box: true },
      );
    },
    { box: true },
  );
});
