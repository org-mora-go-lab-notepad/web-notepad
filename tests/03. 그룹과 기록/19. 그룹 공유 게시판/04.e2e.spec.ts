import { expect } from "@playwright/test";

import { boardTest as test } from "../../__fixture__";

test("4. 비로그인 방문자가 초대를 열면 로그인 안내와 원래 공유 링크를 유지한다", async ({
  page,
  context,
  boardPost,
}) => {
  await context.clearCookies();
  await test.step("로그인하지 않고 초대 링크를 연다", async () => {
    await page.goto(boardPost.inviteUrl);
  });
  await test.step("로그인 안내와 원래 공유 토큰이 표시된다", async () => {
    await expect(
      page.getByRole("link", { name: "Continue with Kakao" }).last(),
    ).toBeVisible();
    await expect(page).toHaveURL(boardPost.inviteUrl);
    await expect(page.locator("#board-page")).toHaveCount(0);
  });
});
