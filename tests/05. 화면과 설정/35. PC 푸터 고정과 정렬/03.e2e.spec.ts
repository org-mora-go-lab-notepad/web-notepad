import { expect, test } from "@playwright/test";

test("3. 푸터 드래그는 앞뒤 삽입 위치를 표시하고 놓은 순서를 복원한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.goto("/");
  const items = page.locator(".footer-dock-item");
  const menu = page.locator('[data-footer-item="core:groups"]');
  const account = page.locator('[data-footer-item="core:account"]');
  const more = page.locator(".footer .more-command");
  await expect(page.locator(".auth-command:not(.is-loading)")).toBeVisible();
  const original = await items.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-footer-item")),
  );
  const moreBefore = (await more.boundingBox())!;
  const transfer = await page.evaluateHandle(() => new DataTransfer());
  await menu.dispatchEvent("dragstart", { dataTransfer: transfer });
  await expect(menu).toHaveClass(/is-dragging/);
  const target = (await account.boundingBox())!;
  const after = target.x + target.width + 5;
  await page
    .locator(".footer-dock")
    .dispatchEvent("dragover", { dataTransfer: transfer, clientX: after });
  await expect(account).toHaveClass(/is-drop-after/);
  expect(
    await account.evaluate((node) => getComputedStyle(node, "::after").width),
  ).toBe("3px");
  expect(
    await items.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-footer-item")),
    ),
  ).toEqual(original);
  await page
    .locator(".footer-dock")
    .dispatchEvent("drop", { dataTransfer: transfer, clientX: after });
  await expect(items.last()).toHaveAttribute("data-footer-item", "core:groups");
  await expect(
    page.locator(".is-drop-before, .is-drop-after, .is-dragging"),
  ).toHaveCount(0);
  await page.reload();
  await expect(items.last()).toHaveAttribute("data-footer-item", "core:groups");
  const card = page.locator('[data-footer-item="core:dashboard"]');
  const first = (await card.boundingBox())!;
  const secondTransfer = await page.evaluateHandle(() => new DataTransfer());
  await menu.dispatchEvent("dragstart", { dataTransfer: secondTransfer });
  await card.dispatchEvent("dragover", {
    dataTransfer: secondTransfer,
    clientX: first.x + 1,
  });
  await expect(card).toHaveClass(/is-drop-before/);
  await card.dispatchEvent("drop", {
    dataTransfer: secondTransfer,
    clientX: first.x + 1,
  });
  await expect(items.first()).toHaveAttribute(
    "data-footer-item",
    "core:groups",
  );
  expect((await more.boundingBox())!.x).toBeCloseTo(moreBefore.x, 1);
  await expect(page.locator(".footer-more [draggable=true]")).toHaveCount(0);
});
