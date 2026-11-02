import { expect, test } from "@playwright/test";

import { openEditor } from "../../__util__";

test("5. 첫 번째 비어 있지 않은 줄을 공백 제거 후 최대 28자로 표시한다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 5. 첫 번째 비어 있지 않은 줄을 공백 제거 후 최대 28자로 표시한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 5. 첫 번째 비어 있지 않은 줄을 공백 제거 후 최대 28자로 표시한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await openEditor(page);
        },
        { box: true },
      );

      const title = page.locator(".tab-item.is-active .tab-title");

      const editor = page.locator("textarea");

      await test.step(
        "실행 1: 5. 첫 번째 비어 있지 않은 줄을 공백 제거 후 최대 28자로 표시한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.fill("  First title  \nsecond line");
        },
        { box: true },
      );

      await test.step(
        "검증 1: 5. 첫 번째 비어 있지 않은 줄을 공백 제거 후 최대 28자로 표시한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(title).toHaveText("First title");
        },
        { box: true },
      );

      await test.step(
        "실행 2: 5. 첫 번째 비어 있지 않은 줄을 공백 제거 후 최대 28자로 표시한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.fill("\n   \n  Third line title  \nnext");
        },
        { box: true },
      );

      await test.step(
        "검증 2: 5. 첫 번째 비어 있지 않은 줄을 공백 제거 후 최대 28자로 표시한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(title).toHaveText("Third line title");
        },
        { box: true },
      );

      await test.step(
        "실행 3: 5. 첫 번째 비어 있지 않은 줄을 공백 제거 후 최대 28자로 표시한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.fill("A".repeat(40));
        },
        { box: true },
      );

      await test.step(
        "검증 3: 5. 첫 번째 비어 있지 않은 줄을 공백 제거 후 최대 28자로 표시한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(title).toHaveText("A".repeat(28));
        },
        { box: true },
      );

      await test.step(
        "실행 4: 5. 첫 번째 비어 있지 않은 줄을 공백 제거 후 최대 28자로 표시한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await editor.fill(`   ${"B".repeat(28)}C   `);
        },
        { box: true },
      );

      await test.step(
        "검증 4: 5. 첫 번째 비어 있지 않은 줄을 공백 제거 후 최대 28자로 표시한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(title).toHaveText("B".repeat(28));
        },
        { box: true },
      );
    },
    { box: true },
  );
});
