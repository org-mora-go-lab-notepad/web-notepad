import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { authenticateBrowser } from "../../__util__";
import { readCloudHistory } from "./__util__";

test("6. 빈 내용과 1~2자 본문도 길이를 이유로 DB에서 자동 삭제하지 않는다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: `cloud-threshold-${crypto.randomUUID()}`,
      nickname: "Cloud User",
      expiresAt: Date.now() + 60_000,
    }),
  );
  await page.goto("/");
  const editor = page.locator("textarea").first();
  const savedContent = async () => {
    const history = await readCloudHistory(page);
    if (!history.latest) return null;
    const state = JSON.parse(history.latest.snapshot);
    return state.groups[0]?.tabs[0]?.content ?? null;
  };

  await editor.fill("a");
  await expect.poll(savedContent).toBe("a");
  await editor.fill("ab");
  await expect.poll(savedContent).toBe("ab");
  await editor.fill("");
  await expect.poll(savedContent).toBe("");
  await expect(editor).toBeVisible();
});
