import { expect, test } from "@playwright/test";

import {
  moveDashboardCard,
  readActiveGroup,
  seedStatusIntegrity,
} from "../../__util__";

test("3. 백그라운드 카드의 상태 변경은 현재 편집 탭을 전환하지 않는다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 3. 백그라운드 카드의 상태 변경은 현재 편집 탭을 전환하지 않는다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "실행 1: 3. 백그라운드 카드의 상태 변경은 현재 편집 탭을 전환하지 않는다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await seedStatusIntegrity(page, {}, { activeTabId: "tab-2" });
        },
        { box: true },
      );

      await test.step(
        "실행 2: 3. 백그라운드 카드의 상태 변경은 현재 편집 탭을 전환하지 않는다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await moveDashboardCard(page, "in-progress");
        },
        { box: true },
      );

      await test.step(
        "검증 1: 3. 백그라운드 카드의 상태 변경은 현재 편집 탭을 전환하지 않는다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.locator("textarea")).toHaveValue("Sibling task");
        },
        { box: true },
      );

      await test.step(
        "검증 2: 3. 백그라운드 카드의 상태 변경은 현재 편집 탭을 전환하지 않는다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          expect((await readActiveGroup(page)).activeTabId).toBe("tab-2");
        },
        { box: true },
      );
    },
    { box: true },
  );
});
