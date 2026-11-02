import { expect, test } from "@playwright/test";

import { openGlobalSearchPanel, seedStoredStateOnLoad } from "../../__util__";
import { createGlobalSearchState } from "./__fixture__";

test("4. 입력이 멈춘 뒤 0.3초 후 탭 제목과 본문을 부분 검색한다", async ({
  page,
}) => {
  await seedStoredStateOnLoad(page, createGlobalSearchState());
  await openGlobalSearchPanel(page);
  await page.evaluate(() => {
    type Sample = {
      query: string;
      started: number;
      before: string | null;
      changes: { title: string | null; elapsed: number }[];
    };
    const samples: Sample[] = [];
    Object.assign(window, { searchTimingSamples: samples });
    const input = document.querySelector<HTMLInputElement>(
      "#global-search-popup input",
    )!;
    const list = document.querySelector(".global-search-list")!;
    const title = () =>
      list.querySelector(".global-search-result strong")?.textContent ?? null;
    input.addEventListener("input", () =>
      samples.push({
        query: input.value,
        started: performance.now(),
        before: title(),
        changes: [],
      }),
    );
    new MutationObserver(() => {
      const sample = samples.at(-1);
      if (sample)
        sample.changes.push({
          title: title(),
          elapsed: performance.now() - sample.started,
        });
    }).observe(list, { childList: true, subtree: true, characterData: true });
  });
  const search = page.getByRole("searchbox", { name: "Search tabs" });
  await search.fill("qUaRt");
  await expect(page.locator(".global-search-result strong")).toHaveText(
    "Quarterly goals",
  );
  await search.fill("pErSoNaL");
  await expect(page.locator(".global-search-result strong")).toHaveText(
    "Personal note",
  );
  const samples = await page.evaluate(
    () =>
      (
        window as typeof window & {
          searchTimingSamples: {
            query: string;
            before: string | null;
            changes: { title: string | null; elapsed: number }[];
          }[];
        }
      ).searchTimingSamples,
  );
  expect(samples.map((sample) => sample.query)).toEqual(["qUaRt", "pErSoNaL"]);
  expect(samples[0].before).toBeNull();
  expect(samples[1].before).toBe("Quarterly goals");
  expect(
    samples[0].changes.find((change) => change.title === "Quarterly goals")
      ?.elapsed,
  ).toBeGreaterThanOrEqual(290);
  expect(
    samples[1].changes.find((change) => change.title === "Personal note")
      ?.elapsed,
  ).toBeGreaterThanOrEqual(290);
  expect(samples[1].changes.every((change) => change.title !== null)).toBe(
    true,
  );
  await expect(
    page.locator(".global-search-groups, .global-search-bookmarks"),
  ).toHaveCount(0);
});
