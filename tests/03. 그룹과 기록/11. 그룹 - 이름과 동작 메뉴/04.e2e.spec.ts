import { expect, test } from "@playwright/test";

import {
  createGroupWithTab,
  groupsCommand,
  readStoredState,
} from "../../__util__";

test("4. 새 그룹 이름의 앞뒤 공백을 제거해 저장한다", async ({ page }) => {
  await test.step(
    "시나리오: 4. 새 그룹 이름의 앞뒤 공백을 제거해 저장한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 4. 새 그룹 이름의 앞뒤 공백을 제거해 저장한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await page.goto("/");
        },
        { box: true },
      );

      await test.step(
        "실행 1: 4. 새 그룹 이름의 앞뒤 공백을 제거해 저장한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await groupsCommand(page).click();
        },
        { box: true },
      );

      await test.step(
        "실행 2: 4. 새 그룹 이름의 앞뒤 공백을 제거해 저장한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await createGroupWithTab(page, "  Work  ");
        },
        { box: true },
      );

      const names = (await readStoredState(page)).groups.map(
        (group) => group.name,
      );

      await test.step(
        "검증 1: 4. 새 그룹 이름의 앞뒤 공백을 제거해 저장한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          expect(names).toContain("Work");
        },
        { box: true },
      );

      await test.step(
        "검증 2: 4. 새 그룹 이름의 앞뒤 공백을 제거해 저장한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          expect(names).not.toContain("  Work  ");
        },
        { box: true },
      );
    },
    { box: true },
  );
});
