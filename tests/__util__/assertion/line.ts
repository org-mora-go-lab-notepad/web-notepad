import { expect, type Locator, type Page } from "@playwright/test";

// Line number buttons in the editor line rail of the page or of a single pane.
export const lineButtons = (scope: Page | Locator) =>
  scope.locator('.line-rail:visible [role="button"]');

// Asserts aria-pressed for the leading lines, in order (index 0 first).
export async function expectSelectedLines(
  scope: Page | Locator,
  pressed: boolean[],
) {
  const lines = lineButtons(scope);
  for (const [index, isPressed] of pressed.entries()) {
    await expect(lines.nth(index)).toHaveAttribute(
      "aria-pressed",
      String(isPressed),
    );
  }
}
