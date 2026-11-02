import { expect, test } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { openEditor } from "../../__util__";
import {
  authenticateBrowser,
  dashboardColumn,
  openPanel,
} from "../../__util__";
import { readCloudHistory } from "./__util__";

test("2. 노트 상태 변경을 Turso 스냅샷에 저장한다", async ({
  page,
  context,
}) => {
  await authenticateBrowser(
    context,
    signedSession({
      id: `cloud-status-${crypto.randomUUID()}`,
      nickname: "Cloud User",
      expiresAt: Date.now() + 60_000,
    }),
  );
  await openEditor(page);
  await expect(page.locator("button.auth-command")).toContainText("Cloud User");
  await page.locator("textarea").first().fill("상태 변경 글");
  await openPanel(page, "dashboard-panel");
  await dashboardColumn(page, "todo")
    .locator(".dashboard-card")
    .dragTo(dashboardColumn(page, "done"));
  await expect(page.locator(".home")).toHaveAttribute(
    "data-cloud-save",
    "saved",
    { timeout: 15_000 },
  );
  const history = await readCloudHistory(page);
  const snapshot = JSON.parse(history.latest!.snapshot);
  const tab = snapshot.groups
    .flatMap(
      (group: { tabs: { content: string; tabColor: string }[] }) => group.tabs,
    )
    .find((entry: { content: string }) => entry.content === "상태 변경 글");
  expect(tab?.tabColor).toBe("teal");
});
