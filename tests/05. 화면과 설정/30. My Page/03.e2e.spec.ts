import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { openEditor } from "../../__util__";
import { authenticateBrowser } from "../../__util__";
import { getApi } from "../../__util__/request";
test("3. 저장 대기 중 My Page로 이동해도 편집 내용을 서버에 저장한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: "my-save-" + crypto.randomUUID(),
      nickname: "Writer",
      expiresAt: Date.now() + 300000,
    }),
  );
  await openEditor(page);
  await expect(page.locator("button.auth-command")).toBeVisible();
  await page.locator("textarea").first().fill("Saved across My Page");
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "pending",
  );
  await page.locator("button.auth-command").click();
  await page.getByRole("menuitem", { name: "My Page", exact: true }).click();
  await expect(page.locator("[data-cloud-save]")).toHaveAttribute(
    "data-cloud-save",
    "saved",
    { timeout: 15000 },
  );
  const response = await getApi(page.request, "/api/notepad/history");
  expect(JSON.stringify(await response.json())).toContain(
    "Saved across My Page",
  );
});
