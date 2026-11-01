import { expect, test } from "@playwright/test";

import { openHeaderMenu } from "../../__util__";

test("4. 하단 더보기는 Guide·Search·Bookmark·Settings를 순서대로 표시하고 Tab으로 탐색한다", async ({
  page,
}) => {
  await test.step(
    "시나리오: 4. 하단 더보기는 Guide·Search·Bookmark·Settings를 순서대로 표시하고 Tab으로 탐색한다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 4. 하단 더보기는 Guide·Search·Bookmark·Settings를 순서대로 표시하고 Tab으로 탐색한다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await page.goto("/");
        },
        { box: true },
      );

      const tools = await openHeaderMenu(page);

      const buttons = tools.getByRole("button");

      await test.step(
        "검증 1: 4. 하단 더보기는 Guide·Search·Bookmark·Settings를 순서대로 표시하고 Tab으로 탐색한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(buttons).toHaveText([
            "Guide",
            "Search",
            "Bookmark",
            "Settings",
          ]);
        },
        { box: true },
      );

      await test.step(
        "실행 1: 4. 하단 더보기는 Guide·Search·Bookmark·Settings를 순서대로 표시하고 Tab으로 탐색한다 — 사용자가 접근할 수 있는 공개 UI 또는 API 경계를 통해 요구 동작을 수행한다",
        async () => {
          await buttons.first().focus();
        },
        { box: true },
      );

      await test.step(
        "검증 2: 4. 하단 더보기는 Guide·Search·Bookmark·Settings를 순서대로 표시하고 Tab으로 탐색한다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          for (let index = 1; index < 4; index += 1) {
            await page.keyboard.press("Tab");
            await expect(buttons.nth(index)).toBeFocused();
          }
        },
        { box: true },
      );
    },
    { box: true },
  );
});
