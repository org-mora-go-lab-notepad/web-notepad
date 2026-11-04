import { expect, type Page } from "@playwright/test";

import { signedSession } from "../../__fixture__";
import { authenticateBrowser } from "../auth";
import { closeMobileEditor } from "./editor";

// Account menu cases use a real, isolated session when setup starts as a guest.
export async function openAccountMenu(page: Page) {
  await closeMobileEditor(page);
  await expect(page.locator(".auth-command:not(.is-loading)")).toBeVisible();
  const trigger = page.locator("button.auth-command");
  if (!(await trigger.count())) {
    await authenticateBrowser(
      page.context(),
      signedSession({
        id: "settings-" + crypto.randomUUID(),
        nickname: "Settings User",
        expiresAt: Date.now() + 300_000,
      }),
    );
    await page.evaluate(() =>
      window.dispatchEvent(new Event("notepad-auth-changed")),
    );
    await expect(trigger).toBeVisible();
  }
  if ((await trigger.getAttribute("aria-expanded")) !== "true")
    await trigger.press("Enter");
  return page.locator("#account-menu");
}
