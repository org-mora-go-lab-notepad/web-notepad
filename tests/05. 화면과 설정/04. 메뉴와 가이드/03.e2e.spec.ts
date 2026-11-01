import { expect, test } from "@playwright/test";

import { openGuide } from "../../__util__";

test("3. 하단 더보기의 Guide는 User Guide 팝업을 연다", async ({ page }) => {
  await test.step(
    "시나리오: 3. 하단 더보기의 Guide는 User Guide 팝업을 연다 — 준비 조건부터 공개 UI 또는 API 실행과 사용자 결과 검증까지 독립적으로 추적한다",
    async () => {
      await test.step(
        "준비 1: 3. 하단 더보기의 Guide는 User Guide 팝업을 연다 — 다른 사례와 독립적으로 실행하는 데 필요한 상태와 화면을 먼저 구성한다",
        async () => {
          await page.goto("/");
        },
        { box: true },
      );

      const guide = await openGuide(page);

      await test.step(
        "검증 1: 3. 하단 더보기의 Guide는 User Guide 팝업을 연다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(guide).toBeVisible();
        },
        { box: true },
      );

      await test.step(
        "검증 2: 3. 하단 더보기의 Guide는 User Guide 팝업을 연다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(
            guide.getByRole("heading", { name: "User Guide" }),
          ).toBeVisible();
        },
        { box: true },
      );

      await test.step(
        "검증 3: 3. 하단 더보기의 Guide는 User Guide 팝업을 연다 — PRD에 기록된 사용자 결과를 이 파일의 assertion으로 직접 확인한다",
        async () => {
          await expect(page.locator(".user-guide-progress")).toHaveText(
            "1 / 11",
          );
        },
        { box: true },
      );
    },
    { box: true },
  );
});
